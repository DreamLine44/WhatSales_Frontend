/**
 * Format a monetary amount using the tenant's configured currency.
 * Falls back to "D" (GMD Dalasi) if no currency is set.
 *
 * @param {number|string} amount
 * @param {string} [currency]  e.g. "GMD", "USD", "NGN"
 * @returns {string}
 */
export function formatCurrency(amount, currency) {
  if (amount == null || amount === '') return '—';
  const num = Number(amount);
  if (isNaN(num)) return '—';

  const formatted = num.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  const sym = getCurrencySymbol(currency);
  return `${sym} ${formatted}`;
}

function getCurrencySymbol(currency) {
  const map = {
    GMD: 'D',
    USD: '$',
    EUR: '€',
    GBP: '£',
    NGN: '₦',
    GHS: '₵',
    XOF: 'CFA',
    MAD: 'MAD',
    EGP: 'EGP',
    KES: 'KSh',
    TZS: 'TSh',
    UGX: 'USh',
    ZAR: 'R',
  };
  if (!currency) return 'D';
  return map[currency.toUpperCase()] || currency.toUpperCase();
}
