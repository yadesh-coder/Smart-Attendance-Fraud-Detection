import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';
import { attendanceService } from '../../services/attendanceService';
import { subjectService } from '../../services/subjectService';
import { facultyService } from '../../services/facultyService';
import { Subject } from '../../types';
import { ArrowLeft, Plus, AlertCircle, RefreshCw } from 'lucide-react';

export const CreateAttendanceSession: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState<boolean>(true);
  const [subjectFetchError, setSubjectFetchError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    subjectId: '',
    subjectCode: '',
    subjectName: '',
    durationMinutes: 60,
    latitude: null as number | null,
    longitude: null as number | null,
    accuracy: null as number | null,
    timestamp: null as number | null,
    allowedRadiusMeters: 100.0,
  });

  const [locationStatus, setLocationStatus] = useState<'IDLE' | 'ACQUIRING' | 'ACQUIRED' | 'FAILED'>('IDLE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const captureFacultyGps = () => {
    if (!navigator.geolocation) {
      setLocationStatus('FAILED');
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setLocationStatus('ACQUIRING');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const acc = pos.coords.accuracy;
        const ts = pos.timestamp || Date.now();

        if (lat !== null && lat !== undefined && lat >= -90.0 && lat <= 90.0 &&
            lon !== null && lon !== undefined && lon >= -180.0 && lon <= 180.0) {
          setFormData((prev) => ({
            ...prev,
            latitude: lat,
            longitude: lon,
            accuracy: acc,
            timestamp: ts,
          }));
          setLocationStatus('ACQUIRED');
        } else {
          setLocationStatus('FAILED');
        }
      },
      (err) => {
        console.warn('Faculty GPS capture failed:', err.message);
        setLocationStatus('FAILED');
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );
  };

  const loadSubjects = async () => {
    setLoadingSubjects(true);
    setSubjectFetchError(null);
    try {
      let list = await facultyService.getFacultySubjects();
      if (!list || list.length === 0) {
        list = await subjectService.getAllSubjects();
      }
      setSubjects(list || []);
      if (list && list.length > 0) {
        const first = list[0] as any;
        setFormData((prev) => ({
          ...prev,
          subjectId: first.subjectId || first.code || first.id,
          subjectCode: first.code,
          subjectName: first.name,
        }));
      }
    } catch (err) {
      setSubjectFetchError('Unable to load subjects from backend.');
    } finally {
      setLoadingSubjects(false);
    }
  };

  useEffect(() => {
    loadSubjects();
    captureFacultyGps();
  }, []);

  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedVal = e.target.value;
    const sub = subjects.find((s) => (s as any).subjectId === selectedVal || String((s as any).id) === selectedVal || s.code === selectedVal) as any;
    setFormData((prev) => ({
      ...prev,
      subjectId: sub ? (sub.subjectId || sub.id || sub.code) : selectedVal,
      subjectCode: sub ? sub.code : selectedVal,
      subjectName: sub ? sub.name : prev.subjectName,
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation checks
    if (!formData.subjectId && !formData.subjectCode) {
      setError('Subject is required.');
      return;
    }

    // Strict GPS validation: Must have acquired fresh GPS
    if (formData.latitude === null || formData.longitude === null || locationStatus !== 'ACQUIRED') {
      setError('Unable to obtain your current location. Please enable location permission and try again.');
      return;
    }

    setIsSubmitting(true);

    try {
      let created = await facultyService.createSession({
        subjectId: formData.subjectId || formData.subjectCode,
        subjectCode: formData.subjectCode,
        subjectName: formData.subjectName,
        durationMinutes: formData.durationMinutes,
        latitude: formData.latitude,
        longitude: formData.longitude,
        locationAccuracyMeters: formData.accuracy,
        locationTimestamp: formData.timestamp,
        allowedRadiusMeters: Number(formData.allowedRadiusMeters) || 100.0,
      });

      if (!created) {
        created = await attendanceService.createSession({
          subjectCode: formData.subjectCode,
          subjectName: formData.subjectName,
          durationMinutes: formData.durationMinutes,
          latitude: formData.latitude,
          longitude: formData.longitude,
          locationAccuracyMeters: formData.accuracy,
          locationTimestamp: formData.timestamp,
          allowedRadiusMeters: Number(formData.allowedRadiusMeters) || 100.0,
        });
      }

      if (created && created.id) {
        addToast('success', 'Session Created', 'Attendance session created successfully.');
        navigate(`/faculty/sessions/${created.id}`);
      } else {
        setError('Unable to create session.');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Unable to create session.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center space-x-3">
        <button
          onClick={() => navigate('/faculty/sessions')}
          className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-800"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <PageHeader
          title="Create Session"
          subtitle="Configure subject, schedule date and time window for attendance."
        />
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Subject <span className="text-red-500">*</span>
            </label>
            {loadingSubjects ? (
              <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-400">
                Loading subjects...
              </div>
            ) : subjects.length > 0 ? (
              <select
                name="subjectId"
                value={formData.subjectId || formData.subjectCode}
                onChange={handleSubjectChange}
                required
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {subjects.map((sub: any) => {
                  const val = sub.subjectId || sub.id || sub.code;
                  return (
                    <option key={val} value={val}>
                      {sub.code} - {sub.name} ({sub.department})
                    </option>
                  );
                })}
              </select>
            ) : (
              <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-950/30 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
                <span>No subjects available.</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={loadSubjects}
                  icon={<RefreshCw className="w-3 h-3" />}
                >
                  Retry
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Session Duration <span className="text-red-500">*</span>
              </label>
              <select
                name="durationMinutes"
                value={formData.durationMinutes}
                onChange={(e) => setFormData((prev) => ({ ...prev, durationMinutes: Number(e.target.value) }))}
                required
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={15}>15 Minutes</option>
                <option value={30}>30 Minutes</option>
                <option value={45}>45 Minutes</option>
                <option value={60}>60 Minutes (1 Hour)</option>
                <option value={90}>90 Minutes (1.5 Hours)</option>
                <option value={120}>120 Minutes (2 Hours)</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Start time will be initialized to the current server timestamp upon launch.
              </p>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/faculty/sessions')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
              disabled={isSubmitting || (subjects.length === 0 && !formData.subjectCode) || locationStatus !== 'ACQUIRED'}
            >
              {isSubmitting ? 'Creating Session...' : 'Create Attendance Session'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
