import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { ShieldCheck, Mail, AlertCircle, ArrowRight, Shield, BookOpen, User, Lock, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { FormInput } from '../../components/forms/FormInput';
import { PasswordInput } from '../../components/forms/PasswordInput';
import { Button } from '../../components/common/Button';
import { PageTransition } from '../../components/common/PageTransition';

type RoleType = 'ADMIN' | 'FACULTY' | 'STUDENT';

interface RoleOption {
  id: RoleType;
  label: string;
  badge: string;
  title: string;
  subtitle: string;
  buttonText: string;
  demoEmail: string;
  description: string;
  icon: React.FC<{ className?: string }>;
  accentColor: 'indigo' | 'emerald' | 'purple';
  activeBorder: string;
  activeBg: string;
  activeRing: string;
  badgeBg: string;
  badgeText: string;
  buttonBg: string;
}

const ROLES: RoleOption[] = [
  {
    id: 'ADMIN',
    label: 'Admin',
    badge: 'Administrator',
    title: 'Admin Login',
    subtitle: 'Access system configuration, faculty accounts, and global fraud monitoring.',
    buttonText: 'Login as Admin',
    demoEmail: 'admin@college.edu',
    description: 'Manage faculty, departments, and system configuration.',
    icon: Shield,
    accentColor: 'indigo',
    activeBorder: 'border-indigo-500/60 dark:border-indigo-500/70',
    activeBg: 'bg-indigo-950/40 dark:bg-indigo-950/50 text-indigo-300',
    activeRing: 'ring-indigo-500/30',
    badgeBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    badgeText: 'text-indigo-400',
    buttonBg: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30',
  },
  {
    id: 'FACULTY',
    label: 'Faculty',
    badge: 'Faculty Member',
    title: 'Faculty Login',
    subtitle: 'Manage assigned subjects, broadcast live sessions, and view student attendance.',
    buttonText: 'Login as Faculty',
    demoEmail: 'faculty@college.edu',
    description: 'Manage students, subjects, and attendance sessions.',
    icon: BookOpen,
    accentColor: 'emerald',
    activeBorder: 'border-emerald-500/60 dark:border-emerald-500/70',
    activeBg: 'bg-emerald-950/40 dark:bg-emerald-950/50 text-emerald-300',
    activeRing: 'ring-emerald-500/30',
    badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    badgeText: 'text-emerald-400',
    buttonBg: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30',
  },
  {
    id: 'STUDENT',
    label: 'Student',
    badge: 'Enrolled Student',
    title: 'Student Login',
    subtitle: 'Join broadcast attendance sessions and complete biometric verification.',
    buttonText: 'Login as Student',
    demoEmail: 'yadesh@college.edu',
    description: 'Join sessions and view your attendance.',
    icon: User,
    accentColor: 'purple',
    activeBorder: 'border-purple-500/60 dark:border-purple-500/70',
    activeBg: 'bg-purple-950/40 dark:bg-purple-950/50 text-purple-300',
    activeRing: 'ring-purple-500/30',
    badgeBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    badgeText: 'text-purple-400',
    buttonBg: 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30',
  },
];

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, user, isLoading, error, clearError } = useAuth();

  const [selectedRole, setSelectedRole] = useState<RoleType | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');

  // If already logged in, redirect directly to role dashboard
  if (isAuthenticated && user) {
    if (user.mustChangePassword) {
      if (user.role === 'STUDENT') {
        return <Navigate to="/student/change-password" replace />;
      }
      if (user.role === 'FACULTY') {
        return <Navigate to="/faculty/profile" replace />;
      }
    }
    switch (user.role) {
      case 'ADMIN':
        return <Navigate to="/admin/dashboard" replace />;
      case 'FACULTY':
        return <Navigate to="/faculty/dashboard" replace />;
      case 'STUDENT':
        return <Navigate to="/student/dashboard" replace />;
    }
  }

  const currentRoleConfig = ROLES.find((r) => r.id === selectedRole);

  const handleRoleSelect = (roleId: RoleType) => {
    setFormError('');
    clearError();
    const config = ROLES.find((r) => r.id === roleId);

    if (selectedRole === roleId) {
      // Toggle back to neutral state if clicked twice
      setSelectedRole(null);
      setEmail('');
      setPassword('');
      return;
    }

    setSelectedRole(roleId);
    if (config) {
      setEmail(config.demoEmail);
      setPassword('admin123');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    clearError();

    if (!email.trim()) {
      setFormError('Please enter your institutional email address.');
      return;
    }

    if (!password) {
      setFormError('Please enter your password.');
      return;
    }

    try {
      await login({ email, password });
      const savedUser = JSON.parse(localStorage.getItem('smart_attendance_user') || '{}');
      if (savedUser?.mustChangePassword) {
        if (savedUser.role === 'STUDENT') navigate('/student/change-password', { replace: true });
        else if (savedUser.role === 'FACULTY') navigate('/faculty/profile', { replace: true });
      } else {
        if (savedUser?.role === 'ADMIN') navigate('/admin/dashboard', { replace: true });
        else if (savedUser?.role === 'FACULTY') navigate('/faculty/dashboard', { replace: true });
        else if (savedUser?.role === 'STUDENT') navigate('/student/dashboard', { replace: true });
      }
    } catch {
      // Error handled via AuthContext error state
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Dynamic Background Glow Based on Selected Role */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 pointer-events-none" />
      <div
        className={`absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl transition-all duration-700 pointer-events-none ${
          selectedRole === 'ADMIN'
            ? 'bg-indigo-600/20'
            : selectedRole === 'FACULTY'
            ? 'bg-emerald-600/20'
            : selectedRole === 'STUDENT'
            ? 'bg-purple-600/20'
            : 'bg-blue-600/10'
        }`}
      />
      <div
        className={`absolute -bottom-32 -right-32 w-96 h-96 rounded-full blur-3xl transition-all duration-700 pointer-events-none ${
          selectedRole === 'ADMIN'
            ? 'bg-indigo-600/20'
            : selectedRole === 'FACULTY'
            ? 'bg-emerald-600/20'
            : selectedRole === 'STUDENT'
            ? 'bg-purple-600/20'
            : 'bg-blue-600/10'
        }`}
      />

      <div className="w-full max-w-lg space-y-6 relative z-10">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div
            className={`inline-flex p-3 rounded-2xl text-white shadow-xl mb-1 ring-1 ring-white/20 transition-all duration-300 ${
              selectedRole === 'ADMIN'
                ? 'bg-indigo-600 shadow-indigo-600/30'
                : selectedRole === 'FACULTY'
                ? 'bg-emerald-600 shadow-emerald-600/30'
                : selectedRole === 'STUDENT'
                ? 'bg-purple-600 shadow-purple-600/30'
                : 'bg-blue-600 shadow-blue-600/30'
            }`}
          >
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Smart Attendance</h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            AI-Powered Biometric & Geolocation Fraud Prevention
          </p>
        </div>

        {/* Central Login Box Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6 transition-all duration-300">

          {/* ROLE SELECTOR / DEMO BOX */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Choose Login Role</span>
              </label>
              {selectedRole && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole(null);
                    setEmail('');
                    setPassword('');
                    clearError();
                  }}
                  className="text-[10px] text-slate-400 hover:text-slate-200 underline transition-colors"
                >
                  Clear Selection
                </button>
              )}
            </div>

            {/* Segmented Control Buttons */}
            <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 relative">
              {ROLES.map((role) => {
                const isSelected = selectedRole === role.id;
                const Icon = role.icon;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => handleRoleSelect(role.id)}
                    className={`relative flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-semibold transition-all duration-300 outline-none ${
                      isSelected
                        ? `${role.activeBg} ${role.activeBorder} border shadow-lg ring-1 ${role.activeRing}`
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5">
                      <Icon className={`w-3.5 h-3.5 transition-colors ${isSelected ? role.badgeText : 'text-slate-400'}`} />
                      <span>{role.label}</span>
                    </div>
                    <span className={`text-[10px] font-normal transition-colors mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                      {role.badge}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Subtle Role Description */}
            <div className="min-h-[20px] px-1">
              {currentRoleConfig ? (
                <p className="text-[11px] text-slate-300 flex items-center space-x-1.5 transition-all duration-300 animate-in fade-in">
                  <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${currentRoleConfig.badgeText}`} />
                  <span>{currentRoleConfig.description}</span>
                </p>
              ) : (
                <p className="text-[11px] text-slate-400 italic">
                  Select a role above for demo login context, or sign in directly with institutional credentials.
                </p>
              )}
            </div>
          </div>

          {/* DYNAMIC TITLE HEADER */}
          <div className="border-t border-slate-800/80 pt-5 pb-1 space-y-1 transition-all duration-300">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white transition-all duration-300 flex items-center space-x-2">
                {currentRoleConfig && (
                  <span className={`p-1 rounded-md bg-slate-800 ${currentRoleConfig.badgeText}`}>
                    {React.createElement(currentRoleConfig.icon, { className: 'w-4 h-4' })}
                  </span>
                )}
                <span>{currentRoleConfig ? currentRoleConfig.title : 'Account Authentication'}</span>
              </h2>

              {currentRoleConfig && (
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${currentRoleConfig.badgeBg}`}>
                  {currentRoleConfig.label} Mode
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 transition-all duration-300">
              {currentRoleConfig
                ? currentRoleConfig.subtitle
                : 'Enter your institutional email and password to access your workspace.'}
            </p>
          </div>

          {/* ERROR DISPLAY */}
          {(formError || error) && (
            <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-start space-x-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{formError || error}</span>
            </div>
          )}

          {/* FORM INPUTS */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput
              label="Email Address"
              type="email"
              placeholder={currentRoleConfig ? currentRoleConfig.demoEmail : 'demo@example.com'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              autoComplete="username"
              required
            />

            <PasswordInput
              label="Password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className={`w-full mt-2 font-semibold transition-all duration-300 shadow-lg ${
                currentRoleConfig ? currentRoleConfig.buttonBg : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
              }`}
              isLoading={isLoading}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              {currentRoleConfig ? currentRoleConfig.buttonText : 'Sign In'}
            </Button>
          </form>

          {/* DEMO CREDENTIAL HINT */}
          <div className="pt-4 border-t border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Demo credentials hint:</span>
              <span className="font-mono text-[10px] text-slate-400">Password: password123</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-[10px]">
              {ROLES.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => handleRoleSelect(role.id)}
                  className={`px-2 py-1 rounded-lg border text-center font-mono truncate transition-all ${
                    selectedRole === role.id
                      ? `${role.badgeBg} ${role.badgeText} font-bold`
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                  title={`Select ${role.label} demo credentials`}
                >
                  {role.demoEmail.split('@')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-[11px] text-center text-slate-500">
          Smart Attendance Platform &copy; 2026. All rights reserved.
        </p>
      </div>
    </div>
    </PageTransition>
  );
};
