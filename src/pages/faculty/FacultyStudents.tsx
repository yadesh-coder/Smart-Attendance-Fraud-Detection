import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { SearchBar } from '../../components/tables/SearchBar';
import { DataTable, Column } from '../../components/tables/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { facultyService } from '../../services/facultyService';
import { departmentService, Department } from '../../services/departmentService';
import { Student } from '../../types';
import { Plus, Eye, Edit, UserX, AlertCircle } from 'lucide-react';

export const FacultyStudents: React.FC = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');

  useEffect(() => {
    departmentService.getDepartments().then((list) => setDepartments(list || []));
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchStudents = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await facultyService.getAssignedStudents();
        if (isMounted) {
          setStudents(data || []);
        }
      } catch (err: any) {
        if (isMounted) {
          const message = err?.response?.data?.message || err?.message || 'Failed to load students roster from backend server.';
          setError(message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchStudents();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(search.toLowerCase()) ||
      student.rollNumber.toLowerCase().includes(search.toLowerCase()) ||
      student.email.toLowerCase().includes(search.toLowerCase());

    const matchesDept =
      departmentFilter === 'ALL' || student.department === departmentFilter;

    return matchesSearch && matchesDept;
  });

  const columns: Column<Student>[] = [
    {
      header: 'Student ID / Roll',
      cell: (s: Student) => (
        <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
          {s.rollNumber}
        </span>
      ),
    },
    {
      header: 'Full Name',
      cell: (s: Student) => (
        <div>
          <p className="font-bold text-xs text-slate-900 dark:text-slate-100">{s.name}</p>
          <p className="text-[11px] text-slate-500">{s.email}</p>
        </div>
      ),
    },
    {
      header: 'Dept & Sem',
      cell: (s: Student) => (
        <span className="text-xs text-slate-600 dark:text-slate-300">
          {s.department} (Sem {s.semester} - Sec {s.section})
        </span>
      ),
    },
    {
      header: 'Biometric Enrollment',
      cell: (s: Student) => (
        <div className="flex items-center space-x-1.5">
          <StatusBadge status={s.faceRegistered ? 'VERIFIED' : 'PENDING'} />
        </div>
      ),
    },
    {
      header: 'Account Status',
      cell: (s: Student) => <StatusBadge status={s.status} />,
    },
    {
      header: 'Actions',
      cell: (s: Student) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigate(`/faculty/students/${s.id}`)}
            className="p-1.5 text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 rounded-md transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate(`/faculty/students/${s.id}/edit`)}
            className="p-1.5 text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 rounded-md transition-colors"
            title="Edit Student"
          >
            <Edit className="w-4 h-4" />
          </button>
          {s.status === 'ACTIVE' && (
            <button
              onClick={async () => {
                if (window.confirm(`Are you sure you want to deactivate student ${s.name}?`)) {
                  await facultyService.deactivateStudent(s.id);
                  const updated = await facultyService.getAssignedStudents();
                  setStudents(updated);
                }
              }}
              className="p-1.5 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 rounded-md transition-colors"
              title="Deactivate Student"
            >
              <UserX className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assigned Students Roster"
        subtitle="Manage student entries, check biometric enrollment status, and review class mapping."
        action={
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => navigate('/faculty/students/add')}
          >
            Add Student
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
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search student by name, roll number, or email..."
          />
          <div className="flex items-center space-x-2 shrink-0">
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.code || dept.name}>
                  {dept.name} ({dept.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading students roster...</div>
        ) : filteredStudents.length === 0 ? (
          <EmptyState
            title="No students available"
            description="No students were found matching your criteria in your assigned course sections."
            actionLabel="Add New Student"
            onAction={() => navigate('/faculty/students/add')}
          />
        ) : (
          <DataTable
            data={filteredStudents}
            columns={columns}
            keyExtractor={(s) => s.id}
          />
        )}
      </Card>
    </div>
  );
};
