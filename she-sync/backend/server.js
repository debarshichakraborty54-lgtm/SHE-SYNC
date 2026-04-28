const express = require('express');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./database');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'your-secret-key'; // In production, use environment variable

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Middleware to verify JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Auth routes
app.post('/api/auth/signup', async (req, res) => {
  const { name, email, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);
  try {
    const stmt = db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)');
    const result = stmt.run(name, email, hashedPassword);
    const token = jwt.sign({ id: result.lastInsertRowid, email }, JWT_SECRET);
    res.json({ token, user: { id: result.lastInsertRowid, name, email } });
  } catch (err) {
    res.status(400).json({ error: 'User already exists' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
  const user = stmt.get(email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  const stmt = db.prepare('SELECT id, name, email FROM users WHERE id = ?');
  const user = stmt.get(req.user.id);
  res.json(user);
});

// Cycles routes
app.get('/api/cycles', authenticateToken, (req, res) => {
  const stmt = db.prepare('SELECT * FROM cycles WHERE user_id = ? ORDER BY start_date DESC');
  const cycles = stmt.all(req.user.id);
  res.json(cycles);
});

app.get('/api/cycles/current', authenticateToken, (req, res) => {
  const stmt = db.prepare('SELECT * FROM cycles WHERE user_id = ? AND end_date IS NULL ORDER BY start_date DESC LIMIT 1');
  const cycle = stmt.get(req.user.id);
  res.json(cycle);
});

app.post('/api/cycles', authenticateToken, (req, res) => {
  const { start_date } = req.body;
  const stmt = db.prepare('INSERT INTO cycles (user_id, start_date) VALUES (?, ?)');
  const result = stmt.run(req.user.id, start_date);
  res.json({ id: result.lastInsertRowid });
});

app.put('/api/cycles/:id/end', authenticateToken, (req, res) => {
  const { end_date } = req.body;
  const stmt = db.prepare('UPDATE cycles SET end_date = ?, duration_days = julianday(?) - julianday(start_date) + 1 WHERE id = ? AND user_id = ?');
  stmt.run(end_date, end_date, req.params.id, req.user.id);
  res.json({ success: true });
});

// Flow readings routes
app.get('/api/flow/:cycleId', authenticateToken, (req, res) => {
  const stmt = db.prepare('SELECT * FROM flow_readings WHERE cycle_id = ? AND user_id = ? ORDER BY reading_date');
  const readings = stmt.all(req.params.cycleId, req.user.id);
  res.json(readings);
});

app.post('/api/flow', authenticateToken, (req, res) => {
  const { cycle_id, reading_date, flow_level, intensity } = req.body;
  const stmt = db.prepare('INSERT INTO flow_readings (user_id, cycle_id, reading_date, flow_level, intensity) VALUES (?, ?, ?, ?, ?)');
  const result = stmt.run(req.user.id, cycle_id, reading_date, flow_level, intensity);
  res.json({ id: result.lastInsertRowid });
});

// Clotting logs routes
app.get('/api/clots/:cycleId', authenticateToken, (req, res) => {
  const stmt = db.prepare('SELECT * FROM clotting_logs WHERE cycle_id = ? AND user_id = ? ORDER BY detected_at DESC');
  const clots = stmt.all(req.params.cycleId, req.user.id);
  res.json(clots);
});

app.post('/api/clots', authenticateToken, (req, res) => {
  const { cycle_id, detected_at, clot_size, notes } = req.body;
  const stmt = db.prepare('INSERT INTO clotting_logs (user_id, cycle_id, detected_at, clot_size, notes) VALUES (?, ?, ?, ?, ?)');
  const result = stmt.run(req.user.id, cycle_id, detected_at, clot_size, notes);
  res.json({ id: result.lastInsertRowid });
});

// Alerts routes
app.get('/api/alerts', authenticateToken, (req, res) => {
  const stmt = db.prepare('SELECT * FROM alerts WHERE user_id = ? ORDER BY triggered_at DESC');
  const alerts = stmt.all(req.user.id);
  res.json(alerts);
});

app.put('/api/alerts/:id/read', authenticateToken, (req, res) => {
  const stmt = db.prepare('UPDATE alerts SET is_read = 1 WHERE id = ? AND user_id = ?');
  stmt.run(req.params.id, req.user.id);
  res.json({ success: true });
});

// Insights route
app.get('/api/insights', authenticateToken, (req, res) => {
  const cycles = db.prepare('SELECT * FROM cycles WHERE user_id = ? AND end_date IS NOT NULL').all(req.user.id);
  if (cycles.length === 0) return res.json({ avg_cycle_length: 28, common_flow: 'moderate', trend: 'No data yet' });

  const avgLength = cycles.reduce((sum, c) => sum + c.duration_days, 0) / cycles.length;
  const flowCounts = {};
  cycles.forEach(c => {
    flowCounts[c.avg_flow_level] = (flowCounts[c.avg_flow_level] || 0) + 1;
  });
  const commonFlow = Object.keys(flowCounts).reduce((a, b) => flowCounts[a] > flowCounts[b] ? a : b);
  const trend = cycles.length >= 3 ? (cycles.slice(-3).every(c => c.duration_days < avgLength) ? 'Cycles getting shorter' : 'Cycles stable') : 'No trend yet';

  res.json({ avg_cycle_length: Math.round(avgLength), common_flow: commonFlow, trend });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});