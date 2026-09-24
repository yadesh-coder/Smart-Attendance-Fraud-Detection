import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { VerificationProvider } from './context/VerificationContext';

// Auth & Landing Pages
import { LoginPage } from './pages/auth/LoginPage';
import { LandingPage } from './pages/LandingPage';

// Layout & Route Protection
import { DashboardLayout } from './components/layout/DashboardLayout';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { RoleRoute } from './routes/RoleRoute';

import { DepartmentManagement } from './pages/admin/DepartmentManagement';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { FacultyManagement } from './pages/admin/FacultyManagement';
import { AddFaculty } from './pages/admin/AddFaculty';
import { FacultyDetails } from './pages/admin/FacultyDetails';
import { EditFaculty } from './pages/admin/EditFaculty';
import { StudentManagement } from './pages/admin/StudentManagement';
import { StudentDetails } from './pages/admin/StudentDetails';
import { SubjectManagement } from './pages/admin/SubjectManagement';
import { SubjectDetails } from './pages/admin/SubjectDetails';
import { FraudMonitoring } from './pages/admin/FraudMonitoring';
import { FraudDetails } from './pages/admin/FraudDetails';
import { SystemSettings } from './pages/admin/SystemSettings';
import { AdminProfile } from './pages/admin/AdminProfile';

// Faculty Pages
import { FacultyDashboard } from './pages/faculty/FacultyDashboard';
import { FacultyStudents } from './pages/faculty/FacultyStudents';
import { FacultyAddStudent } from './pages/faculty/FacultyAddStudent';
import { FacultyStudentDetails } from './pages/faculty/FacultyStudentDetails';
import { FacultyEditStudent } from './pages/faculty/FacultyEditStudent';
import { FacultySubjects } from './pages/faculty/FacultySubjects';
import { FacultyAddSubject } from './pages/faculty/FacultyAddSubject';
import { FacultySubjectDetails } from './pages/faculty/FacultySubjectDetails';
import { AttendanceSessions } from './pages/faculty/AttendanceSessions';
import { CreateAttendanceSession } from './pages/faculty/CreateAttendanceSession';
import { SessionDetails } from './pages/faculty/SessionDetails';
import { FacultyFraudAlerts } from './pages/faculty/FacultyFraudAlerts';
import { FacultyFraudDetails } from './pages/faculty/FacultyFraudDetails';
import { FacultyAnalytics } from './pages/faculty/FacultyAnalytics';
import { FacultyReports } from './pages/faculty/FacultyReports';
import { FacultyProfile } from './pages/faculty/FacultyProfile';

// Student Pages
import { StudentDashboard } from './pages/student/StudentDashboard';
import { StudentChangePasswordPage } from './pages/student/StudentChangePasswordPage';
import { FirstTimeSetup } from './pages/student/FirstTimeSetup';
import { LiveSessions } from './pages/student/LiveSessions';
import { StudentVerification } from './pages/student/StudentVerification';
import { QRVerificationPage } from './pages/student/QRVerificationPage';
import { FaceVerificationPage } from './pages/student/FaceVerificationPage';
import { LocationVerificationPage } from './pages/student/LocationVerificationPage';
import { DeviceVerificationPage } from './pages/student/DeviceVerificationPage';
import { VerificationSummaryPage } from './pages/student/VerificationSummaryPage';
import { VerificationResultPage } from './pages/student/VerificationResultPage';
import { StudentAttendance } from './pages/student/StudentAttendance';
import { StudentAttendanceDetails } from './pages/student/StudentAttendanceDetails';
import { StudentProfile } from './pages/student/StudentProfile';

const RootRedirect: React.FC = () => {
  const { isAuthenticated, user, isLoggingOut, authStatus } = useAuth();

  if (isLoggingOut || authStatus === 'LOGGING_OUT' || !isAuthenticated || !user) {
    return <LandingPage />;
  }

  if (user.mustChangePassword) {
    if (user.role === 'STUDENT') {
      return <Navigate to="/student/change-password" replace />;
    }
    if (user.role === 'FACULTY') {
      return <Navigate to="/faculty/profile" replace />;
    }
  }

  switch (user.role) {
    case 'ADMIN':
      return <Navigate to="/admin/dashboard" replace />;
    case 'FACULTY':
      return <Navigate to="/faculty/dashboard" replace />;
    case 'STUDENT':
    default:
      return <Navigate to="/student/dashboard" replace />;
  }
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <VerificationProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<RootRedirect />} />

              {/* Protected Role-based Dashboard Routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<DashboardLayout />}>
                  {/* Admin Routes */}
                  <Route element={<RoleRoute allowedRoles={['ADMIN']} />}>
                    <Route path="/admin/dashboard" element={<AdminDashboard />} />

                    {/* Faculty Management */}
                    <Route path="/admin/faculty" element={<FacultyManagement />} />
                    <Route path="/admin/faculty/add" element={<AddFaculty />} />
                    <Route path="/admin/faculty/:id" element={<FacultyDetails />} />
                    <Route path="/admin/faculty/:id/edit" element={<EditFaculty />} />

                    {/* Student View */}
                    <Route path="/admin/students" element={<StudentManagement />} />
                    <Route path="/admin/students/:id" element={<StudentDetails />} />

                    {/* Subject View */}
                    <Route path="/admin/subjects" element={<SubjectManagement />} />
                    <Route path="/admin/subjects/:id" element={<SubjectDetails />} />

                    {/* Department View */}
                    <Route path="/admin/departments" element={<DepartmentManagement />} />

                    {/* Fraud Monitoring */}
                    <Route path="/admin/fraud" element={<FraudMonitoring />} />
                    <Route path="/admin/fraud/:id" element={<FraudDetails />} />

                    {/* Settings & Profile */}
                    <Route path="/admin/settings" element={<SystemSettings />} />
                    <Route path="/admin/profile" element={<AdminProfile />} />
                  </Route>

                  {/* Faculty Routes */}
                  <Route element={<RoleRoute allowedRoles={['FACULTY']} />}>
                    <Route path="/faculty/dashboard" element={<FacultyDashboard />} />

                    {/* Student Management */}
                    <Route path="/faculty/students" element={<FacultyStudents />} />
                    <Route path="/faculty/students/add" element={<FacultyAddStudent />} />
                    <Route path="/faculty/students/:id" element={<FacultyStudentDetails />} />
                    <Route path="/faculty/students/:id/edit" element={<FacultyEditStudent />} />

                    {/* Subject Management */}
                    <Route path="/faculty/subjects" element={<FacultySubjects />} />
                    <Route path="/faculty/subjects/add" element={<FacultyAddSubject />} />
                    <Route path="/faculty/subjects/:id" element={<FacultySubjectDetails />} />

                    {/* Attendance Sessions */}
                    <Route path="/faculty/sessions" element={<AttendanceSessions />} />
                    <Route path="/faculty/sessions/create" element={<CreateAttendanceSession />} />
                    <Route path="/faculty/sessions/:id" element={<SessionDetails />} />

                    {/* Fraud Monitoring */}
                    <Route path="/faculty/fraud-alerts" element={<FacultyFraudAlerts />} />
                    <Route path="/faculty/fraud-alerts/:id" element={<FacultyFraudDetails />} />

                    {/* Attendance Analytics & Reports */}
                    <Route path="/faculty/analytics" element={<FacultyAnalytics />} />
                    <Route path="/faculty/reports" element={<FacultyReports />} />
                    <Route path="/faculty/profile" element={<FacultyProfile />} />
                  </Route>

                  {/* Student Routes */}
                  <Route element={<RoleRoute allowedRoles={['STUDENT']} />}>
                    <Route path="/student/dashboard" element={<StudentDashboard />} />
                    <Route path="/student/change-password" element={<StudentChangePasswordPage />} />
                    <Route path="/student/first-time-setup" element={<FirstTimeSetup />} />
                    <Route path="/student/live-sessions" element={<LiveSessions />} />
                    <Route path="/student/verification" element={<StudentVerification />} />
                    <Route path="/student/verification/qr" element={<QRVerificationPage />} />
                    <Route path="/student/verification/face" element={<FaceVerificationPage />} />
                    <Route path="/student/verification/location" element={<LocationVerificationPage />} />
                    <Route path="/student/verification/device" element={<DeviceVerificationPage />} />
                    <Route path="/student/verification/summary" element={<VerificationSummaryPage />} />
                    <Route path="/student/verification/result" element={<VerificationResultPage />} />
                    <Route path="/student/attendance" element={<StudentAttendance />} />
                    <Route path="/student/attendance/:id" element={<StudentAttendanceDetails />} />
                    <Route path="/student/profile" element={<StudentProfile />} />
                  </Route>
                </Route>
              </Route>

              {/* Catch-all Wildcard Route */}
              <Route path="*" element={<RootRedirect />} />
            </Routes>
          </VerificationProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
