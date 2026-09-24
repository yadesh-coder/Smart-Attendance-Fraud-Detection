import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, LogOut, Shield, UserCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../common/Button';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleProfileClick = () => {
    const role = user?.role || 'STUDENT';
    if (role === 'ADMIN') {
      navigate('/admin/profile');
    } else if (role === 'FACULTY') {
      navigate('/faculty/profile');
    } else {
      navigate('/student/profile');
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between transition-colors">
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
          aria-label="Toggle Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:flex items-center space-x-2 text-xs font-semibold px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 rounded-full">
          <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Security Engine Active</span>
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Interactive Profile Summary Button */}
        <button
          onClick={handleProfileClick}
          className="flex items-center space-x-3 border-r border-slate-200 dark:border-slate-800 pr-4 hover:opacity-80 transition-opacity cursor-pointer group text-left"
          title="Click to view & edit your profile"
        >
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {user?.name}
            </p>
            {user?.role !== 'ADMIN' && user?.department && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{user.department}</p>
            )}
          </div>
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs ring-2 ring-blue-100 dark:ring-blue-900 group-hover:ring-blue-400 transition-all">
            {user?.name?.charAt(0) || 'U'}
          </div>
        </button>

        {/* Logout Button */}
        <Button
          variant="ghost"
          size="sm"
          icon={<LogOut className="w-4 h-4 text-slate-500" />}
          onClick={() => logout(navigate)}
          title="Sign out of your session"
        >
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  );
};
