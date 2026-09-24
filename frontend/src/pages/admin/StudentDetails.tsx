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
import { Student } from '../../types';
import { ArrowLeft, GraduationCap, Mail, Building, BookOpen, ShieldCheck, Smartphone, Camera } from 'lucide-react';

export const StudentDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [student, setStudent] = useState<Student | null>(null);

  const fetchStudent = async () => {
    if (!id) return;
    setLoading(true);
    setError(false);
    try {
      const data = await adminService.getStudentById(id);
      setStudent(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudent();
  }, [id]);

  if (loading) {
    return (
      <div className="py-12">
        <LoadingSpinner label="Loading Student Profile..." size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Unable to load student details"
        message="Failed to retrieve requested student record."
        onRetry={fetchStudent}
      />
    );
  }

  if (!student) {
    return (
      <EmptyState
        title="Student record not found"
        description="No student matching the specified ID exists in the system."
        actionLabel="Back to Student Directory"
        onAction={() => navigate('/admin/students')}
      />
    );
  }

  const enrollmentStatus =
    student.faceRegistered && student.deviceRegistered
      ? 'COMPLETED'
      : student.faceRegistered || student.deviceRegistered
      ? 'INCOMPLETE'
      : 'PENDING';

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title={`Student: ${student.name}`}
        subtitle={`Roll Number: ${student.rollNumber}`}
        action={
          <Button
            variant="outline"
            size="sm"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate('/admin/students')}
          >
            Back to Students
          </Button>
        }
      />

      <Card title="Student Information" subtitle="Institutional academic profile">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="flex items-start space-x-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <GraduationCap className="w-4 h-4 text-blue-600 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-500 dark:text-slate-400">Student ID / Roll Number</p>
              <p className="font-mono text-sm font-bold text-slate-800 dark:text-slate-100">{student.rollNumber}</p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <Building className="w-4 h-4 text-blue-600 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-500 dark:text-slate-400">Department</p>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{student.department}</p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <BookOpen className="w-4 h-4 text-blue-600 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-500 dark:text-slate-400">Semester & Section</p>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Semester {student.semester} - Section {student.section}
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <Mail className="w-4 h-4 text-blue-600 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-500 dark:text-slate-400">Email Address</p>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{student.email}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <span className="font-semibold text-slate-600 dark:text-slate-400">Enrollment Status:</span>
            <StatusBadge status={enrollmentStatus} />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <span className="font-semibold text-slate-600 dark:text-slate-400">Account Status:</span>
            <StatusBadge status={student.status} />
          </div>
        </div>
      </Card>

      {/* Non-sensitive verification readiness summary */}
      <Card title="Biometric & Device Verification Status" subtitle="High-level security setup flags">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <Camera className="w-4 h-4 text-blue-600" />
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">Facial Enrollment</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">3D Biometric Reference</p>
              </div>
            </div>
            <StatusBadge status={student.faceRegistered ? 'VERIFIED' : 'PENDING'} />
          </div>

          <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <Smartphone className="w-4 h-4 text-blue-600" />
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">Device Fingerprint</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Bound Hardware Hash</p>
              </div>
            </div>
            <StatusBadge status={student.deviceRegistered ? 'VERIFIED' : 'PENDING'} />
          </div>
        </div>
      </Card>
    </div>
  );
};
