let currentCycleId = null;
let chart = null;

document.addEventListener('DOMContentLoaded', async () => {
  if (!getToken()) {
    window.location.href = 'index.html';
    return;
  }
  await loadDashboard();
});

document.getElementById('logout-btn').addEventListener('click', () => {
  localStorage.removeItem('shesync_token');
  window.location.href = 'index.html';
});

async function loadDashboard() {
  try {
    const [cycles, currentCycle, alerts, insights] = await Promise.all([
      api.cycles.getAll(),
      api.cycles.getCurrent(),
      api.alerts.get(),
      api.insights.get(),
    ]);

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
  const readings = await api.flow.get(cycleId);
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
  const clots = await api.clots.get(cycleId);
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
    await api.clots.create({ cycle_id: currentCycleId, detected_at: datetime, clot_size: size, notes });
    clotModal.style.display = 'none';
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
    await api.cycles.create({ start_date: startDate });
    cycleModal.style.display = 'none';
    document.getElementById('cycle-form').reset();
    // Reload dashboard with new cycle
    window.location.href = 'dashboard.html';
  } catch (err) {
    alert('Failed to start cycle: ' + err.message);
  }
});