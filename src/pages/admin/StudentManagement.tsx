import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorState } from '../../components/common/ErrorState';
import { SearchBar } from '../../components/tables/SearchBar';
import { Filter } from '../../components/tables/Filter';
import { DataTable, Column } from '../../components/tables/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Eye } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { Student } from '../../types';

export const StudentManagement: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [enrollmentStatusFilter, setEnrollmentStatusFilter] = useState('');
  const [accountStatusFilter, setAccountStatusFilter] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);

  const fetchStudents = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await adminService.getStudentList();
      setStudents(data || []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const filteredData = students.filter((item) => {
    const nameStr = (item.name || '').toLowerCase();
    const rollStr = (item.rollNumber || '').toLowerCase();
    const emailStr = (item.email || '').toLowerCase();
    const deptStr = item.department || '';

    const matchesSearch =
      !search ||
      nameStr.includes(search.toLowerCase()) ||
      rollStr.includes(search.toLowerCase()) ||
      emailStr.includes(search.toLowerCase());

    const matchesDept =
      !deptFilter ||
      deptStr === deptFilter ||
      (deptFilter === 'CSE' && (deptStr.includes('Computer') || deptStr.includes('CSE'))) ||
      (deptFilter === 'IT' && (deptStr.includes('Information') || deptStr.includes('IT'))) ||
      (deptFilter === 'ECE' && (deptStr.includes('Electronics') || deptStr.includes('ECE'))) ||
      (deptFilter === 'ME' && (deptStr.includes('Mechanical') || deptStr.includes('ME')));

    const matchesSem = !semesterFilter || String(item.semester) === semesterFilter;
    const matchesSec = !sectionFilter || item.section === sectionFilter;
    const matchesAccStatus = !accountStatusFilter || item.status === accountStatusFilter;

    // Derived enrollment status check
    const enrollmentStatus = item.faceRegistered && item.deviceRegistered ? 'COMPLETED' : item.faceRegistered || item.deviceRegistered ? 'INCOMPLETE' : 'PENDING';
    const matchesEnrollment = !enrollmentStatusFilter || enrollmentStatus === enrollmentStatusFilter;

    return matchesSearch && matchesDept && matchesSem && matchesSec && matchesAccStatus && matchesEnrollment;
  });

  const columns: Column<Student>[] = [
    {
      header: 'Student ID / Roll',
      accessorKey: 'rollNumber',
      cell: (s) => <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">{s.rollNumber}</span>,
    },
    {
      header: 'Name',
      accessorKey: 'name',
      cell: (s) => <span className="font-semibold text-slate-900 dark:text-slate-100">{s.name}</span>,
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
      header: 'Year / Sem',
      cell: (s) => <span>Sem {s.semester}</span>,
    },
    {
      header: 'Section',
      accessorKey: 'section',
    },
    {
      header: 'Enrollment Status',
      cell: (s) => {
        const status = s.faceRegistered && s.deviceRegistered ? 'COMPLETED' : s.faceRegistered || s.deviceRegistered ? 'INCOMPLETE' : 'PENDING';
        return <StatusBadge status={status} />;
      },
    },
    {
      header: 'Account Status',
      cell: (s) => <StatusBadge status={s.status} />,
    },
    {
      header: 'Actions',
      cell: (s) => (
        <Button
          variant="ghost"
          size="sm"
          icon={<Eye className="w-3.5 h-3.5 text-blue-600" />}
          onClick={() => navigate(`/admin/students/${s.id}`)}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Directory"
        subtitle="Institutional student roster and verification enrollment status."
      />

      {/* Multi-filter row */}
      <div className="space-y-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search student by Roll Number, Name, or Email..." />

        <div className="flex flex-wrap items-center gap-2">
          <Filter
            value={deptFilter}
            onChange={setDeptFilter}
            label="All Depts"
            options={[
              { label: 'CSE', value: 'CSE' },
              { label: 'IT', value: 'IT' },
              { label: 'ECE', value: 'ECE' },
              { label: 'ME', value: 'ME' },
            ]}
          />
          <Filter
            value={semesterFilter}
            onChange={setSemesterFilter}
            label="All Semesters"
            options={[
              { label: 'Sem 1', value: '1' },
              { label: 'Sem 2', value: '2' },
              { label: 'Sem 3', value: '3' },
              { label: 'Sem 4', value: '4' },
              { label: 'Sem 5', value: '5' },
              { label: 'Sem 6', value: '6' },
            ]}
          />
          <Filter
            value={sectionFilter}
            onChange={setSectionFilter}
            label="All Sections"
            options={[
              { label: 'Section A', value: 'A' },
              { label: 'Section B', value: 'B' },
              { label: 'Section C', value: 'C' },
            ]}
          />
          <Filter
            value={enrollmentStatusFilter}
            onChange={setEnrollmentStatusFilter}
            label="All Enrollment"
            options={[
              { label: 'Completed', value: 'COMPLETED' },
              { label: 'Incomplete', value: 'INCOMPLETE' },
              { label: 'Pending', value: 'PENDING' },
            ]}
          />
          <Filter
            value={accountStatusFilter}
            onChange={setAccountStatusFilter}
            label="All Account Status"
            options={[
              { label: 'Active', value: 'ACTIVE' },
              { label: 'Suspended', value: 'SUSPENDED' },
            ]}
          />
        </div>
      </div>

      {loading ? (
        <div className="py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex justify-center">
          <LoadingSpinner label="Loading Students..." size="md" />
        </div>
      ) : error ? (
        <ErrorState
          title="Unable to load data."
          message="System failed to load student directory records."
          onRetry={fetchStudents}
        />
      ) : filteredData.length === 0 ? (
        <EmptyState
          title="No students available."
          description="There are currently no student records in the system database."
        />
      ) : (
        <DataTable
          columns={columns}
          data={filteredData}
          keyExtractor={(s) => s.id}
          emptyTitle="No students available."
          emptyDescription="No student records found."
        />
      )}
    </div>
  );
};
