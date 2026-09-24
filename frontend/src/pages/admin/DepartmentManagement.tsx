import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';
import { adminService } from '../../services/adminService';
import { Plus, Trash2, Building2, AlertTriangle, X } from 'lucide-react';

interface DepartmentItem {
  id: string;
  name: string;
  code: string;
  createdAt?: string;
}

export const DepartmentManagement: React.FC = () => {
  const { addToast } = useToast();
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [confirmModalDept, setConfirmModalDept] = useState<DepartmentItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const list = await adminService.getDepartments();
      setDepartments(list);
    } catch {
      addToast('error', 'Error', 'Failed to load department records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setIsSubmitting(true);
    try {
      const created = await adminService.addDepartment(newName.trim(), newCode.trim());
      if (created) {
        addToast('success', 'Department Created', `Department "${created.name}" added successfully.`);
        setNewName('');
        setNewCode('');
        setIsAddOpen(false);
        fetchDepartments();
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to create department.';
      addToast('error', 'Creation Failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmModalDept) return;
    setIsDeleting(true);
    setDeleteError(null);

    const res = await adminService.deleteDepartment(confirmModalDept.id);
    if (res.success) {
      addToast('success', 'Department Removed', res.message);
      setConfirmModalDept(null);
      fetchDepartments();
    } else {
      setDeleteError(res.message);
    }
    setIsDeleting(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Department Management"
        subtitle="Manage academic departments, departmental codes, and institutional configurations."
        action={
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsAddOpen(true)}
          >
            Add Department
          </Button>
        }
      />

      {/* Add Department Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Add New Academic Department</h3>
              </div>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Department Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Artificial Intelligence & Data Science"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Department Code *
                </label>
                <input
                  type="text"
                  placeholder="e.g. AIDS"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsAddOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Save Department'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Removal */}
      {confirmModalDept && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-900/80 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-red-600 dark:text-red-400">
              <div className="p-3 rounded-full bg-red-100 dark:bg-red-950/80">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Remove Department?</h3>
                <p className="text-[11px] text-slate-500">{confirmModalDept.name} ({confirmModalDept.code})</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              This department may be assigned to administrators, faculty, students, subjects, or other records. Do you want to continue?
            </p>

            {deleteError && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-semibold">
                {deleteError}
              </div>
            )}

            <div className="pt-2 flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => { setConfirmModalDept(null); setDeleteError(null); }}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isDeleting ? 'Removing...' : 'Remove'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Department List */}
      <Card padding={false}>
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading departments...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="p-3.5">Department Name</th>
                  <th className="p-3.5">Code</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {departments.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">
                      {d.name}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-slate-700 dark:text-slate-300">
                      {d.code}
                    </td>
                    <td className="p-3.5 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Trash2 className="w-3.5 h-3.5 text-red-500" />}
                        onClick={() => { setConfirmModalDept(d); setDeleteError(null); }}
                        className="hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 border-red-200 dark:border-red-900/60 text-red-600"
                      >
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
