const Database = require('better-sqlite3');
const path = require('path');

// Create or open the database file
const dbPath = path.join(__dirname, 'she_sync.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
const createUsersTable = `
CREATE TABLE IF NOT EXISTS users (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  email       TEXT UNIQUE NOT NULL,
  password    TEXT NOT NULL,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;

const createCyclesTable = `
CREATE TABLE IF NOT EXISTS cycles (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id         INTEGER NOT NULL REFERENCES users(id),
  start_date      DATE NOT NULL,
  end_date        DATE,
  duration_days   INTEGER,
  avg_flow_level  TEXT CHECK(avg_flow_level IN ('light','moderate','heavy')),
  clot_count      INTEGER DEFAULT 0,
  notes           TEXT,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;

const createFlowReadingsTable = `
CREATE TABLE IF NOT EXISTS flow_readings (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id),
  cycle_id    INTEGER NOT NULL REFERENCES cycles(id),
  reading_date DATE NOT NULL,
  flow_level  TEXT NOT NULL CHECK(flow_level IN ('light','moderate','heavy')),
  intensity   REAL,
  timestamp   DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;

const createClottingLogsTable = `
CREATE TABLE IF NOT EXISTS clotting_logs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id),
  cycle_id    INTEGER NOT NULL REFERENCES cycles(id),
  detected_at DATETIME NOT NULL,
  clot_size   TEXT NOT NULL CHECK(clot_size IN ('small','medium','large')),
  notes       TEXT,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;

const createAlertsTable = `
CREATE TABLE IF NOT EXISTS alerts (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      INTEGER NOT NULL REFERENCES users(id),
  alert_type   TEXT NOT NULL,
  message      TEXT NOT NULL,
  is_read      INTEGER DEFAULT 0,
  triggered_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;

// Execute table creations
db.exec(createUsersTable);
db.exec(createCyclesTable);
db.exec(createFlowReadingsTable);
db.exec(createClottingLogsTable);
db.exec(createAlertsTable);

console.log('Database initialized successfully.');

module.exports = db;