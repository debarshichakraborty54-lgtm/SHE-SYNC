<div align="center">

<img src="https://img.shields.io/badge/Google-Solutions%20Challenge%202025-4285F4?style=for-the-badge&logo=google&logoColor=white" />
<img src="https://img.shields.io/badge/Status-Prototype-E8A0BF?style=for-the-badge" />
<img src="https://img.shields.io/badge/License-MIT-5C2D6E?style=for-the-badge" />

<br/>
<br/>

# 🩸 SHE SYNC

### *Smart Menstrual Health Monitoring — Powered by Biosensor Technology*

> A full-stack web application that connects to a biosensor embedded in period wear to monitor blood flow intensity and detect clotting anomalies in real time — giving women meaningful insight into their cycle health.

<br/>

[Features](#-features) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [Database Schema](#-database-schema) • [API Reference](#-api-reference) • [Project Structure](#-project-structure)

</div>

---

## 📖 About The Project

**SHE SYNC** was built for the **Google Solutions Challenge 2025**, addressing the lack of accessible, data-driven menstrual health tools for everyday users.

The concept is simple: a small biosensor embedded inside period pants or a pad continuously tracks the user's menstrual blood flow intensity and flags clotting anomalies. This data is transmitted wirelessly to the SHE SYNC web dashboard, where users can monitor their cycle health, spot irregularities early, and gain personalized health insights over time.

In this prototype, sensor data is **simulated with realistic mock data** to demonstrate the full system end-to-end.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 **User Authentication** | Secure signup/login with JWT tokens and bcrypt-hashed passwords |
| 📊 **Dashboard Home** | Cycle status, days since last period, and delay detection at a glance |
| 📈 **Flow Intensity Graph** | Interactive Chart.js visualization of flow levels across cycle days |
| 🔴 **Blood Clotting Log** | Timestamped log of every clotting event with size classification and notes |
| 📅 **Cycle History** | Full table of past cycles with duration, average flow, and clot counts |
| ⚠️ **Anomaly Alerts** | Auto-generated alerts for delayed periods, heavy flow, and frequent clotting |
| 💡 **Health Insights** | Personalized summary of average cycle length, common flow patterns, and trends |

---

## 🛠 Tech Stack

**Frontend**
- HTML5, CSS3, Vanilla JavaScript
- [Chart.js](https://www.chartjs.org/) via CDN — for blood flow visualizations

**Backend**
- [Node.js](https://nodejs.org/) + [Express.js](https://expressjs.com/) — REST API server
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) — lightweight, file-based database
- [bcryptjs](https://github.com/dcodeIO/bcrypt.js) — password hashing
- [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) — session tokens

---

## 🚀 Getting Started

### Prerequisites

- Node.js `v18` or higher
- npm

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/she-sync.git
cd she-sync

# 2. Install backend dependencies
npm install

# 3. Seed the database with mock sensor data
node backend/seed.js

# 4. Start the server
node backend/server.js
```

### Open the App

Navigate to **`http://localhost:3000`** in your browser.

### Demo Account

Use the pre-seeded demo account to explore all features immediately:

```
Email:    demo@shesync.com
Password: password123
```

---

## 🗂 Project Structure

```
she-sync/
├── backend/
│   ├── server.js          # Express server + all API routes
│   ├── database.js        # SQLite setup + schema creation
│   └── seed.js            # Mock sensor data seeder
├── frontend/
│   ├── index.html         # Login / Signup page
│   ├── dashboard.html     # Main dashboard
│   ├── css/
│   │   └── styles.css     # Global styles
│   └── js/
│       ├── auth.js        # Login/signup logic
│       ├── dashboard.js   # Dashboard rendering + charts
│       └── api.js         # Fetch wrapper for all API calls
├── package.json
└── README.md
```

---

## 🗃 Database Schema

The app uses a local SQLite database (`she_sync.db`) auto-created on first run.

```
users          → id, name, email, password, created_at
cycles         → id, user_id, start_date, end_date, duration_days, avg_flow_level, clot_count
flow_readings  → id, user_id, cycle_id, reading_date, flow_level, intensity, timestamp
clotting_logs  → id, user_id, cycle_id, detected_at, clot_size, notes
alerts         → id, user_id, alert_type, message, is_read, triggered_at
```

---

## 📡 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/signup` | Register a new user |
| `POST` | `/api/auth/login` | Login and receive a JWT |
| `GET` | `/api/cycles` | Get all cycles for the current user |
| `GET` | `/api/cycles/current` | Get the active ongoing cycle |
| `POST` | `/api/cycles` | Start a new cycle |
| `GET` | `/api/flow/:cycleId` | Get flow readings for a cycle |
| `POST` | `/api/flow` | Log a new flow reading |
| `GET` | `/api/clots/:cycleId` | Get clotting log for a cycle |
| `POST` | `/api/clots` | Log a new clotting event |
| `GET` | `/api/alerts` | Get all alerts for the current user |
| `GET` | `/api/insights` | Get personalized health insights |

---

## 🔬 Anomaly Detection Logic

The system automatically generates alerts based on three conditions:

- **🕐 Delayed Period** — triggered when today's date exceeds the user's average cycle length by more than 3 days
- **🩸 Heavy Flow Warning** — triggered when 2 or more consecutive days show `heavy` flow readings
- **⚠️ Frequent Clotting** — triggered when 3 or more clotting events are detected within a 48-hour window

---

## 🔮 Future Roadmap

- [ ] Real-time BLE/Wi-Fi biosensor integration
- [ ] Push notifications for anomaly alerts
- [ ] Export cycle data as PDF health report
- [ ] GP/doctor report sharing feature
- [ ] Multi-language support
- [ ] Mobile app (React Native)

---

## 🤝 Contributing

Contributions are welcome! Please open an issue first to discuss what you'd like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">

Built with 💜 for the **Google Solutions Challenge 2025**

*Empowering women with data-driven menstrual health insights*

</div>
