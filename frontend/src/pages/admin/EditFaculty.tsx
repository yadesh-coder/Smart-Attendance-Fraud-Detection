import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { FormInput } from '../../components/forms/FormInput';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';
import { adminService } from '../../services/adminService';
import { ArrowLeft, Save } from 'lucide-react';

export const EditFaculty: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    email: '',
    department: '',
    phone: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const loadFaculty = async () => {
    if (!id) return;
    setLoading(true);
    setLoadError(false);
    try {
      const data = await adminService.getFacultyById(id);
      if (data) {
        setFormData({
          employeeId: data.employeeId || data.id,
          name: data.name || '',
          email: data.email || '',
          department: data.department || 'CSE',
          phone: (data as { phone?: string }).phone || '',
          status: data.status || 'ACTIVE',
        });
      }
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFaculty();
  }, [id]);

  const validateForm = () => {
    const errs: Record<string, string> = {};

    if (!formData.name.trim()) {
      errs.name = 'Full Name is required';
    }

    if (!formData.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = 'Please enter a valid email address';
    }

    if (!formData.department.trim()) {
      errs.department = 'Department is required';
    }

    if (formData.phone.trim() && !/^\+?[0-9\s-]{8,15}$/.test(formData.phone)) {
      errs.phone = 'Please enter a valid phone number';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !id) return;

    setSaving(true);
    try {
      const res = await adminService.updateFaculty(id, {
        name: formData.name,
        email: formData.email,
        department: formData.department,
        phone: formData.phone,
        status: formData.status,
      });

      if (res) {
        addToast('success', 'Changes Saved', 'Faculty member details updated successfully.');
        navigate(`/admin/faculty/${id}`);
      } else {
        addToast('info', 'Update Request Sent', 'Faculty information submission dispatched.');
        navigate(`/admin/faculty/${id}`);
      }
    } catch {
      addToast('error', 'Update Failed', 'Unable to save faculty changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12">
        <LoadingSpinner label="Loading Faculty Profile..." size="lg" />
      </div>
    );
  }

  if (loadError) {
    return (
      <ErrorState
        title="Unable to load faculty details"
        message="System could not fetch faculty member information for editing."
        onRetry={loadFaculty}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="Edit Faculty Member"
        subtitle={`Updating information for ${formData.name || 'Faculty Member'}`}
        action={
          <Button
            variant="outline"
            size="sm"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate(`/admin/faculty/${id}`)}
          >
            Cancel
          </Button>
        }
      />

      <Card title="Edit Faculty Credentials" subtitle="Modify authorized departmental & contact details">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            label="Faculty ID / Employee ID"
            value={formData.employeeId}
            disabled
            helperText="Faculty ID cannot be changed once provisioned."
          />

          <FormInput
            label="Full Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={errors.name}
          />

          <FormInput
            label="Institutional Email *"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={errors.email}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Department *
            </label>
            <select
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            >
              <option value="CSE">Computer Science & Engineering (CSE)</option>
              <option value="IT">Information Technology (IT)</option>
              <option value="ECE">Electronics & Communication (ECE)</option>
              <option value="ME">Mechanical Engineering (ME)</option>
            </select>
            {errors.department && <p className="text-xs text-rose-500 mt-1">{errors.department}</p>}
          </div>

          <FormInput
            label="Phone Number"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            error={errors.phone}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Account Status
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })
              }
              className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/admin/faculty/${id}`)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={saving}
              icon={<Save className="w-4 h-4" />}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
