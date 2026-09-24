import React from 'react';
import { VerificationSummary as VerificationSummaryType } from '../../types';
import { VerificationStatus } from './VerificationStatus';
import { QrCode, Camera, MapPin, Smartphone } from 'lucide-react';

interface VerificationSummaryProps {
  summary?: VerificationSummaryType | null;
  qrStatus?: string;
  faceStatus?: string;
  locationStatus?: string;
  deviceStatus?: string;
}

export const VerificationSummaryComponent: React.FC<VerificationSummaryProps> = ({
  summary,
  qrStatus,
  faceStatus,
  locationStatus,
  deviceStatus,
}) => {
  const qr = summary?.qrStatus || qrStatus || 'VERIFIED';
  const face = summary?.faceStatus || faceStatus || 'VERIFIED';
  const location = summary?.locationStatus || locationStatus || 'VERIFIED';
  const device = summary?.deviceStatus || deviceStatus || 'VERIFIED';

  const items = [
    {
      id: 'qr',
      label: 'QR Verification',
      subtitle: 'Session QR code scan',
      icon: QrCode,
      status: qr,
    },
    {
      id: 'face',
      label: 'Face Verification',
      subtitle: 'Live facial biometric liveness check',
      icon: Camera,
      status: face,
    },
    {
      id: 'location',
      label: 'Location Verification',
      subtitle: 'Classroom geofence match',
      icon: MapPin,
      status: location,
    },
    {
      id: 'device',
      label: 'Device Verification',
      subtitle: 'Registered hardware client check',
      icon: Smartphone,
      status: device,
    },
  ];

  return (
    <div className="space-y-2.5">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.id}
            className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-xs"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-slate-100">{item.label}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{item.subtitle}</p>
              </div>
            </div>
            <VerificationStatus status={item.status} />
          </div>
        );
      })}
    </div>
  );
};
