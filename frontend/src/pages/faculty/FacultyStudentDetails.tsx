import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { facultyService } from '../../services/facultyService';
import { Student } from '../../types';
import { ArrowLeft, Edit, ShieldCheck, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export const FacultyStudentDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchDetails = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const data = await facultyService.getStudentById(id);
        if (isMounted) {
          setStudent(data);
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to fetch student profile details from backend.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDetails();
    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-400">Loading student profile details...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/faculty/students')}
            className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-800"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <PageHeader
            title={student ? student.name : 'Student Profile'}
            subtitle={student ? `ID: ${student.rollNumber}` : 'Faculty view of student profile'}
          />
        </div>

        {student && (
          <Button
            variant="outline"
            size="sm"
            icon={<Edit className="w-4 h-4" />}
            onClick={() => navigate(`/faculty/students/${student.id}/edit`)}
          >
            Edit Profile
          </Button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!student ? (
        <Card>
          <div className="p-8 text-center text-slate-500 text-xs">
            Student record with ID "{id}" was not returned by the backend server.
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <Card className="lg:col-span-2" title="Academic & Personal Overview">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-slate-400 font-medium">Roll / Student ID</p>
                <p className="font-mono font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  {student.rollNumber}
                </p>
              </div>

              <div>
                <p className="text-slate-400 font-medium">Full Name</p>
                <p className="font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  {student.name}
                </p>
              </div>

              <div>
                <p className="text-slate-400 font-medium">Official Email</p>
                <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                  {student.email}
                </p>
              </div>

              <div>
                <p className="text-slate-400 font-medium">Department</p>
                <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                  {student.department}
                </p>
              </div>

              <div>
                <p className="text-slate-400 font-medium">Semester & Section</p>
                <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                  Semester {student.semester} - Section {student.section}
                </p>
              </div>

              <div>
                <p className="text-slate-400 font-medium">Account Status</p>
                <div className="mt-1">
                  <StatusBadge status={student.status} />
                </div>
              </div>
            </div>
          </Card>

          {/* Verification Checklist */}
          <Card title="Security & Biometric Status">
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Personal Details
                  </span>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 uppercase">Registered</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  {student.faceRegistered || student.faceEnrollmentStatus === 'COMPLETED' || student.faceEnrollmentStatus === 'REGISTERED' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-500" />
                  )}
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Face Biometrics
                  </span>
                </div>
                <span
                  className={`text-[10px] font-bold uppercase ${
                    student.faceRegistered || student.faceEnrollmentStatus === 'COMPLETED' || student.faceEnrollmentStatus === 'REGISTERED' ? 'text-emerald-600' : 'text-amber-600'
                  }`}
                >
                  {student.faceRegistered || student.faceEnrollmentStatus === 'COMPLETED' || student.faceEnrollmentStatus === 'REGISTERED' ? 'REGISTERED' : 'Pending Setup'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  {student.deviceRegistered || student.deviceEnrollmentStatus === 'COMPLETED' || student.deviceEnrollmentStatus === 'REGISTERED' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-500" />
                  )}
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Device Fingerprint
                  </span>
                </div>
                <span
                  className={`text-[10px] font-bold uppercase ${
                    student.deviceRegistered || student.deviceEnrollmentStatus === 'COMPLETED' || student.deviceEnrollmentStatus === 'REGISTERED' ? 'text-emerald-600' : 'text-amber-600'
                  }`}
                >
                  {student.deviceRegistered || student.deviceEnrollmentStatus === 'COMPLETED' || student.deviceEnrollmentStatus === 'REGISTERED' ? 'REGISTERED' : 'Pending Device'}
                </span>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-xl text-blue-900 dark:text-blue-300 text-[11px]">
                <div className="flex items-center space-x-1.5 font-bold mb-1">
                  <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Privacy Notice</span>
                </div>
                Raw face embedding vectors and hardware device hash tokens are encrypted and managed server-side.
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
