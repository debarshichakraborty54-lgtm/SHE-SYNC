function showTab(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.querySelector(`[onclick="showTab('${tab}')"]`).classList.add('active');
  document.getElementById(`${tab}-tab`).classList.add('active');
}

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  try {
    const res = await api.auth.login({ email, password });
    localStorage.setItem('shesync_token', res.token);
    window.location.href = 'dashboard.html';
  } catch (err) {
    showMessage('Login failed: ' + err.message);
  }
});

document.getElementById('signup-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('signup-name').value;
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;
  try {
    const res = await api.auth.signup({ name, email, password });
    localStorage.setItem('shesync_token', res.token);
    window.location.href = 'dashboard.html';
  } catch (err) {
    showMessage('Signup failed: ' + err.message);
  }
});

function showMessage(msg) {
  const messageEl = document.getElementById('message');
  messageEl.textContent = msg;
  messageEl.style.color = 'red';
}