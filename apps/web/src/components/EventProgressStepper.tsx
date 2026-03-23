import React from 'react';
import { CheckCircle2, Clock, CreditCard, Users, CalendarCheck, Flag } from 'lucide-react';

export type EventStatus = 'PLANNING' | 'VENDORS_PENDING' | 'PAYMENT_PENDING' | 'ONGOING' | 'EVENT_SOON' | 'COMPLETED' | 'PAYMENT_OVERDUE';

interface Step {
  label: string;
  icon: React.ReactNode;
  description: string;
}

const STEPS: Step[] = [
  { label: 'Planning',   icon: <Clock className="w-4 h-4" />,        description: 'Set date & location' },
  { label: 'Vendors',    icon: <Users className="w-4 h-4" />,        description: 'Book your team' },
  { label: 'Payments',   icon: <CreditCard className="w-4 h-4" />,   description: 'Advance payments' },
  { label: 'Execution',  icon: <CalendarCheck className="w-4 h-4" />, description: 'Event in progress' },
  { label: 'Completed',  icon: <Flag className="w-4 h-4" />,         description: 'Wrap up' },
];

interface EventProgressStepperProps {
  status: EventStatus;
  currentProgress?: number; // 0-100 (optional tasks progress)
  compact?: boolean;
}

export const EventProgressStepper: React.FC<EventProgressStepperProps> = ({ status, compact = false }) => {
  // Map status to current step index
  const getActiveStep = (s: EventStatus): number => {
    switch (s) {
      case 'PLANNING':        return 0;
      case 'VENDORS_PENDING': return 1;
      case 'PAYMENT_PENDING': 
      case 'PAYMENT_OVERDUE': return 2;
      case 'EVENT_SOON':
      case 'ONGOING':         return 3;
      case 'COMPLETED':       return 4;
      default:                return 0;
    }
  };

  const activeIndex = getActiveStep(status);

  if (compact) {
    return (
      <div className="w-full space-y-2">
        <div className="flex justify-between items-center text-[10px] uppercase tracking-wider font-bold">
          <span className="text-slate-500">Milestone</span>
          <span className="text-primary-400">{STEPS[activeIndex].label}</span>
        </div>
        <div className="flex gap-1">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-500 ${
              i < activeIndex ? 'bg-primary-500' :
              i === activeIndex ? 'bg-primary-500 animate-pulse' : 'bg-white/5'
            }`} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-4">
      <div className="relative flex justify-between">
        {/* Background Line */}
        <div className="absolute top-5 left-0 w-full h-0.5 bg-white/5 -z-1" />
        {/* Progress Line */}
        <div 
          className="absolute top-5 left-0 h-0.5 bg-primary-500 transition-all duration-700 -z-1" 
          style={{ width: `${(activeIndex / (STEPS.length - 1)) * 100}%` }}
        />

        {STEPS.map((step, i) => {
          const isCompleted = i < activeIndex;
          const isActive = i === activeIndex;
          
          return (
            <div key={step.label} className="flex flex-col items-center relative z-10 w-1/5">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                isCompleted ? 'bg-primary-600 border-primary-500 text-white' :
                isActive    ? 'bg-[#141724] border-primary-500 text-primary-400 shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]' :
                'bg-[#141724] border-white/10 text-slate-600'
              }`}>
                {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : step.icon}
              </div>
              
              <div className="mt-3 text-center">
                <p className={`text-[11px] font-bold uppercase tracking-tight transition-colors ${
                  isActive ? 'text-white' : isCompleted ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  {step.label}
                </p>
                {!compact && (
                  <p className="text-[9px] text-slate-500 mt-0.5 leading-tight hidden md:block">
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
