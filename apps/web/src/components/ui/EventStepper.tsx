const STEPS = [
  { label: 'Planning',     key: 'plan' },
  { label: 'Vendors',      key: 'vendors' },
  { label: 'Advance Paid', key: 'advance' },
  { label: 'Ongoing',      key: 'ongoing' },
  { label: 'Event Day',    key: 'eventday' },
  { label: 'Completed',    key: 'done' },
];



const STATUS_STEP: Record<string, number> = {
  PLANNING: 0,
  VENDORS_PENDING: 1,
  ADVANCE_PAYMENT_PENDING: 1,
  ONGOING: 3,
  EVENT_SOON: 4,
  PAYMENT_REMAINING: 5,
  PAYMENT_OVERDUE: 5,
  COMPLETED: 6,
  FULLY_PAID: 6,
};

interface EventStepperProps {
  status: string;
}

export default function EventStepper({ status }: EventStepperProps) {
  const activeIndex = STATUS_STEP[status] ?? 0;
  const isCompleted = status === 'COMPLETED' || status === 'FULLY_PAID';
  const isRed = status === 'PAYMENT_REMAINING' || status === 'PAYMENT_OVERDUE';
  const isUrgent = status === 'EVENT_SOON';

  return (
    <div className="flex items-center w-full">
      {STEPS.map((step, i) => {
        const done = i < activeIndex;
        const current = i === activeIndex;
        const future = i > activeIndex;

        let circleClass = '';
        if (isCompleted) circleClass = 'bg-emerald-500';
        else if (isRed && i === 5) circleClass = 'bg-red-500';
        else if (done || (current && !future)) circleClass = 'bg-rose-600';
        else circleClass = 'bg-white/10';

        return (
          <div key={step.key} className="flex-1 flex flex-col items-center">
            <div className="flex items-center w-full">
              {/* Left connector */}
              <div className={`flex-1 h-px ${i === 0 ? 'bg-transparent' : done || current || isCompleted ? 'bg-rose-600' : 'bg-white/10'}`} />
              {/* Circle */}
              <div className="relative flex-shrink-0">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center ${circleClass} ${isUrgent && current ? 'ring-2 ring-rose-400 ring-offset-1 ring-offset-transparent animate-pulse' : ''}`}
                >
                  {(done || isCompleted) && (
                    <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
              </div>
              {/* Right connector */}
              <div className={`flex-1 h-px ${i === STEPS.length - 1 ? 'bg-transparent' : done || isCompleted ? 'bg-rose-600' : 'bg-white/10'}`} />
            </div>
            <span className={`text-[9px] mt-1 text-center leading-tight ${future && !isCompleted ? 'text-white/30' : 'text-white/60'}`}>
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
