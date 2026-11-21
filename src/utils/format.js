export const inr = (n) => `₹${Number(n).toLocaleString('en-IN')}`;
export const fmtDateTime = (iso) => (iso ? new Date(iso).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) : '—');
export const STATUS_LABEL = {
  PENDING_PAYMENT: 'Awaiting payment', PAYMENT_VERIFICATION_PENDING: 'Payment Verification Pending',
};
export const STATUS_TONE = {
  PENDING_PAYMENT: 'bg-sand text-choc', PAYMENT_VERIFICATION_PENDING: 'bg-amber-100 text-amber-900',
};
