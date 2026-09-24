import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { PasswordInput } from '../../components/forms/PasswordInput';
import { useToast } from '../../context/ToastContext';
import { facultyService } from '../../services/facultyService';
import { departmentService, Department } from '../../services/departmentService';
import { ArrowLeft, Save, AlertCircle, CheckCircle2 } from 'lucide-react';

export const FacultyAddStudent: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [formData, setFormData] = useState({
    rollNumber: '',
    name: '',
    email: '',
    phone: '',
    department: '',
    course: 'B.Tech',
    year: '1',
    section: '',
    password: '',
    confirmPassword: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdSummary, setCreatedSummary] = useState<{ studentId: string; name: string; email: string } | null>(null);

  useEffect(() => {
    departmentService.getDepartments().then((list) => {
      setDepartments(list || []);
      if (list && list.length > 0) {
        setFormData((prev) => ({ ...prev, department: prev.department || list[0].code || list[0].name }));
      }
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.rollNumber.trim()) {
      setError('Student ID / Roll Number is required.');
      return false;
    }
    if (!formData.name.trim()) {
      setError('Full Name is required.');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email address is required.');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid institutional email address.');
      return false;
    }
    if (!formData.section.trim()) {
      setError('Section (e.g. A, B, C) is required.');
      return false;
    }
    if (!formData.password) {
      setError('Initial password is required.');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Initial password must be at least 6 characters.');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Password and Confirm Password do not match.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const res = await facultyService.addStudent({
        studentId: formData.rollNumber.trim(),
        rollNumber: formData.rollNumber.trim(),
        name: formData.name.trim(),
        fullName: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        department: formData.department,
        course: formData.course,
        year: formData.year,
        semester: formData.year,
        section: formData.section.trim(),
        password: formData.password,
      });

      addToast('success', 'Student Account Created', 'Student account created successfully.');
      setCreatedSummary({
        studentId: res?.rollNumber || formData.rollNumber,
        name: res?.name || formData.name,
        email: res?.email || formData.email,
      });
    } catch (err: any) {
      const msg = err?.message || err?.response?.data?.message || 'Failed to create student account on the backend server.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (createdSummary) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <PageHeader
          title="Student Account Provisioned"
          subtitle="The student user identity and enrollment profile have been successfully created."
        />

        <Card title="Account Details" subtitle="Student member credentials overview">
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/80 text-emerald-300 text-sm flex items-start space-x-3">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-200">Student account created successfully.</p>
                <p className="text-xs text-emerald-300/80 mt-1">
                  The student can now log in using their email address and the initial password set during creation. Biometric face & device enrollment remains pending initial setup.
                </p>
              </div>
            </div>

            <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 space-y-3 text-xs">
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Student ID / Roll Number:</span>
                <span className="font-mono font-semibold text-slate-200">{createdSummary.studentId}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Full Name:</span>
                <span className="font-semibold text-slate-200">{createdSummary.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Institutional Email:</span>
                <span className="font-mono font-semibold text-slate-200">{createdSummary.email}</span>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setCreatedSummary(null);
                  setFormData({
                    rollNumber: '',
                    name: '',
                    email: '',
                    phone: '',
                    department: 'Computer Science & Engineering',
                    course: 'B.Tech',
                    year: '1',
                    section: 'A',
                    password: '',
                    confirmPassword: '',
                  });
                }}
              >
                Add Another Student
              </Button>
              <Button
                variant="primary"
                onClick={() => navigate('/faculty/students')}
              >
                Go to Student Roster
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center space-x-3">
        <button
          onClick={() => navigate('/faculty/students')}
          className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-800"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <PageHeader
          title="Add New Student"
          subtitle="Provision a student account with initial login password and department assignment."
        />
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Student ID / Roll Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="rollNumber"
                value={formData.rollNumber}
                onChange={handleChange}
                placeholder="e.g. 2024CSE001"
                required
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Alex Morgan"
                required
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="e.g. alex.morgan@college.edu"
                required
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="e.g. +1 555-019-2834"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Department <span className="text-red-500">*</span>
              </label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select Department --</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.code || dept.name}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Course
              </label>
              <input
                type="text"
                name="course"
                value={formData.course}
                onChange={handleChange}
                placeholder="e.g. B.Tech"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Semester <span className="text-red-500">*</span>
              </label>
              <select
                name="year"
                value={formData.year}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Section
              </label>
              <input
                type="text"
                name="section"
                value={formData.section}
                onChange={handleChange}
                placeholder="e.g. A, B"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-4">
            <p className="text-xs font-semibold text-slate-300">Set Initial Authentication Credentials</p>

            <PasswordInput
              label="Initial Password *"
              placeholder="Enter initial password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />

            <PasswordInput
              label="Confirm Initial Password *"
              placeholder="Confirm initial password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            />
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-amber-800 dark:text-amber-300 text-xs">
            <p className="font-bold">First-Time Setup Notice</p>
            <p className="mt-0.5 text-[11px]">
              New student accounts are provisioned with initial passwords. Upon first login, biometric face and device enrollment statuses remain PENDING until real pipeline verification.
            </p>
          </div>

          <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/faculty/students')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              icon={<Save className="w-4 h-4" />}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating Student...' : 'Create Student Account'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
