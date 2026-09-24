import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';
import { adminService } from '../../services/adminService';
import { Subject } from '../../types';
import { ArrowLeft, BookOpen, Building, Calendar, UserCheck, Layers } from 'lucide-react';

export const SubjectDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [subject, setSubject] = useState<(Subject & { academicYear?: string; section?: string; status?: string }) | null>(null);

  const fetchSubject = async () => {
    if (!id) return;
    setLoading(true);
    setError(false);
    try {
      const data = await adminService.getSubjectById(id);
      setSubject(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubject();
  }, [id]);

  if (loading) {
    return (
      <div className="py-12">
        <LoadingSpinner label="Loading Subject Details..." size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Unable to load subject details"
        message="System failed to load the requested subject catalog entry."
        onRetry={fetchSubject}
      />
    );
  }

  if (!subject) {
    return (
      <EmptyState
        title="Subject record not found"
        description="No subject matching the specified ID exists in the catalog."
        actionLabel="Back to Subject Directory"
        onAction={() => navigate('/admin/subjects')}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title={`Subject: ${subject.name}`}
        subtitle={`Course Code: ${subject.code}`}
        action={
          <Button
            variant="outline"
            size="sm"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate('/admin/subjects')}
          >
            Back to Subjects
          </Button>
        }
      />

      <Card title="Course Information" subtitle="Curriculum details & department catalog information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="flex items-start space-x-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <BookOpen className="w-4 h-4 text-blue-600 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-500 dark:text-slate-400">Subject Code</p>
              <p className="font-mono text-sm font-bold text-slate-800 dark:text-slate-100">{subject.code}</p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <Building className="w-4 h-4 text-blue-600 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-500 dark:text-slate-400">Department</p>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{subject.department}</p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <Layers className="w-4 h-4 text-blue-600 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-500 dark:text-slate-400">Semester & Section</p>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Semester {subject.semester} - Section {subject.section || 'A'}
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <Calendar className="w-4 h-4 text-blue-600 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-500 dark:text-slate-400">Academic Year</p>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{subject.academicYear || '2025-2026'}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center space-x-2">
              <UserCheck className="w-4 h-4 text-blue-600" />
              <span className="font-semibold text-slate-600 dark:text-slate-400">Assigned Faculty:</span>
            </div>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {subject.assignedFacultyName || 'Not Assigned'}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <span className="font-semibold text-slate-600 dark:text-slate-400">Status:</span>
            <StatusBadge status={subject.status || 'ACTIVE'} />
          </div>
        </div>
      </Card>
    </div>
  );
};
