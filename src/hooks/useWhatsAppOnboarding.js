/**
 * useWhatsAppOnboarding.js
 * Custom hook that manages all tenant-side onboarding state.
 * Isolated — does not touch any existing hooks or context.
 */

import { useState, useEffect, useCallback } from 'react';
import { tenantOnboarding } from '../services/whatsappOnboardingApi';

export function useWhatsAppOnboarding() {
  const [request, setRequest]       = useState(null);   // existing onboarding request or null
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState(null);
  // fetchError is separate from error: it means "we couldn't check status" but
  // does NOT block the form — the user can still submit a new request.
  const [fetchError, setFetchError] = useState(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    setFetchError(null);
    try {
      const res = await tenantOnboarding.getStatus();
      setRequest(res.data?.request || null);
    } catch (err) {
      // 404 = no request exists yet — that's normal, show the form silently
      if (err.response?.status === 404) {
        setRequest(null);
      } else {
        // Any other error: we couldn't confirm status.
        // Do NOT set a hard error that hides the form — set a soft fetchError
        // so the user can still submit. The form may work fine even if status
        // check failed (e.g. route not yet deployed, temporary server error).
        setRequest(null);
        setFetchError(
          err.response?.data?.message ||
          err.message ||
          'Could not check existing request status.'
        );
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
      const res = await tenantOnboarding.submitRequest(formData);
      const newRequest = res.data?.request || res.data;
      setRequest(newRequest);
      setFetchError(null); // clear soft warning on successful submit
      return { success: true, request: newRequest };
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Failed to submit request';
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
    error,       // hard error from submitRequest — shown in form area
    fetchError,  // soft warning from fetchStatus — shown above form but doesn't block it
    fetchStatus,
    submitRequest,
    hasRequest: !!request,
  };
}
