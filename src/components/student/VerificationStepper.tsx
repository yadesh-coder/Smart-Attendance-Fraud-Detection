import React from 'react';
import { QrCode, Camera, MapPin, Smartphone, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface VerificationStepperProps {
  currentStep: 'qr' | 'face' | 'location' | 'device' | 'fraud' | 'summary' | 'result';
  stepStatuses?: {
    qr?: 'PENDING' | 'VERIFIED' | 'FAILED' | 'SUSPICIOUS';
    face?: 'PENDING' | 'VERIFIED' | 'FAILED' | 'SUSPICIOUS';
    location?: 'PENDING' | 'VERIFIED' | 'FAILED' | 'SUSPICIOUS';
    device?: 'PENDING' | 'VERIFIED' | 'FAILED' | 'SUSPICIOUS';
    fraud?: 'PENDING' | 'SAFE' | 'SUSPICIOUS' | 'REJECTED';
    summary?: 'PENDING' | 'VERIFIED' | 'FAILED' | 'SUSPICIOUS';
    result?: 'SAFE' | 'SUSPICIOUS' | 'FAILED' | null;
  };
}

export const VerificationStepper: React.FC<VerificationStepperProps> = ({
  currentStep,
  stepStatuses = {},
}) => {
  const steps = [
    { id: 'qr', label: '1. QR/Code', icon: QrCode },
    { id: 'face', label: '2. Face', icon: Camera },
    { id: 'location', label: '3. Location', icon: MapPin },
    { id: 'device', label: '4. Device', icon: Smartphone },
    { id: 'fraud', label: '5. Fraud Engine', icon: ShieldCheck },
    { id: 'summary', label: '6. Result', icon: CheckCircle2 },
  ];

  const effectiveStep = currentStep === 'result' ? 'summary' : currentStep;
  const getStepIndex = (stepId: string) => steps.findIndex((s) => s.id === stepId);
  const currentIndex = getStepIndex(effectiveStep);

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
      <div className="grid grid-cols-6 gap-2 relative">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isCurrent = step.id === effectiveStep;
          const isPassed = idx < currentIndex;
          const stepStatus = stepStatuses[step.id as keyof typeof stepStatuses];

          let badgeColor = 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
          if (isCurrent) {
            badgeColor = 'bg-blue-600 text-white border-blue-600 shadow-xs shadow-blue-500/30';
          } else if (isPassed || stepStatus === 'VERIFIED' || stepStatus === 'SAFE') {
            badgeColor = 'bg-emerald-500 text-white border-emerald-500';
          } else if (stepStatus === 'FAILED' || stepStatus === 'REJECTED') {
            badgeColor = 'bg-red-500 text-white border-red-500';
          } else if (stepStatus === 'SUSPICIOUS') {
            badgeColor = 'bg-amber-500 text-white border-amber-500';
          }

          return (
            <div key={step.id} className="flex flex-col items-center text-center space-y-2">
              <div
                className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all ${badgeColor}`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span
                className={`text-[10px] font-semibold leading-tight hidden sm:block ${
                  isCurrent
                    ? 'text-blue-600 dark:text-blue-400 font-bold'
                    : isPassed
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
