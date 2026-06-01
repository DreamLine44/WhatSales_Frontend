/**
 * useWhatsAppOnboarding.js
 * Custom hook that manages all tenant-side onboarding state.
 * Isolated — does not touch any existing hooks or context.
 */

import { useState, useEffect, useCallback } from 'react';
import { tenantOnboarding } from '../services/whatsappOnboardingApi';

export function useWhatsAppOnboarding() {
  const [request, setRequest]   = useState(null);   // existing onboarding request or null
  const [loading, setLoading]   = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]       = useState(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await tenantOnboarding.getStatus();
      setRequest(res.data?.request || null);
    } catch (err) {
      // 404 = no request exists yet — that's normal
      if (err.response?.status === 404) {
        setRequest(null);
      } else {
        setError(err.response?.data?.message || 'Failed to load onboarding status');
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
      return { success: true, request: newRequest };
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to submit request';
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
