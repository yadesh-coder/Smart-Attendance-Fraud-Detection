import React from 'react';
import { Filter as FilterIcon } from 'lucide-react';

export interface FilterOption {
  label: string;
  value: string;
}

interface FilterProps {
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}

export const Filter: React.FC<FilterProps> = ({
  options,
  value,
  onChange,
  label = 'All Statuses',
  className = '',
}) => {
  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
        <FilterIcon className="w-3.5 h-3.5" />
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 pl-8 pr-7 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 appearance-none cursor-pointer"
      >
        <option value="">{label}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};
