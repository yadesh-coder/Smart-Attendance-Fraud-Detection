import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorState } from '../../components/common/ErrorState';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { SearchBar } from '../../components/tables/SearchBar';
import { Filter } from '../../components/tables/Filter';
import { DataTable, Column } from '../../components/tables/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useToast } from '../../context/ToastContext';
import { UserPlus, Eye, Edit, Trash2 } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { FacultyMember } from '../../types';

export const FacultyManagement: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [facultyList, setFacultyList] = useState<FacultyMember[]>([]);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [facultyToDelete, setFacultyToDelete] = useState<FacultyMember | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchFaculty = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await adminService.getFacultyList();
      setFacultyList(data || []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculty();
  }, []);

  const handleOpenDeleteModal = (faculty: FacultyMember) => {
    setFacultyToDelete(faculty);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!facultyToDelete) return;
    setDeleting(true);
    try {
      const result = await adminService.removeFaculty(facultyToDelete.id);
      if (result.success) {
        addToast('success', 'Faculty Removed', result.message || 'Faculty member removed successfully.');
        setFacultyList((prev) => prev.filter((item) => item.id !== facultyToDelete.id));
        fetchFaculty();
      } else {
        addToast('error', 'Removal Failed', result.message || 'Unable to remove faculty member.');
      }
    } catch (err: any) {
      addToast('error', 'Removal Failed', err?.message || 'Failed to communicate with administrative backend.');
    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
      setFacultyToDelete(null);
    }
  };

  const filteredData = facultyList.filter((item) => {
    const nameStr = (item.name || '').toLowerCase();
    const empIdStr = (item.employeeId || '').toLowerCase();
    const emailStr = (item.email || '').toLowerCase();
    const deptStr = item.department || '';

    const matchesSearch =
      !search ||
      nameStr.includes(search.toLowerCase()) ||
      empIdStr.includes(search.toLowerCase()) ||
      emailStr.includes(search.toLowerCase());

    const matchesDept =
      !departmentFilter ||
      deptStr === departmentFilter ||
      (departmentFilter === 'CSE' && (deptStr.includes('Computer') || deptStr.includes('CSE'))) ||
      (departmentFilter === 'IT' && (deptStr.includes('Information') || deptStr.includes('IT'))) ||
      (departmentFilter === 'ECE' && (deptStr.includes('Electronics') || deptStr.includes('ECE'))) ||
      (departmentFilter === 'ME' && (deptStr.includes('Mechanical') || deptStr.includes('ME')));

    const matchesStatus = !statusFilter || item.status === statusFilter;

    return matchesSearch && matchesDept && matchesStatus;
  });

  const columns: Column<FacultyMember>[] = [
    {
      header: 'Faculty ID',
      accessorKey: 'employeeId',
      cell: (f) => <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">{f.employeeId || f.id}</span>,
    },
    {
      header: 'Name',
      accessorKey: 'name',
      cell: (f) => <span className="font-semibold text-slate-900 dark:text-slate-100">{f.name}</span>,
    },
    {
      header: 'Email',
      accessorKey: 'email',
    },
    {
      header: 'Department',
      accessorKey: 'department',
    },
    {
      header: 'Status',
      cell: (f) => <StatusBadge status={f.status} />,
    },
    {
      header: 'Actions',
      cell: (f) => (
        <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            icon={<Eye className="w-3.5 h-3.5 text-blue-600" />}
            onClick={() => navigate(`/admin/faculty/${f.id}`)}
          >
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={<Edit className="w-3.5 h-3.5" />}
            onClick={() => navigate(`/admin/faculty/${f.id}/edit`)}
          >
            Edit
          </Button>
          <Button
            variant="danger"
            size="sm"
            icon={<Trash2 className="w-3.5 h-3.5" />}
            onClick={() => handleOpenDeleteModal(f)}
          >
            Remove
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Faculty Management"
        subtitle="Provision and manage faculty accounts and departmental subject assignments."
        action={
          <Button
            variant="primary"
            size="sm"
            icon={<UserPlus className="w-4 h-4" />}
            onClick={() => navigate('/admin/faculty/add')}
          >
            Add Faculty
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search faculty by ID, name, or email..." />
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter
            value={departmentFilter}
            onChange={setDepartmentFilter}
            label="All Departments"
            options={[
              { label: 'Computer Science', value: 'CSE' },
              { label: 'Information Technology', value: 'IT' },
              { label: 'Electronics & Comm.', value: 'ECE' },
              { label: 'Mechanical Eng.', value: 'ME' },
            ]}
          />
          <Filter
            value={statusFilter}
            onChange={setStatusFilter}
            label="All Statuses"
            options={[
              { label: 'Active', value: 'ACTIVE' },
              { label: 'Inactive', value: 'INACTIVE' },
            ]}
          />
        </div>
      </div>

      {loading ? (
        <div className="py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex justify-center">
          <LoadingSpinner label="Loading Faculty..." size="md" />
        </div>
      ) : error ? (
        <ErrorState
          title="Unable to load data."
          message="Failed to retrieve faculty records from server."
          onRetry={fetchFaculty}
        />
      ) : filteredData.length === 0 ? (
        <EmptyState
          title="No faculty members available."
          description="No faculty members match your query or have been registered in the system yet."
          actionLabel="Add Faculty Member"
          onAction={() => navigate('/admin/faculty/add')}
        />
      ) : (
        <DataTable
          columns={columns}
          data={filteredData}
          keyExtractor={(item) => item.id}
          emptyTitle="No faculty members available."
          emptyDescription="No faculty accounts have been registered."
        />
      )}

      <ConfirmDialog
        isOpen={deleteModalOpen}
        onClose={() => {
          if (!deleting) {
            setDeleteModalOpen(false);
            setFacultyToDelete(null);
          }
        }}
        onConfirm={handleConfirmDelete}
        title="Remove Faculty?"
        message={`This permanently removes the faculty account for ${facultyToDelete?.name || 'this faculty member'} and associated faculty-owned data. This action cannot be undone.`}
        confirmLabel="Remove Faculty"
        cancelLabel="Cancel"
        isDanger={true}
        isLoading={deleting}
      />
    </div>
  );
};
