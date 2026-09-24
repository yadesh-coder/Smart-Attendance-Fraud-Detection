import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { FormInput } from '../../components/forms/FormInput';
import { PasswordInput } from '../../components/forms/PasswordInput';
import { useToast } from '../../context/ToastContext';
import { adminService } from '../../services/adminService';
import { departmentService, Department } from '../../services/departmentService';
import { ArrowLeft, UserCheck, CheckCircle2 } from 'lucide-react';

export const AddFaculty: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    email: '',
    department: '',
    designation: 'Professor',
    phone: '',
    password: '',
    confirmPassword: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [createdSummary, setCreatedSummary] = useState<{ employeeId: string; name: string; email: string } | null>(null);

  useEffect(() => {
    departmentService.getDepartments().then((list) => {
      setDepartments(list || []);
      if (list && list.length > 0) {
        setFormData((prev) => ({ ...prev, department: prev.department || list[0].code || list[0].name }));
      }
    });
  }, []);

  const validateForm = () => {
    const errs: Record<string, string> = {};

    if (!formData.employeeId.trim()) {
      errs.employeeId = 'Employee ID is required';
    }

    if (!formData.name.trim()) {
      errs.name = 'Full Name is required';
    }

    if (!formData.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = 'Please enter a valid institutional email address';
    }

    if (!formData.department.trim()) {
      errs.department = 'Department is required';
    }

    if (!formData.designation.trim()) {
      errs.designation = 'Designation is required';
    }

    if (!formData.password) {
      errs.password = 'Initial Password is required';
    } else if (formData.password.length < 6) {
      errs.password = 'Initial Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      errs.confirmPassword = 'Please confirm the initial password';
    } else if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const result = await adminService.addFaculty({
        employeeId: formData.employeeId.trim(),
        name: formData.name.trim(),
        email: formData.email.trim(),
        department: formData.department.trim(),
        designation: formData.designation.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
      });

      if (result) {
        addToast('success', 'Faculty Account Created', 'Faculty account created successfully.');
        setCreatedSummary({
          employeeId: result.employeeId || formData.employeeId,
          name: result.name || formData.name,
          email: result.email || formData.email,
        });
      }
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Unable to create faculty account. Please check inputs and try again.';
      addToast('error', 'Creation Failed', msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (createdSummary) {
    return (
      <div className="space-y-6 max-w-2xl">
        <PageHeader
          title="Faculty Account Provisioned"
          subtitle="The faculty user identity and profile have been successfully created."
        />

        <Card title="Account Details" subtitle="Faculty member credentials overview">
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/80 text-emerald-300 text-sm flex items-start space-x-3">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-200">Faculty account created successfully.</p>
                <p className="text-xs text-emerald-300/80 mt-1">
                  The faculty member can now log in using their email address and the initial password set during creation.
                </p>
              </div>
            </div>

            <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 space-y-3 text-xs">
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Employee ID:</span>
                <span className="font-mono font-semibold text-slate-200">{createdSummary.employeeId}</span>
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
                    employeeId: '',
                    name: '',
                    email: '',
                    department: 'Computer Science',
                    designation: 'Professor',
                    phone: '',
                    password: '',
                    confirmPassword: '',
                    status: 'ACTIVE',
                  });
                }}
              >
                Add Another Faculty
              </Button>
              <Button
                variant="primary"
                onClick={() => navigate('/admin/faculty')}
              >
                Go to Faculty List
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="Add Faculty Member"
        subtitle="Admin-only interface to provision a new faculty account with an initial password."
        action={
          <Button
            variant="outline"
            size="sm"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate('/admin/faculty')}
          >
            Back to Faculty List
          </Button>
        }
      />

      <Card title="Faculty Information" subtitle="Provide official institutional credentials and initial password">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            label="Employee ID / Faculty ID *"
            placeholder="e.g. EMP1002"
            value={formData.employeeId}
            onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
            error={errors.employeeId}
          />

          <FormInput
            label="Full Name *"
            placeholder="e.g. Dr. Sarah Jenkins"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={errors.name}
          />

          <FormInput
            label="Institutional Email Address *"
            type="email"
            placeholder="e.g. s.jenkins@college.edu"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={errors.email}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Department <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select Department --</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.code || dept.name}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
              {errors.department && <p className="mt-1 text-xs text-red-500">{errors.department}</p>}
            </div>

            <FormInput
              label="Designation *"
              placeholder="e.g. Professor"
              value={formData.designation}
              onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              error={errors.designation}
            />
          </div>

          <FormInput
            label="Phone Number"
            placeholder="e.g. +1 555-019-2834"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            error={errors.phone}
          />

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-4">
            <p className="text-xs font-semibold text-slate-300">Set Initial Authentication Credentials</p>

            <PasswordInput
              label="Initial Password *"
              placeholder="Enter initial password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              error={errors.password}
            />

            <PasswordInput
              label="Confirm Initial Password *"
              placeholder="Confirm initial password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              error={errors.confirmPassword}
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/admin/faculty')}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={submitting}
              icon={<UserCheck className="w-4 h-4" />}
            >
              {submitting ? 'Provisioning Account...' : 'Create Faculty Account'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
