import React from 'react';
import { UserCheck, Camera, Smartphone, CheckCircle2 } from 'lucide-react';

export interface EnrollmentStepperProps {
  currentStep: number; // 1, 2, 3, 4
  stepsCompleted: {
    personalDetails: boolean;
    faceEnrollment: boolean;
    deviceRegistration: boolean;
    complete: boolean;
  };
}

export const EnrollmentStepper: React.FC<EnrollmentStepperProps> = ({
  currentStep,
  stepsCompleted,
}) => {
  const steps = [
    { id: 1, label: '1. Personal Details', icon: UserCheck, isCompleted: stepsCompleted.personalDetails },
    { id: 2, label: '2. Face Enrollment', icon: Camera, isCompleted: stepsCompleted.faceEnrollment },
    { id: 3, label: '3. Device Registration', icon: Smartphone, isCompleted: stepsCompleted.deviceRegistration },
    { id: 4, label: '4. Complete', icon: CheckCircle2, isCompleted: stepsCompleted.complete },
  ];

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
      <div className="grid grid-cols-4 gap-2 relative">
        {steps.map((step) => {
          const Icon = step.icon;
          const isCurrent = step.id === currentStep;
          const isDone = step.isCompleted || step.id < currentStep;

          let badgeColor = 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
          if (isCurrent) {
            badgeColor = 'bg-blue-600 text-white border-blue-600 shadow-xs shadow-blue-500/30';
          } else if (isDone) {
            badgeColor = 'bg-emerald-500 text-white border-emerald-500';
          }

          return (
            <div key={step.id} className="flex flex-col items-center text-center space-y-2">
              <div
                className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all ${badgeColor}`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span
                className={`text-[11px] font-semibold leading-tight hidden sm:block ${
                  isCurrent
                    ? 'text-blue-600 dark:text-blue-400 font-bold'
                    : isDone
                    ? 'text-slate-800 dark:text-slate-200'
                    : 'text-slate-400'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
