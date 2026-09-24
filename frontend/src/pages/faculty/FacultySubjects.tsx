import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { EmptyState } from '../../components/common/EmptyState';
import { SearchBar } from '../../components/tables/SearchBar';
import { DataTable, Column } from '../../components/tables/DataTable';
import { facultyService } from '../../services/facultyService';
import { useToast } from '../../context/ToastContext';
import { Subject } from '../../types';
import { Plus, Eye, Trash2, BookOpen, AlertCircle, AlertTriangle } from 'lucide-react';

export const FacultySubjects: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');

  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  const fetchSubjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await facultyService.getFacultySubjects();
      setSubjects(data);
    } catch (err) {
      setError('Failed to fetch faculty subject list from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleDeleteConfirm = async () => {
    if (!subjectToDelete) return;
    setDeleting(true);
    try {
      const ok = await facultyService.deleteSubject(subjectToDelete.subjectId || subjectToDelete.id);
      if (ok) {
        addToast('success', 'Subject Deactivated', `Subject ${subjectToDelete.code} deactivated successfully.`);
        await fetchSubjects();
      } else {
        addToast('error', 'Action Failed', 'Failed to deactivate subject on backend.');
      }
    } catch (err: any) {
      addToast('error', 'Error', err?.message || 'Error deactivating subject.');
    } finally {
      setDeleting(false);
      setSubjectToDelete(null);
    }
  };

  const filteredSubjects = subjects.filter(
    (sub) =>
      sub.code.toLowerCase().includes(search.toLowerCase()) ||
      sub.name.toLowerCase().includes(search.toLowerCase()) ||
      sub.department.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<Subject>[] = [
    {
      header: 'Subject Code',
      cell: (s: Subject) => (
        <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
          {s.code}
        </span>
      ),
    },
    {
      header: 'Subject Name',
      cell: (s: Subject) => (
        <span className="font-bold text-xs text-slate-900 dark:text-slate-100">{s.name}</span>
      ),
    },
    {
      header: 'Department',
      cell: (s: Subject) => (
        <span className="text-xs text-slate-600 dark:text-slate-300">{s.department}</span>
      ),
    },
    {
      header: 'Semester',
      cell: (s: Subject) => (
        <span className="text-xs text-slate-600 dark:text-slate-300">Semester {s.semester}</span>
      ),
    },
    {
      header: 'Section',
      cell: (s: Subject) => (
        <span className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-200">
          Section {s.section}
        </span>
      ),
    },
    {
      header: 'Actions',
      cell: (s: Subject) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            icon={<Eye className="w-3.5 h-3.5" />}
            onClick={() => navigate(`/faculty/subjects/${s.id}`)}
          >
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={<Trash2 className="w-3.5 h-3.5 text-red-500" />}
            onClick={() => setSubjectToDelete(s)}
            className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 border-red-200 dark:border-red-900/60"
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assigned Subjects"
        subtitle="View assigned courses, course codes, and class session parameters."
        action={
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => navigate('/faculty/subjects/add')}
          >
            Add Subject
          </Button>
        }
      />

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Card padding={false}>
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search subject by code or name..."
          />
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading assigned subjects...</div>
        ) : filteredSubjects.length === 0 ? (
          <EmptyState
            title="No subjects available"
            description="You currently do not have any subjects assigned in your faculty profile."
            actionLabel="Add Subject"
            onAction={() => navigate('/faculty/subjects/add')}
            icon={<BookOpen className="w-8 h-8" />}
          />
        ) : (
          <DataTable
            data={filteredSubjects}
            columns={columns}
            keyExtractor={(s) => s.id}
          />
        )}
      </Card>

      {/* Delete Subject Confirmation Modal */}
      {subjectToDelete && (
        <Modal
          isOpen={!!subjectToDelete}
          onClose={() => setSubjectToDelete(null)}
          title="Delete Subject?"
          maxWidth="sm"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-start space-x-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300">
              <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <p className="font-bold">Are you sure you want to delete:</p>
                <p className="font-mono mt-1 text-slate-900 dark:text-slate-100 font-semibold">
                  {subjectToDelete.code} - {subjectToDelete.name}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                  This action deactivates the subject from your active course catalogue. Historical sessions and student attendance records will remain preserved.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSubjectToDelete(null)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
