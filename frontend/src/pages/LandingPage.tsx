import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  QrCode,
  UserCheck,
  Smartphone,
  MapPin,
  AlertTriangle,
  Lock,
  EyeOff,
  UserCog,
  GraduationCap,
  Users,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Layers
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { PageTransition } from '../components/common/PageTransition';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleLoginClick = () => {
    navigate('/login');
  };

  return (
    <PageTransition direction="top-left">
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white relative overflow-x-hidden">
      {/* Background Gradients & Glow Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-950/40 via-slate-950 to-slate-950 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-[800px] right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* HEADER NAVBAR */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-1 ring-white/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white block leading-snug">
                Smart Attendance Fraud Detection
              </span>
              <span className="text-xs text-slate-400 font-medium block">
                Secure, Intelligent and Fraud-Resistant Attendance
              </span>
            </div>
          </div>

          <div>
            <Button
              variant="primary"
              size="md"
              onClick={handleLoginClick}
              icon={<ArrowRight className="w-4 h-4" />}
              className="font-semibold shadow-blue-600/20"
            >
              Login
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 relative z-10">
        {/* HERO SECTION */}
        <section className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-950/80 border border-blue-800/60 text-blue-300 text-xs font-medium mb-8">
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            <span>Multi-Signal Attendance & Anti-Proxy Verification</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
            Fraud-Resistant Attendance Powered by <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-sky-400 bg-clip-text text-transparent">Multi-Signal Intelligence</span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Eliminate proxy attendance and unauthorized check-ins. Our platform combines dynamic session QR codes, biometric face verification, privacy-preserving device signals, location geofencing, and cross-signal fraud detection into a single secure pipeline.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              variant="primary"
              size="lg"
              onClick={handleLoginClick}
              icon={<ArrowRight className="w-5 h-5" />}
              className="w-full sm:w-auto px-8 py-3.5 font-semibold text-base shadow-xl shadow-blue-600/30"
            >
              Login to Continue
            </Button>
          </div>

          {/* Verification Badge Highlights */}
          <div className="mt-14 pt-10 border-t border-slate-800/80 grid grid-cols-2 md:grid-cols-5 gap-4 max-w-4xl mx-auto text-xs text-slate-400">
            <div className="flex items-center justify-center space-x-2 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <QrCode className="w-4 h-4 text-blue-400" />
              <span>Dynamic QR</span>
            </div>
            <div className="flex items-center justify-center space-x-2 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>Face AI</span>
            </div>
            <div className="flex items-center justify-center space-x-2 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <Smartphone className="w-4 h-4 text-purple-400" />
              <span>Device Hash</span>
            </div>
            <div className="flex items-center justify-center space-x-2 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <MapPin className="w-4 h-4 text-amber-400" />
              <span>Geofencing</span>
            </div>
            <div className="flex items-center justify-center space-x-2 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 col-span-2 md:col-span-1">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Fraud Detection</span>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section className="py-16 sm:py-24 bg-slate-900/60 border-y border-slate-800/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-blue-400">Verification Pipeline</h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                How It Works: 5-Step Attendance Flow
              </p>
              <p className="mt-3 text-sm text-slate-400">
                Attendance is finalized only after multi-stage verification signals are evaluated.
              </p>
            </div>

            <div className="mt-16 grid grid-cols-1 md:grid-cols-5 gap-6">
              {/* Step 1 */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 relative flex flex-col justify-between hover:border-blue-500/50 transition-colors">
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-base border border-blue-500/30">
                    01
                  </div>
                  <h3 className="text-base font-semibold text-white">Create Session</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Faculty creates an attendance session for a specific course and time slot.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 relative flex flex-col justify-between hover:border-blue-500/50 transition-colors">
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-base border border-blue-500/30">
                    02
                  </div>
                  <h3 className="text-base font-semibold text-white">Generate Unique QR</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    A cryptographically unique, time-limited session QR code is issued by the backend.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 relative flex flex-col justify-between hover:border-blue-500/50 transition-colors">
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-base border border-blue-500/30">
                    03
                  </div>
                  <h3 className="text-base font-semibold text-white">Scan & Submit QR</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Authenticated student scans the active session QR code from their mobile device.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 relative flex flex-col justify-between hover:border-blue-500/50 transition-colors">
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-base border border-blue-500/30">
                    04
                  </div>
                  <h3 className="text-base font-semibold text-white">Multi-Signal Check</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Student identity, face biometrics, device hash, and location signals are cross-checked.
                  </p>
                </div>
              </div>

              {/* Step 5 */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 relative flex flex-col justify-between hover:border-blue-500/50 transition-colors">
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-base border border-blue-500/30">
                    05
                  </div>
                  <h3 className="text-base font-semibold text-white">Fraud Decision</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    The platform evaluates all signals to finalize attendance or flag suspicious proxies.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <span className="text-xs text-slate-500 italic">
                * Note: Verification signals are processed in pipeline stages according to backend service availability.
              </span>
            </div>
          </div>
        </section>

        {/* KEY FEATURES SECTION */}
        <section className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-blue-400">Platform Capabilities</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Key Features & Security Capabilities
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-3 hover:border-slate-700 transition-colors">
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 w-fit">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-white">Dynamic QR Sessions</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Unique, time-limited QR tokens generated per session to prevent static image sharing.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-3 hover:border-slate-700 transition-colors">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 w-fit">
                <UserCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-white">Face Verification</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Biometric face match pipeline ensuring the physical presence of the enrolled student.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-3 hover:border-slate-700 transition-colors">
              <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 w-fit">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-white">Device Fingerprinting</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Privacy-preserving device hash validation to bind attendance to trusted mobile hardware.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-3 hover:border-slate-700 transition-colors">
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 w-fit">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-white">Geolocation Verification</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Geofencing radius validation to confirm the student is physically within classroom bounds.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-3 hover:border-slate-700 transition-colors">
              <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 w-fit">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-white">Fraud & Anomaly Detection</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Multi-signal anomaly algorithms detect proxy attempts, location spoofing, and duplicate scans.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-3 hover:border-slate-700 transition-colors">
              <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 w-fit">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-white">Role-Based Access</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Strict authority boundaries for Admin, Faculty, and Student workspaces and API routes.
              </p>
            </div>

            {/* Feature 7 */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-3 hover:border-slate-700 transition-colors">
              <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 w-fit">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-white">Secure Authentication</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Stateless JWT token authentication issued by central microservice architecture.
              </p>
            </div>

            {/* Feature 8 */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-3 hover:border-slate-700 transition-colors">
              <div className="p-3 rounded-xl bg-teal-500/10 text-teal-400 w-fit">
                <EyeOff className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-white">Privacy Protection</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Zero raw biometric data or raw hardware serials exposed in client-facing APIs.
              </p>
            </div>
          </div>
        </section>

        {/* ROLE OVERVIEW SECTION */}
        <section className="py-20 sm:py-24 bg-slate-900/60 border-y border-slate-800/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-blue-400">Institutional Workspaces</h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Role-Based Workspaces
              </p>
              <p className="mt-3 text-sm text-slate-400">
                Tailored interfaces for every stakeholder in the academic institution.
              </p>
            </div>

            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* ADMIN ROLE */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-8 space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="p-3 rounded-xl bg-purple-600/20 text-purple-400 ring-1 ring-purple-500/30">
                    <UserCog className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">ADMIN</h3>
                    <span className="text-xs text-purple-400 font-medium">System Administrator</span>
                  </div>
                </div>

                <ul className="space-y-3 text-xs text-slate-300">
                  <li className="flex items-start space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <span>Manage faculty identities & credentials</span>
                  </li>
                  <li className="flex items-start space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <span>Monitor platform-wide fraud alerts & proxy attempts</span>
                  </li>
                  <li className="flex items-start space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <span>Configure system thresholds & security settings</span>
                  </li>
                </ul>
              </div>

              {/* FACULTY ROLE */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-8 space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="p-3 rounded-xl bg-blue-600/20 text-blue-400 ring-1 ring-blue-500/30">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">FACULTY</h3>
                    <span className="text-xs text-blue-400 font-medium">Course Instructor</span>
                  </div>
                </div>

                <ul className="space-y-3 text-xs text-slate-300">
                  <li className="flex items-start space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <span>Create & manage student enrollment records</span>
                  </li>
                  <li className="flex items-start space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <span>Launch attendance sessions with dynamic QR tokens</span>
                  </li>
                  <li className="flex items-start space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <span>Monitor real-time session attendance and fraud logs</span>
                  </li>
                </ul>
              </div>

              {/* STUDENT ROLE */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-8 space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="p-3 rounded-xl bg-emerald-600/20 text-emerald-400 ring-1 ring-emerald-500/30">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">STUDENT</h3>
                    <span className="text-xs text-emerald-400 font-medium">Enrolled Student</span>
                  </div>
                </div>

                <ul className="space-y-3 text-xs text-slate-300">
                  <li className="flex items-start space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Complete first-time face & device registration</span>
                  </li>
                  <li className="flex items-start space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Scan active session QR codes for attendance</span>
                  </li>
                  <li className="flex items-start space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>View personal attendance history and verification status</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* PRIVACY & SECURITY SECTION */}
        <section className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-3xl space-y-4 relative z-10">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs">
                <Lock className="w-3.5 h-3.5 text-blue-400" />
                <span>Enterprise Security & Data Privacy</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Privacy-First Architecture & Rigorous Data Protection
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                The Smart Attendance Platform is designed with privacy and security at its foundation:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 text-xs text-slate-300">
                <div className="flex items-start space-x-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <span>Passwords hashed using BCrypt cryptographic standard</span>
                </div>

                <div className="flex items-start space-x-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <span>Stateless JWT tokens with microservice signature validation</span>
                </div>

                <div className="flex items-start space-x-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <span>No raw hardware MACs or IMEIs stored or exposed</span>
                </div>

                <div className="flex items-start space-x-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <span>Zero raw biometric images exposed in client APIs</span>
                </div>

                <div className="flex items-start space-x-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <span>Short-lived, session-bound dynamic QR tokens</span>
                </div>

                <div className="flex items-start space-x-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <span>Backend Spring Security role authorization</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CALL TO ACTION SECTION */}
        <section className="py-16 sm:py-20 bg-gradient-to-b from-slate-900/40 to-slate-950 border-t border-slate-800/80 text-center px-4">
          <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Ready to use secure attendance?
            </h2>
            <p className="text-sm text-slate-400 max-w-xl mx-auto">
              Sign in with your institutional account to access your workspace.
            </p>
            <div className="pt-2">
              <Button
                variant="primary"
                size="lg"
                onClick={handleLoginClick}
                icon={<ArrowRight className="w-5 h-5" />}
                className="px-8 py-3.5 font-semibold text-base shadow-xl shadow-blue-600/30"
              >
                Login to Continue
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-slate-950 border-t border-slate-800/80 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-blue-600 text-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-bold text-white block">
                Smart Attendance Fraud Detection
              </span>
              <span className="text-xs text-slate-400 block">
                Secure attendance through multi-signal verification.
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-400">
            Smart Attendance Platform &copy; 2026. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
    </PageTransition>
  );
};
