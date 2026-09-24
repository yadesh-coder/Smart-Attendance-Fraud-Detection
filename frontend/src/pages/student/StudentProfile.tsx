import React, { useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { studentService } from '../../services/studentService';
import { Lock, KeyRound, AlertCircle, Save, ShieldCheck } from 'lucide-react';

export const StudentProfile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { addToast } = useToast();

  const [enrollmentStatus, setEnrollmentStatus] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  React.useEffect(() => {
    studentService.getEnrollmentStatus().then((res) => {
      setEnrollmentStatus(res);
      if (res.enrollmentCompleted && !user?.isFirstTimeSetupComplete) {
        updateUser({ isFirstTimeSetupComplete: true });
      }
    }).catch(() => {});

    studentService.getStudentProfile().then((p) => {
      if (p) setProfile(p);
    }).catch(() => {});
  }, []);

  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!passwordData.currentPassword || !passwordData.newPassword) {
      setPasswordError('Please fill in current and new passwords.');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    setIsChangingPassword(true);

    try {
      await studentService.changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );
      addToast('success', 'Password Updated', 'Password updated successfully.');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setPasswordError(err?.message || 'Failed to change password on backend.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Student Profile & Security"
        subtitle="View read-only academic enrollment details and update account security password."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Read-Only Academic Profile */}
        <Card className="lg:col-span-2" title="Read-Only Academic Enrollment Details">
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Student ID / Roll Number
                </label>
                <div className="flex items-center space-x-2 px-3 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 font-mono font-bold">
                  <Lock className="w-3.5 h-3.5" />
                  <span>{profile?.rollNumber || '362'}</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Account Role
                </label>
                <div className="flex items-center space-x-2 px-3 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 font-bold uppercase">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                  <span>STUDENT</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={profile?.name || user?.name || 'Student Name'}
                disabled
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed font-semibold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Student Official Email
              </label>
              <input
                type="email"
                value={profile?.email || user?.email || 'student@university.edu'}
                disabled
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={profile?.department || 'EEE'}
                  disabled
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Year & Semester
                </label>
                <input
                  type="text"
                  value={profile?.semester ? `Semester ${profile.semester}` : 'Semester 4'}
                  disabled
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Section
                </label>
                <input
                  type="text"
                  value={profile?.section ? `Section ${profile.section}` : 'Section C'}
                  disabled
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed font-medium"
                />
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>First-Time Enrollment & Security Status</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-semibold block">Enrollment Status</span>
                  <StatusBadge status={(enrollmentStatus?.enrollmentCompleted || user?.isFirstTimeSetupComplete) ? 'ACTIVE' : 'PENDING'} label={(enrollmentStatus?.enrollmentCompleted || user?.isFirstTimeSetupComplete) ? 'Completed' : 'Pending'} />
                </div>
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-semibold block">Biometric Face Registration</span>
                  <StatusBadge status={enrollmentStatus?.faceEnrollmentCompleted ? 'ACTIVE' : 'PENDING'} label={enrollmentStatus?.faceEnrollmentCompleted ? 'Registered' : 'Pending'} />
                </div>
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-semibold block">Bound Hardware Device</span>
                  <StatusBadge status={enrollmentStatus?.deviceRegistrationCompleted ? 'ACTIVE' : 'PENDING'} label={enrollmentStatus?.deviceRegistrationCompleted ? 'Registered' : 'Not Registered'} />
                </div>
              </div>
            </div>

            <div className="pt-2 text-[11px] text-slate-400 italic">
              Note: Academic details are locked for student security. To request corrections, please contact your Academic Administrator.
            </div>
          </div>
        </Card>

        {/* Right Column: Password Change Form */}
        <Card title="Change Account Password">
          {passwordError && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Current Password
              </label>
              <input
                type="password"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordInputChange}
                required
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                New Password
              </label>
              <input
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordInputChange}
                required
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordInputChange}
                required
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                icon={<KeyRound className="w-4 h-4" />}
                disabled={isChangingPassword}
                className="w-full justify-center"
              >
                {isChangingPassword ? 'Updating Password...' : 'Change Password'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};
