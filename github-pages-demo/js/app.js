/**
 * Smart Attendance Fraud Detection - Static Demo JavaScript
 * 
 * IMPORTANT:
 * - 100% Client-Side Simulation Only
 * - Zero Backend / Zero API calls / Zero External Database
 * - Zero Network Requests (No fetch, axios, XMLHttpRequest, WebSocket)
 */

document.addEventListener('DOMContentLoaded', () => {
  // Navigation handling
  initNavigation();

  // Telemetry state
  const demoState = {
    role: 'STUDENT',
    userName: 'Demonstration Student (CS-2026)',
    qrToken: 'QR-DEMO-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
    faceMatchScore: 0,
    faceMatchStatus: 'PENDING',
    locationDistance: 0,
    locationStatus: 'PENDING',
    deviceHash: 'DEV-DEMO-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
    deviceStatus: 'PENDING',
    anomalyScore: 0.05,
    fraudStatus: 'VERIFIED_SAFE',
    attendanceMarked: false
  };

  // UI elements
  const elRoleBtns = document.querySelectorAll('.role-btn');
  const elConsole = document.getElementById('console-output');
  const valQr = document.getElementById('val-qr');
  const valFace = document.getElementById('val-face');
  const valLocation = document.getElementById('val-location');
  const valDevice = document.getElementById('val-device');
  const valAnomaly = document.getElementById('val-anomaly');
  const valStatus = document.getElementById('val-status');

  // Interactive buttons
  const btnLogin = document.getElementById('btn-sim-login');
  const btnQr = document.getElementById('btn-sim-qr');
  const btnFace = document.getElementById('btn-sim-face');
  const btnLocation = document.getElementById('btn-sim-location');
  const btnDevice = document.getElementById('btn-sim-device');
  const btnFraud = document.getElementById('btn-sim-fraud');
  const btnSubmit = document.getElementById('btn-sim-submit');

  // Role switching
  elRoleBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      elRoleBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      const role = e.target.getAttribute('data-role');
      demoState.role = role;
      if (role === 'ADMIN') demoState.userName = 'System Administrator (Demo)';
      else if (role === 'FACULTY') demoState.userName = 'Dr. Sarah Connor (Faculty Demo)';
      else demoState.userName = 'Demonstration Student (CS-2026)';

      logConsole(`Role switched to: [${role}] - Logged in as ${demoState.userName}`, 'info');
    });
  });

  // Simulated Login
  if (btnLogin) {
    btnLogin.addEventListener('click', () => {
      logConsole(`[AUTH] Demo Login simulation: Successfully authenticated as ${demoState.userName} (${demoState.role}). No backend requests were sent.`, 'success');
      alert(`Demo mode: Login simulated for ${demoState.role}.\nNo credentials or network requests were sent.`);
    });
  }

  // Simulated QR Scan
  if (btnQr) {
    btnQr.addEventListener('click', () => {
      demoState.qrToken = 'QR-SESSION-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      if (valQr) valQr.textContent = demoState.qrToken;
      logConsole(`[QR_ENGINE] Generated Dynamic Session QR Token: ${demoState.qrToken} (Valid: 30s)`, 'success');
    });
  }

  // Simulated Face Verification
  if (btnFace) {
    btnFace.addEventListener('click', () => {
      logConsole(`[FACE_AI] Initiating biometric ArcFace feature extraction...`, 'info');
      setTimeout(() => {
        const score = (0.92 + Math.random() * 0.07).toFixed(3);
        demoState.faceMatchScore = score;
        demoState.faceMatchStatus = 'PASSED';
        if (valFace) valFace.textContent = `${(score * 100).toFixed(1)}% Match (PASSED)`;
        logConsole(`[FACE_AI] Biometric Face Match Score: ${score} (Threshold: 0.85) -> MATCH PASSED`, 'success');
      }, 400);
    });
  }

  // Simulated Location Check
  if (btnLocation) {
    btnLocation.addEventListener('click', () => {
      logConsole(`[GEOFENCE] Querying device GPS latitude/longitude against classroom geofence...`, 'info');
      setTimeout(() => {
        const dist = (4.2 + Math.random() * 5).toFixed(1);
        demoState.locationDistance = dist;
        demoState.locationStatus = 'PASSED';
        if (valLocation) valLocation.textContent = `${dist}m within radius (PASSED)`;
        logConsole(`[GEOFENCE] Calculated distance from classroom center: ${dist}m (Radius Limit: 50m) -> PASSED`, 'success');
      }, 400);
    });
  }

  // Simulated Device Verification
  if (btnDevice) {
    btnDevice.addEventListener('click', () => {
      logConsole(`[DEVICE_HASH] Computing privacy-preserving SHA-256 hardware fingerprint...`, 'info');
      setTimeout(() => {
        demoState.deviceHash = 'HW-' + Math.random().toString(36).substring(2, 10).toUpperCase();
        demoState.deviceStatus = 'TRUSTED';
        if (valDevice) valDevice.textContent = `${demoState.deviceHash} (TRUSTED)`;
        logConsole(`[DEVICE_HASH] Hardware Fingerprint Verified: ${demoState.deviceHash} -> TRUSTED DEVICE`, 'success');
      }, 400);
    });
  }

  // Simulated Fraud / Anomaly Calculation
  if (btnFraud) {
    btnFraud.addEventListener('click', () => {
      logConsole(`[FRAUD_ENGINE] Running Isolation Forest ML Anomaly Model over multi-signal vector...`, 'info');
      setTimeout(() => {
        const anomaly = (0.02 + Math.random() * 0.05).toFixed(3);
        demoState.anomalyScore = anomaly;
        demoState.fraudStatus = 'VERIFIED_CLEAN';
        if (valAnomaly) valAnomaly.textContent = `Anomaly: ${anomaly} (LOW RISK)`;
        logConsole(`[FRAUD_ENGINE] Isolation Forest Anomaly Score: ${anomaly} -> VERIFIED CLEAN (Zero Proxy Anomalies)`, 'success');
      }, 500);
    });
  }

  // Submit Demo Attendance
  if (btnSubmit) {
    btnSubmit.addEventListener('click', () => {
      if (demoState.faceMatchStatus !== 'PASSED' || demoState.locationStatus !== 'PASSED') {
        logConsole(`[ATTENDANCE] Warning: Please run Face & Location simulations before submitting attendance.`, 'warn');
      }
      logConsole(`[ATTENDANCE] Finalizing Attendance Submission...`, 'info');
      setTimeout(() => {
        demoState.attendanceMarked = true;
        if (valStatus) valStatus.textContent = 'ATTENDANCE MARKED (PRESENT)';
        logConsole(`[ATTENDANCE] SUCCESS! Attendance record finalized as PRESENT. All signals verified. (Demo Simulation Completed)`, 'success');
        alert('Demo Simulation Complete!\nAttendance status set to PRESENT.\nAll multi-signal checks passed in client-side simulation.');
      }, 600);
    });
  }

  // Console helper
  function logConsole(message, type = 'info') {
    if (!elConsole) return;
    const line = document.createElement('div');
    line.className = `console-line ${type}`;
    const timestamp = new Date().toISOString().split('T')[1].substring(0, 8);
    line.textContent = `[${timestamp}] ${message}`;
    elConsole.appendChild(line);
    elConsole.scrollTop = elConsole.scrollHeight;
  }

  // Hash navigation helper
  function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-links a');
    window.addEventListener('hashchange', updateActiveNav);

    function updateActiveNav() {
      const currentHash = window.location.hash || '#home';
      navLinks.forEach(link => {
        if (link.getAttribute('href') === currentHash) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });
    }
    updateActiveNav();
  }
});
