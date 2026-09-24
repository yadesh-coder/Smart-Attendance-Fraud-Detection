import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  ShieldAlert,
  Settings,
  UserCircle,
  Radio,
  BarChart3,
  CalendarCheck,
  ShieldCheck,
  Building2,
  FileText,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const role = user?.role || 'STUDENT';

  const adminNavItems: NavItem[] = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'Faculty', path: '/admin/faculty', icon: <Users className="w-4 h-4" /> },
    { label: 'Students', path: '/admin/students', icon: <GraduationCap className="w-4 h-4" /> },
    { label: 'Departments', path: '/admin/departments', icon: <Building2 className="w-4 h-4" /> },
    { label: 'Fraud Monitoring', path: '/admin/fraud', icon: <ShieldAlert className="w-4 h-4" /> },
    { label: 'Settings', path: '/admin/settings', icon: <Settings className="w-4 h-4" /> },
    { label: 'Profile', path: '/admin/profile', icon: <UserCircle className="w-4 h-4" /> },
  ];

  const facultyNavItems: NavItem[] = [
    { label: 'Dashboard', path: '/faculty/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'Students', path: '/faculty/students', icon: <GraduationCap className="w-4 h-4" /> },
    { label: 'Subjects', path: '/faculty/subjects', icon: <BookOpen className="w-4 h-4" /> },
    { label: 'Attendance Sessions', path: '/faculty/sessions', icon: <Radio className="w-4 h-4" /> },
    { label: 'Attendance History', path: '/faculty/reports', icon: <FileText className="w-4 h-4" /> },
    { label: 'Fraud Alerts', path: '/faculty/fraud-alerts', icon: <ShieldAlert className="w-4 h-4" /> },
    { label: 'Analytics', path: '/faculty/analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { label: 'Profile', path: '/faculty/profile', icon: <UserCircle className="w-4 h-4" /> },
  ];

  const studentNavItems: NavItem[] = [
    { label: 'Dashboard', path: '/student/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'Live Sessions', path: '/student/live-sessions', icon: <Radio className="w-4 h-4" /> },
    { label: 'Attendance', path: '/student/attendance', icon: <CalendarCheck className="w-4 h-4" /> },
    { label: 'Profile', path: '/student/profile', icon: <UserCircle className="w-4 h-4" /> },
  ];

  const getNavItemsByRole = (r: UserRole): NavItem[] => {
    switch (r) {
      case 'ADMIN':
        return adminNavItems;
      case 'FACULTY':
        return facultyNavItems;
      case 'STUDENT':
      default:
        return studentNavItems;
    }
  };

  const navItems = getNavItemsByRole(role);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/60 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-40 h-full w-64 bg-[#0F172A] border-r border-slate-800 text-slate-300 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-blue-600 text-white shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide leading-tight">Smart Attendance</h2>
              <span className="text-[10px] text-blue-400 font-semibold tracking-wider uppercase">Fraud Guard</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white lg:hidden"
            aria-label="Close Sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Badge Indicator */}
        <div className="px-5 py-3 border-b border-slate-800/60 bg-slate-950/40">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 text-[11px] font-medium">Logged Role</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase bg-blue-950/80 text-blue-300 border border-blue-800/50">
              {role}
            </span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-xs shadow-blue-600/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`
              }
            >
              <span className="shrink-0">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Info Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white uppercase shrink-0">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-200 truncate">{user?.name || 'User'}</p>
              <p className="text-[11px] text-slate-400 truncate">{user?.email || ''}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
