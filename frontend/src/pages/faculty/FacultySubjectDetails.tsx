import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { facultyService } from '../../services/facultyService';
import { Subject } from '../../types';
import { ArrowLeft, Radio, BookOpen, AlertCircle } from 'lucide-react';

export const FacultySubjectDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchSubjectDetails = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const data = await facultyService.getSubjectById(id);
        if (isMounted) {
          setSubject(data);
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to fetch subject details from backend API.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchSubjectDetails();
    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-400">Loading subject details...</div>;
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/faculty/subjects')}
            className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-800"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <PageHeader
            title={subject ? `${subject.code} - ${subject.name}` : 'Subject Details'}
            subtitle={subject ? `Department: ${subject.department}` : 'Subject configuration details'}
          />
        </div>

        {subject && (
          <Button
            variant="primary"
            size="sm"
            icon={<Radio className="w-4 h-4" />}
            onClick={() => navigate('/faculty/sessions/create')}
          >
            Launch Session
          </Button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!subject ? (
        <Card>
          <div className="p-8 text-center text-slate-500 text-xs">
            Subject entry with ID "{id}" was not returned by the backend server.
          </div>
        </Card>
      ) : (
        <Card title="Course Information">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            <div>
              <p className="text-slate-400 font-medium">Subject Code</p>
              <p className="font-mono font-bold text-blue-600 dark:text-blue-400 text-base mt-0.5">
                {subject.code}
              </p>
            </div>

            <div>
              <p className="text-slate-400 font-medium">Subject Name</p>
              <p className="font-bold text-slate-900 dark:text-slate-100 text-base mt-0.5">
                {subject.name}
              </p>
            </div>

            <div>
              <p className="text-slate-400 font-medium">Academic Department</p>
              <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                {subject.department}
              </p>
            </div>

            <div>
              <p className="text-slate-400 font-medium">Semester Level</p>
              <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                Semester {subject.semester}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
