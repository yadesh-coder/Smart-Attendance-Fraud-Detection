import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { FormInput } from '../../components/forms/FormInput';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import { adminService, SystemSettingsData } from '../../services/adminService';
import { Save, Bell, Shield, Sliders, UserCog } from 'lucide-react';

export const SystemSettings: React.FC = () => {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState<SystemSettingsData>({
    geoFencingRadiusMeters: 50,
    faceRecognitionThreshold: 0.85,
    qrCodeValiditySeconds: 15,
    requireDeviceVerification: true,
    allowProxyAppeal: false,
    notifyOnCriticalFraud: true,
  });

  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState('30');
  const [emailNotifications, setEmailNotifications] = useState(true);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await adminService.getSystemSettings();
      if (data) {
        setSettings(data);
      }
    } catch {
      addToast('error', 'Load Failed', 'Could not retrieve application preferences.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const ok = await adminService.updateSystemSettings(settings);
      if (ok) {
        addToast('success', 'Settings Saved', 'System preferences and security parameters updated successfully.');
      }
    } catch {
      addToast('error', 'Save Error', 'Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12">
        <LoadingSpinner label="Loading Application Preferences..." size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Admin System Settings"
        subtitle="Manage administrative application rules, security policy preferences, and notification channels."
      />

      <form onSubmit={handleSave} className="space-y-6">
        {/* Account Settings */}
        <Card
          title="Account Settings"
          subtitle="Administrative account preferences and session security"
        >
          <div className="space-y-4">
            <FormInput
              label="Admin Inactivity Session Timeout (minutes)"
              type="number"
              value={sessionTimeoutMinutes}
              onChange={(e) => setSessionTimeoutMinutes(e.target.value)}
              helperText="Automatic sign-out duration for inactive administrative portal sessions."
            />
          </div>
        </Card>

        {/* Security Settings */}
        <Card
          title="Security Settings"
          subtitle="Anti-proxy verification policies and parameter rules"
        >
          <div className="space-y-4">
            <FormInput
              label="Allowed Geofence Distance Threshold (Meters)"
              type="number"
              value={settings.geoFencingRadiusMeters}
              onChange={(e) =>
                setSettings({ ...settings, geoFencingRadiusMeters: Number(e.target.value) })
              }
              helperText="Maximum allowed distance between student device coordinate and classroom centroid."
            />

            <FormInput
              label="Dynamic QR Refresh Interval (Seconds)"
              type="number"
              value={settings.qrCodeValiditySeconds}
              onChange={(e) =>
                setSettings({ ...settings, qrCodeValiditySeconds: Number(e.target.value) })
              }
              helperText="Time-based QR code rotation period during active attendance sessions."
            />

            <FormInput
              label="Minimum Facial Match Score Ratio (0.0 to 1.0)"
              type="number"
              step="0.05"
              value={settings.faceRecognitionThreshold}
              onChange={(e) =>
                setSettings({ ...settings, faceRecognitionThreshold: Number(e.target.value) })
              }
              helperText="Confidence score cutoff required to pass biometric face verification."
            />

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs">
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">Require Hardware Device Verification</p>
                <p className="text-slate-500 text-[11px]">Enforce single bound device fingerprint per student</p>
              </div>
              <input
                type="checkbox"
                checked={settings.requireDeviceVerification}
                onChange={(e) => setSettings({ ...settings, requireDeviceVerification: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
            </div>
          </div>
        </Card>

        {/* Notification Preferences */}
        <Card
          title="Notification Preferences"
          subtitle="Alert dispatch & operational channels"
        >
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">Critical Fraud Alert Emails</p>
                <p className="text-slate-500 text-[11px]">Send instant notification when critical anomalies occur</p>
              </div>
              <input
                type="checkbox"
                checked={settings.notifyOnCriticalFraud}
                onChange={(e) => setSettings({ ...settings, notifyOnCriticalFraud: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">System Digest Digest Emails</p>
                <p className="text-slate-500 text-[11px]">Receive daily summary reports of administrative updates</p>
              </div>
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
            </div>
          </div>
        </Card>

        {/* Application Preferences */}
        <Card
          title="Application Preferences"
          subtitle="General portal display choices"
        >
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">Allow Proxy Appeal Workflows</p>
                <p className="text-slate-500 text-[11px]">Enable student appeal submissions for flagged attendance sessions</p>
              </div>
              <input
                type="checkbox"
                checked={settings.allowProxyAppeal}
                onChange={(e) => setSettings({ ...settings, allowProxyAppeal: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
            </div>
          </div>
        </Card>

        <Button
          type="submit"
          variant="primary"
          disabled={saving}
          icon={<Save className="w-4 h-4" />}
        >
          {saving ? 'Saving...' : 'Save System Settings'}
        </Button>
      </form>
    </div>
  );
};
