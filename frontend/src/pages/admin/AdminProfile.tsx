import React, { useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { FormInput } from '../../components/forms/FormInput';
import { PasswordInput } from '../../components/forms/PasswordInput';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { adminService } from '../../services/adminService';
import { Shield, Mail, Key, User, Save, Lock } from 'lucide-react';

export const AdminProfile: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [profileData, setProfileData] = useState({
    name: user?.name || 'System Administrator',
    email: user?.email || 'admin@college.edu',
    phone: '+1 (555) 019-2834',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passErrors, setPassErrors] = useState<Record<string, string>>({});

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      const ok = await adminService.updateAdminProfile(profileData);
      if (ok) {
        addToast('success', 'Profile Updated', 'Administrator contact details updated.');
      }
    } catch {
      addToast('error', 'Update Failed', 'Unable to update profile info.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};

    if (!passwordData.currentPassword) {
      errs.currentPassword = 'Current password is required';
    }
    if (!passwordData.newPassword) {
      errs.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 8) {
      errs.newPassword = 'New password must be at least 8 characters long';
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }

    setPassErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setPasswordSaving(true);
    try {
      const ok = await adminService.changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );
      if (ok) {
        addToast('success', 'Password Changed', 'Administrator password updated successfully.');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch {
      addToast('error', 'Password Change Failed', 'Could not update password. Please check your credentials.');
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Admin Profile"
        subtitle="View and manage administrative profile, access credentials, and security settings."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="md:col-span-1 text-center py-6">
          <div className="w-20 h-20 rounded-full bg-blue-600 text-white font-bold text-2xl flex items-center justify-center mx-auto mb-3 ring-4 ring-blue-100 dark:ring-blue-950 shadow-md">
            {profileData.name.charAt(0) || 'A'}
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{profileData.name}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{profileData.email}</p>
          <div className="mt-4 flex flex-col items-center gap-1.5">
            <StatusBadge status="ACTIVE" label="System Administrator" />
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Role: {user?.role || 'ADMIN'}
            </span>
          </div>
        </Card>

        {/* Profile Info Form */}
        <Card className="md:col-span-2" title="Administrative Profile Details" subtitle="Authorized account contact info">
          <form onSubmit={handleProfileSave} className="space-y-4">
            <FormInput
              label="Full Name"
              value={profileData.name}
              onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
            />

            <FormInput
              label="Institutional Email"
              type="email"
              value={profileData.email}
              onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
            />

            <FormInput
              label="Phone Number"
              value={profileData.phone}
              onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
            />

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2.5">
                <Shield className="w-4 h-4 text-blue-600" />
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">System Role</p>
                  <p className="text-slate-500 text-[11px]">Role modification is restricted</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-[10px] uppercase">
                {user?.role || 'ADMIN'}
              </span>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={profileSaving}
              icon={<Save className="w-3.5 h-3.5" />}
            >
              {profileSaving ? 'Saving Profile...' : 'Save Profile Changes'}
            </Button>
          </form>
        </Card>
      </div>

      {/* Change Password Card */}
      <Card title="Change Password" subtitle="Update administrative access key">
        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-lg">
          <PasswordInput
            label="Current Password *"
            placeholder="Enter current password"
            value={passwordData.currentPassword}
            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
            error={passErrors.currentPassword}
          />

          <PasswordInput
            label="New Password *"
            placeholder="At least 8 characters"
            value={passwordData.newPassword}
            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
            error={passErrors.newPassword}
          />

          <PasswordInput
            label="Confirm New Password *"
            placeholder="Re-enter new password"
            value={passwordData.confirmPassword}
            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
            error={passErrors.confirmPassword}
          />

          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={passwordSaving}
            icon={<Lock className="w-3.5 h-3.5" />}
          >
            {passwordSaving ? 'Updating Password...' : 'Update Password'}
          </Button>
        </form>
      </Card>
    </div>
  );
};
