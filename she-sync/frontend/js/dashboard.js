let currentCycleId = null;
let chart = null;

// Mock data
const mockCycles = [
  { id: 1, start_date: '2026-04-01', end_date: '2026-04-28', duration_days: 28, avg_flow_level: 'moderate', clot_count: 0 },
  { id: 2, start_date: '2026-04-28', end_date: null, duration_days: null, avg_flow_level: null, clot_count: 0 }
];
const mockCurrentCycle = mockCycles.find(c => !c.end_date);
const mockAlerts = [];
const mockInsights = { avg_cycle_length: 28, common_flow: 'moderate', trend: 'Stable' };
const mockFlowReadings = [
  { reading_date: '2026-04-28', intensity: 0.5 },
  { reading_date: '2026-04-29', intensity: 0.7 },
  { reading_date: '2026-04-30', intensity: 0.6 },
  { reading_date: '2026-05-01', intensity: 0.8 }
];
const mockClots = [];

document.addEventListener('DOMContentLoaded', async () => {
  await loadDashboard();
});

async function loadDashboard() {
  try {
    const cycles = mockCycles;
    const currentCycle = mockCurrentCycle;
    const alerts = mockAlerts;
    const insights = mockInsights;

    loadCycleStatus(currentCycle, insights);
    loadCycleSelect(cycles);
    loadAlerts(alerts);
    loadInsights(insights);
    loadCycleHistory(cycles);

    if (currentCycle) {
      currentCycleId = currentCycle.id;
      await loadFlowChart(currentCycle.id);
      await loadClotLog(currentCycle.id);
    }
  } catch (err) {
    console.error('Failed to load dashboard:', err);
  }
}

function loadCycleStatus(cycle, insights) {
  const info = document.getElementById('cycle-info');
  if (!cycle) {
    info.textContent = 'No active cycle. Start a new one!';
    return;
  }
  const daysSince = Math.floor((new Date() - new Date(cycle.start_date)) / (1000 * 60 * 60 * 24)) + 1;
  const delayed = daysSince > insights.avg_cycle_length + 3;
  info.innerHTML = `
    <strong>Day ${daysSince}</strong> of your cycle<br>
    Started: ${new Date(cycle.start_date).toLocaleDateString()}<br>
    ${delayed ? '<span style="color: red;">Period delayed by ' + (daysSince - insights.avg_cycle_length) + ' days</span>' : ''}
  `;
}

function loadCycleSelect(cycles) {
  const select = document.getElementById('cycle-select');
  select.innerHTML = '';
  cycles.forEach(cycle => {
    const option = document.createElement('option');
    option.value = cycle.id;
    option.textContent = `${cycle.start_date} - ${cycle.end_date || 'Ongoing'}`;
    select.appendChild(option);
  });
  select.value = currentCycleId || cycles[0]?.id;
  select.addEventListener('change', async () => {
    await loadFlowChart(select.value);
    await loadClotLog(select.value);
  });
}

async function loadFlowChart(cycleId) {
  const readings = mockFlowReadings;
  const ctx = document.getElementById('flow-canvas').getContext('2d');
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: readings.map(r => `Day ${Math.floor((new Date(r.reading_date) - new Date(readings[0].reading_date)) / (1000 * 60 * 60 * 24)) + 1}`),
      datasets: [{
        label: 'Flow Intensity',
        data: readings.map(r => r.intensity),
        borderColor: '#E8A0BF',
        backgroundColor: 'rgba(232, 160, 191, 0.2)',
        tension: 0.1
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true, max: 1 }
      }
    }
  });
}

async function loadClotLog(cycleId) {
  const clots = mockClots;
  const tbody = document.querySelector('#clot-table tbody');
  tbody.innerHTML = '';
  clots.forEach(clot => {
    const row = document.createElement('tr');
    const date = new Date(clot.detected_at);
    row.innerHTML = `
      <td>${date.toLocaleDateString()}</td>
      <td>${date.toLocaleTimeString()}</td>
      <td class="clot-${clot.clot_size}">${clot.clot_size}</td>
      <td>${clot.notes || ''}</td>
    `;
    tbody.appendChild(row);
  });
}

function loadCycleHistory(cycles) {
  const tbody = document.querySelector('#cycle-table tbody');
  tbody.innerHTML = '';
  cycles.forEach(cycle => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${cycle.start_date}</td>
      <td>${cycle.end_date || 'Ongoing'}</td>
      <td>${cycle.duration_days || ''}</td>
      <td>${cycle.avg_flow_level || ''}</td>
      <td>${cycle.clot_count}</td>
    `;
    tbody.appendChild(row);
  });
}

function loadAlerts(alerts) {
  const list = document.getElementById('alerts-list');
  list.innerHTML = '';
  alerts.forEach(alert => {
    const div = document.createElement('div');
    div.className = `alert ${alert.alert_type}`;
    div.innerHTML = `
      <strong>${alert.alert_type.replace('_', ' ').toUpperCase()}</strong><br>
      ${alert.message}
      ${!alert.is_read ? '<button onclick="markRead(' + alert.id + ')">Mark Read</button>' : ''}
    `;
    list.appendChild(div);
  });
}

function loadInsights(insights) {
  const content = document.getElementById('insights-content');
  content.innerHTML = `
    Average cycle length: ${insights.avg_cycle_length} days<br>
    Most common flow: ${insights.common_flow}<br>
    Trend: ${insights.trend}
  `;
}

async function markRead(id) {
  await api.alerts.markRead(id);
  await loadDashboard();
}

// Modal for adding clots
const clotModal = document.getElementById('clot-modal');
const clotBtn = document.getElementById('add-clot-btn');
const clotClose = clotModal.querySelector('.close');

clotBtn.onclick = () => clotModal.style.display = 'block';
clotClose.onclick = () => clotModal.style.display = 'none';
window.onclick = (event) => {
  if (event.target == clotModal) clotModal.style.display = 'none';
};

document.getElementById('clot-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const datetime = document.getElementById('clot-datetime').value;
  const size = document.getElementById('clot-size').value;
  const notes = document.getElementById('clot-notes').value;
  try {
    // Mock create clot
    const newClot = { detected_at: datetime, clot_size: size, notes };
    mockClots.push(newClot);
    clotModal.style.display = 'none';
    document.getElementById('clot-form').reset();
    await loadClotLog(currentCycleId);
  } catch (err) {
    alert('Failed to add clot: ' + err.message);
  }
});

// Modal for starting a new cycle
const cycleModal = document.getElementById('cycle-modal');
const cycleStartBtn = document.getElementById('start-cycle-btn');
const cycleClose = cycleModal.querySelector('.close');

cycleStartBtn.onclick = () => cycleModal.style.display = 'block';
cycleClose.onclick = () => cycleModal.style.display = 'none';

document.getElementById('cycle-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const startDate = document.getElementById('cycle-start-date').value;
  try {
    // Mock create cycle
    const newCycle = { id: mockCycles.length + 1, start_date: startDate, end_date: null, duration_days: null, avg_flow_level: null, clot_count: 0 };
    mockCycles.push(newCycle);
    cycleModal.style.display = 'none';
    document.getElementById('cycle-form').reset();
    // Reload dashboard
    await loadDashboard();
  } catch (err) {
    alert('Failed to start cycle: ' + err.message);
  }
});