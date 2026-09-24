import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { adminService } from '../../services/adminService';
import { FacultyMember } from '../../types';
import { ArrowLeft, Edit, Shield, Mail, Phone, Building, UserCheck, UserX, Trash2 } from 'lucide-react';

export const FacultyDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [faculty, setFaculty] = useState<(FacultyMember & { phone?: string; createdAt?: string }) | null>(null);
  const [updating, setUpdating] = useState(false);
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [removing, setRemoving] = useState(false);

  const fetchFacultyDetails = async () => {
    if (!id) return;
    setLoading(true);
    setError(false);
    try {
      const data = await adminService.getFacultyById(id);
      setFaculty(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacultyDetails();
  }, [id]);

  const handleToggleStatus = async () => {
    if (!faculty || !id) return;
    const newStatus = faculty.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setUpdating(true);
    try {
      const ok = await adminService.toggleFacultyStatus(id, newStatus);
      if (ok) {
        setFaculty({ ...faculty, status: newStatus });
        addToast(
          'success',
          'Account Status Updated',
          `Faculty member set to ${newStatus.toLowerCase()}.`
        );
      }
    } catch {
      addToast('error', 'Update Failed', 'Could not update faculty status.');
    } finally {
      setUpdating(false);
    }
  };

  const handleConfirmRemove = async () => {
    if (!id) return;
    setRemoving(true);
    try {
      const res = await adminService.removeFaculty(id);
      if (res.success) {
        addToast('success', 'Faculty Removed', res.message || 'Faculty member removed successfully.');
        navigate('/admin/faculty');
      } else {
        addToast('error', 'Removal Failed', res.message || 'Could not remove faculty member.');
      }
    } catch (err: any) {
      addToast('error', 'Removal Failed', err?.message || 'Failed to communicate with administrative backend.');
    } finally {
      setRemoving(false);
      setRemoveModalOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12">
        <LoadingSpinner label="Loading Faculty Details..." size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Unable to load faculty details"
        message="System could not fetch the requested faculty member record."
        onRetry={fetchFacultyDetails}
      />
    );
  }

  if (!faculty) {
    return (
      <EmptyState
        title="Faculty member not found"
        description="No faculty record matching the given ID exists or data is unavailable."
        actionLabel="Back to Faculty List"
        onAction={() => navigate('/admin/faculty')}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title={`Faculty: ${faculty.name}`}
        subtitle={`Faculty ID: ${faculty.employeeId || faculty.id}`}
        action={
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              icon={<ArrowLeft className="w-4 h-4" />}
              onClick={() => navigate('/admin/faculty')}
            >
              Back
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Edit className="w-4 h-4" />}
              onClick={() => navigate(`/admin/faculty/${faculty.id}/edit`)}
            >
              Edit Faculty
            </Button>
          </div>
        }
      />

      <Card title="Faculty Overview" subtitle="Account details & departmental assignment">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="flex items-start space-x-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <Shield className="w-4 h-4 text-blue-600 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-500 dark:text-slate-400">Faculty ID / Employee ID</p>
              <p className="font-mono text-sm font-bold text-slate-800 dark:text-slate-100">{faculty.employeeId || faculty.id}</p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <Building className="w-4 h-4 text-blue-600 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-500 dark:text-slate-400">Department</p>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{faculty.department}</p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <Mail className="w-4 h-4 text-blue-600 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-500 dark:text-slate-400">Email Address</p>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{faculty.email}</p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <Phone className="w-4 h-4 text-blue-600 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-500 dark:text-slate-400">Phone Number</p>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{faculty.phone || 'Not provided'}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Account Status:</span>
            <StatusBadge status={faculty.status} />
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={updating || removing}
              icon={faculty.status === 'ACTIVE' ? <UserX className="w-3.5 h-3.5 text-amber-600" /> : <UserCheck className="w-3.5 h-3.5 text-emerald-600" />}
              onClick={handleToggleStatus}
            >
              {updating
                ? 'Updating...'
                : faculty.status === 'ACTIVE'
                ? 'Deactivate Account'
                : 'Activate Account'}
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={updating || removing}
              icon={<Trash2 className="w-3.5 h-3.5" />}
              onClick={() => setRemoveModalOpen(true)}
            >
              Remove Faculty
            </Button>
          </div>
        </div>
      </Card>

      <ConfirmDialog
        isOpen={removeModalOpen}
        onClose={() => {
          if (!removing) setRemoveModalOpen(false);
        }}
        onConfirm={handleConfirmRemove}
        title="Remove Faculty?"
        message={`This permanently removes the faculty account for ${faculty.name} and associated faculty-owned data. This action cannot be undone.`}
        confirmLabel="Remove Faculty"
        cancelLabel="Cancel"
        isDanger={true}
        isLoading={removing}
      />
    </div>
  );
};
