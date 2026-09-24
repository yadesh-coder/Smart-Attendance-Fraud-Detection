import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { PasswordInput } from '../../components/forms/PasswordInput';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { facultyService } from '../../services/facultyService';
import { KeyRound, ShieldAlert, AlertCircle } from 'lucide-react';

export const StudentChangePasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { addToast } = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setError('Please fill in all password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);

    try {
      await facultyService.changePassword(currentPassword, newPassword);

      // Update local auth context state
      updateUser({ mustChangePassword: false });

      addToast('success', 'Password Updated', 'Your initial password has been changed successfully.');

      // Proceed to first-time setup as required by student workflow
      navigate('/student/first-time-setup', { replace: true });
    } catch (err: any) {
      const msg = err?.message || err?.response?.data?.message || 'Failed to change password. Please check your current password.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto py-4 sm:py-8">
      <PageHeader
        title="Required Security Update — Change Initial Password"
        subtitle="Your account was provisioned with an initial password. Please set a new secure password to proceed."
      />

      <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/80 text-amber-800 dark:text-amber-300 text-xs flex items-start space-x-3">
        <ShieldAlert className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
        <div>
          <p className="font-bold">First-Login Password Update Mandatory</p>
          <p className="mt-0.5 text-[11px] text-amber-700 dark:text-amber-300/90">
            For security reasons, you must change your initial password before accessing your student dashboard or completing biometric enrollment.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Card title="Account Security" subtitle={`Logged in as ${user?.email || 'Student'}`}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <PasswordInput
            label="Current Password *"
            placeholder="Enter initial password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />

          <PasswordInput
            label="New Password *"
            placeholder="Enter new password (min. 6 chars)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />

          <PasswordInput
            label="Confirm New Password *"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <div className="pt-3">
            <Button
              type="submit"
              variant="primary"
              size="md"
              icon={<KeyRound className="w-4 h-4" />}
              disabled={isSubmitting}
              className="w-full justify-center"
            >
              {isSubmitting ? 'Updating Password...' : 'Change Password & Proceed'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
