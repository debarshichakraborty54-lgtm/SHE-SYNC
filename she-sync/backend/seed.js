const db = require('./database');
const bcrypt = require('bcryptjs');

// Clear existing demo data
db.exec('DELETE FROM alerts WHERE user_id = 1');
db.exec('DELETE FROM clotting_logs WHERE user_id = 1');
db.exec('DELETE FROM flow_readings WHERE user_id = 1');
db.exec('DELETE FROM cycles WHERE user_id = 1');
db.exec("DELETE FROM users WHERE email = 'demo@shesync.com'");

// Insert demo user
const hashedPassword = bcrypt.hashSync('password123', 10);
const insertUser = db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)');
const userId = insertUser.run('Demo User', 'demo@shesync.com', hashedPassword).lastInsertRowid;

// Generate 6 past cycles with realistic medical data
// Average cycle: 28 days, Period duration: 5-7 days
const cycles = [];
let startDate = new Date('2023-01-01');
for (let i = 0; i < 6; i++) {
  const periodDuration = 5 + Math.floor(Math.random() * 3); // 5-7 days (realistic period length)
  const cycleDuration = 26 + Math.floor(Math.random() * 10); // 26-35 days (realistic cycle length)
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + cycleDuration - 1);

  const insertCycle = db.prepare('INSERT INTO cycles (user_id, start_date, end_date, duration_days, avg_flow_level, clot_count) VALUES (?, ?, ?, ?, ?, ?)');
  const cycleId = insertCycle.run(userId, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0], cycleDuration, 'moderate', 1 + Math.floor(Math.random() * 3)).lastInsertRowid;

  cycles.push({ id: cycleId, start: new Date(startDate), end: endDate, periodDuration: periodDuration });

  // Next cycle starts after current period ends
  startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() + 1);
}

// For each cycle, generate daily flow readings based on period length
// Realistic pattern: Light → Heavy → Light
cycles.forEach(cycle => {
  for (let day = 0; day < cycle.periodDuration; day++) {
    const date = new Date(cycle.start);
    date.setDate(cycle.start.getDate() + day);
    let flowLevel, intensity;
    
    // Day 1-2: Light flow (start of period)
    if (day <= 1) {
      flowLevel = 'light';
      intensity = 0.3;
    }
    // Day 3-4: Heavy flow (peak menstrual flow)
    else if (day <= 3) {
      flowLevel = 'heavy';
      intensity = 1.0;
    }
    // Day 5-7: Moderate to light flow (end of period)
    else {
      flowLevel = 'moderate';
      intensity = 0.5;
    }
    
    db.prepare('INSERT INTO flow_readings (user_id, cycle_id, reading_date, flow_level, intensity) VALUES (?, ?, ?, ?, ?)').run(userId, cycle.id, date.toISOString().split('T')[0], flowLevel, intensity);
  }

  // Generate 1-3 clotting events during the period (realistic: usually days 3-5)
  const clotCount = 1 + Math.floor(Math.random() * 3); // 1-3 clots per cycle
  for (let c = 0; c < clotCount; c++) {
    const clotDay = 2 + Math.floor(Math.random() * 3); // Clots typically appear days 3-5 (heavier flow days)
    if (clotDay < cycle.periodDuration) {
      const clotDate = new Date(cycle.start);
      clotDate.setDate(cycle.start.getDate() + clotDay);
      const sizes = ['small', 'small', 'medium']; // Small clots are more common
      const size = sizes[Math.floor(Math.random() * sizes.length)];
      db.prepare('INSERT INTO clotting_logs (user_id, cycle_id, detected_at, clot_size) VALUES (?, ?, ?, ?)').run(userId, cycle.id, clotDate.toISOString(), size);
    }
  }
});

// Generate some alerts
db.prepare('INSERT INTO alerts (user_id, alert_type, message) VALUES (?, ?, ?)').run(userId, 'delayed_period', 'Your period is 2 days late.');
db.prepare('INSERT INTO alerts (user_id, alert_type, message) VALUES (?, ?, ?)').run(userId, 'heavy_flow', 'Unusually heavy flow detected for 2 consecutive days.');
db.prepare('INSERT INTO alerts (user_id, alert_type, message) VALUES (?, ?, ?)').run(userId, 'frequent_clotting', '3 clotting events detected in the last 48 hours.');

// Add a current ongoing cycle (realistic: period just ended)
const ongoingCycleStart = new Date('2026-04-21'); // Started 7 days ago (period just ended)
const insertOngoingCycle = db.prepare('INSERT INTO cycles (user_id, start_date) VALUES (?, ?)');
const currentCycleId = insertOngoingCycle.run(userId, ongoingCycleStart.toISOString().split('T')[0]).lastInsertRowid;

// Add realistic flow readings: Period ended recently, so showing follicular phase
// Current date is 2026-04-28, so we're 7 days into cycle (period is over)
for (let day = 0; day < 7; day++) { // Only period days have flow (realistic: 5-7 days)
  const date = new Date(ongoingCycleStart);
  date.setDate(ongoingCycleStart.getDate() + day);
  let flowLevel, intensity;
  
  // Day 1-2: Light flow (start of period)
  if (day <= 1) {
    flowLevel = 'light';
    intensity = 0.3;
  }
  // Day 3-4: Heavy flow (peak menstrual flow)
  else if (day <= 3) {
    flowLevel = 'heavy';
    intensity = 1.0;
  }
  // Day 5-7: Moderate to light flow (end of period)
  else {
    flowLevel = 'moderate';
    intensity = 0.5;
  }
  
  db.prepare('INSERT INTO flow_readings (user_id, cycle_id, reading_date, flow_level, intensity) VALUES (?, ?, ?, ?, ?)').run(userId, currentCycleId, date.toISOString().split('T')[0], flowLevel, intensity);
}

// Add 2 realistic clots during peak flow days (day 3-4, typical clotting time)
const clotDate1 = new Date(ongoingCycleStart);
clotDate1.setDate(ongoingCycleStart.getDate() + 3);
db.prepare('INSERT INTO clotting_logs (user_id, cycle_id, detected_at, clot_size) VALUES (?, ?, ?, ?)').run(userId, currentCycleId, clotDate1.toISOString(), 'small');

const clotDate2 = new Date(ongoingCycleStart);
clotDate2.setDate(ongoingCycleStart.getDate() + 4);
db.prepare('INSERT INTO clotting_logs (user_id, cycle_id, detected_at, clot_size) VALUES (?, ?, ?, ?)').run(userId, currentCycleId, clotDate2.toISOString(), 'medium');

console.log('Database seeded with demo data.');