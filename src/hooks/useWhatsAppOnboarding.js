/**
 * useWhatsAppOnboarding.js
 * Custom hook managing tenant-side onboarding state.
 *
 * FIXES:
 *  [FIX-HOOK-1] submitRequest passes formData through the API service which
 *               maps field names correctly (contactPersonName→contactPerson, etc.)
 *  [FIX-HOOK-2] Error messages read both .error and .message from backend response.
 *  [FIX-HOOK-3] submitRequest reads res.data.request correctly — backend returns
 *               { message, request: { _id, status, businessName, ... } }.
 *  [FIX-HOOK-4] fetchStatus reads res.data.request from backend shape.
 *  [FIX-HOOK-5] 404 AND 400/422 with "no request" body are both treated as
 *               "no existing request" — not as an error state. This prevents
 *               the error banner blocking the form for brand-new users.
 *  [FIX-HOOK-6] submitRequest also clears stale errors on success.
 */

import { useState, useEffect, useCallback } from 'react';
import { tenantOnboarding } from '../services/whatsappOnboardingApi';

export function useWhatsAppOnboarding() {
  const [request, setRequest]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState(null);

  // [FIX-HOOK-5] Detect "no request found" responses beyond just 404
  function isNoRequestError(err) {
    const status = err.response?.status;
    if (status === 404) return true;
    // Some backends return 400 / 200 with empty body when no request exists
    if (status === 400 || status === 422) {
      const msg = (err.response?.data?.error || err.response?.data?.message || '').toLowerCase();
      if (msg.includes('no request') || msg.includes('not found') || msg.includes('does not exist')) {
        return true;
      }
    }
    return false;
  }

  // [FIX-HOOK-4] Read from res.data.request (backend shape: { request: {...} })
  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await tenantOnboarding.getStatus();
      // Handle both { request: {...} } and a bare request object
      const req = res.data?.request ?? (res.data?._id ? res.data : null);
      setRequest(req);
    } catch (err) {
      if (isNoRequestError(err)) {
        // Normal for new tenants — not an error
        setRequest(null);
      } else {
        // [FIX-HOOK-2] Backend uses { error: '...' }
        const msg = err.response?.data?.error || err.response?.data?.message || 'Failed to load onboarding status';
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const submitRequest = useCallback(async (formData) => {
    setSubmitting(true);
    setError(null);
    try {
      // [FIX-HOOK-1] API service handles field name mapping — pass formData through
      const res = await tenantOnboarding.submitRequest(formData);
      // [FIX-HOOK-3] Backend returns { message, request: { _id, status, ... } }
      const newRequest = res.data?.request ?? res.data;
      setRequest(newRequest);
      return { success: true, request: newRequest };
    } catch (err) {
      // [FIX-HOOK-2] Read .error first, then .message, then generic fallback
      const errData = err.response?.data;
      let msg = errData?.error || errData?.message || 'Failed to submit request';
      // If there's a details array (validation errors), show the first one
      if (Array.isArray(errData?.details) && errData.details.length > 0) {
        msg = errData.details[0];
      }
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setSubmitting(false);
    }
  }, []);

  return {
    request,
    loading,
    submitting,
    error,
    fetchStatus,
    submitRequest,
    hasRequest: !!request,
  };
}
