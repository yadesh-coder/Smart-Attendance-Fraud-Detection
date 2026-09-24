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
import { Subject } from '../../types';

export const SubjectManagement: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [subjects, setSubjects] = useState<(Subject & { academicYear?: string; section?: string; status?: string })[]>([]);

  const fetchSubjects = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await adminService.getSubjectList();
      setSubjects(data || []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const filteredData = subjects.filter((item) => {
    const matchesSearch =
      !search ||
      item.code.toLowerCase().includes(search.toLowerCase()) ||
      item.name.toLowerCase().includes(search.toLowerCase());

    const matchesDept = !deptFilter || item.department === deptFilter;
    const matchesSem = !semesterFilter || String(item.semester) === semesterFilter;

    return matchesSearch && matchesDept && matchesSem;
  });

  const columns: Column<Subject & { academicYear?: string; section?: string; status?: string }>[] = [
    {
      header: 'Subject Code',
      accessorKey: 'code',
      cell: (s) => <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">{s.code}</span>,
    },
    {
      header: 'Subject Name',
      accessorKey: 'name',
      cell: (s) => <span className="font-semibold text-slate-900 dark:text-slate-100">{s.name}</span>,
    },
    {
      header: 'Department',
      accessorKey: 'department',
    },
    {
      header: 'Semester',
      cell: (s) => <span>Semester {s.semester}</span>,
    },
    {
      header: 'Academic Year',
      cell: (s) => <span>{s.academicYear || '2025-2026'}</span>,
    },
    {
      header: 'Section',
      cell: (s) => <span>{s.section || 'A'}</span>,
    },
    {
      header: 'Status',
      cell: (s) => <StatusBadge status={s.status || 'ACTIVE'} />,
    },
    {
      header: 'Actions',
      cell: (s) => (
        <Button
          variant="ghost"
          size="sm"
          icon={<Eye className="w-3.5 h-3.5 text-blue-600" />}
          onClick={() => navigate(`/admin/subjects/${s.id}`)}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subject Directory"
        subtitle="View academic course offerings, department assignments, and faculty allocations."
      />

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search subject code or name..." />
        <div className="flex items-center gap-2 w-full sm:w-auto">
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
            ]}
          />
        </div>
      </div>

      {loading ? (
        <div className="py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex justify-center">
          <LoadingSpinner label="Loading Subjects..." size="md" />
        </div>
      ) : error ? (
        <ErrorState
          title="Unable to load data."
          message="Failed to retrieve subject records from server."
          onRetry={fetchSubjects}
        />
      ) : filteredData.length === 0 ? (
        <EmptyState
          title="No subjects available."
          description="There are currently no subjects configured in the course catalog."
        />
      ) : (
        <DataTable
          columns={columns}
          data={filteredData}
          keyExtractor={(s) => s.id}
          emptyTitle="No subjects available."
          emptyDescription="No subjects available."
        />
      )}
    </div>
  );
};
