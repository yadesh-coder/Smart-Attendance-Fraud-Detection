# Smart Attendance Fraud Detection - Static Demo Website

This directory contains the **standalone static demonstration website** for the **Smart Attendance Fraud Detection** project.

## Live GitHub Pages Demo URL

```text
https://yadesh-coder.github.io/Smart-Attendance-Fraud-Detection/
```

---

## Key Overview

- **Static Webpage**: HTML5, CSS3, and Vanilla JavaScript.
- **Zero Backend Required**: Operates completely in the browser.
- **Zero Database Required**: No MySQL, SQLite, or external database.
- **Zero Real Data**: No personal biometric images, real credentials, or actual location tracking are processed or stored.
- **Interactive Multi-Signal Simulation**: All verification signals (Dynamic QR, Face AI Embedding Match, GPS Geofencing, Hardware Hash, and Isolation Forest ML Anomaly Score) are simulated interactively in client-side JavaScript.

---

## Repository Structure Separation

This static demo website is strictly isolated from the real microservices platform:

```text
Smart-Attendance-Fraud-Detection/
├── backend/                  # Real Java Spring Boot microservices & Python ML service
├── frontend/                 # Real React 18 / Vite workspace application
├── tests/                    # Cross-service integration test suite
├── github-pages-demo/        # Standalone GitHub Pages static demo website (This Directory)
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   └── app.js
│   └── README.md
├── .github/
│   └── workflows/
│       └── github-pages-demo.yml  # Automated GitHub Pages deployment workflow
└── README.md
```

The real Spring Boot microservices and React application remain intact under `backend/` and `frontend/`.
