const STYLES: Record<string, [string, string]> = {
  PLANNING:                ['#EFF6FF', '#2563EB'],
  VENDORS_PENDING:         ['#FEF3C7', '#D97706'],
  ADVANCE_PAYMENT_PENDING: ['#FFF7ED', '#EA580C'],
  ONGOING:                 ['#F5F3FF', '#7C3AED'],
  EVENT_SOON:              ['#FDF2F8', '#DB2777'],
  PAYMENT_REMAINING:       ['#FEF2F2', '#DC2626'],
  PAYMENT_OVERDUE:         ['#FEF2F2', '#B91C1C'],
  COMPLETED:               ['#ECFDF5', '#059669'],
  FULLY_PAID:              ['#ECFDF5', '#059669'],
  PENDING:                 ['#FEF3C7', '#D97706'],
  APPROVED:                ['#EFF6FF', '#2563EB'],
  REJECTED:                ['#FEF2F2', '#DC2626'],
  ADVANCE_PAID:            ['#F5F3FF', '#7C3AED'],
  PAID:                    ['#ECFDF5', '#059669'],
  UNPAID:                  ['#FEF2F2', '#DC2626'],
};

const LABELS: Record<string, string> = {
  PLANNING: 'Planning',
  VENDORS_PENDING: 'Vendors Pending',
  ADVANCE_PAYMENT_PENDING: 'Advance Due',
  ONGOING: 'Ongoing',
  EVENT_SOON: 'Event Soon',
  PAYMENT_REMAINING: 'Payment Due',
  PAYMENT_OVERDUE: 'Overdue',
  COMPLETED: 'Completed',
  ALLY_PAID: 'Fully Paid',
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  ADVANCE_PAID: 'Advance Paid',
  PAID: 'Paid',
  UNPAID: 'Unpaid',
};

export function StatusBadge({ status }: { status: string }) {
  const [bg, text] = STYLES[status] ?? ['#F3F4F6', '#6B7280'];
  const label = LABELS[status] ?? status;
  return (
    <span style={{ background: bg, color: text, fontSize: 11, fontWeight: 500, padding: '2px 10px', borderRadius: 20, whiteSpace: 'nowrap', display: 'inline-block' }}>
      {label}
    </span>
  );
}
