// public/admin.js
let currentAdmin = null;

document.getElementById('adminRegisterBtn').onclick = () => {
  document.getElementById('adminRegisterForm').style.display = 'block';
  document.getElementById('adminLoginForm').style.display = 'none';
};
document.getElementById('adminLoginBtn').onclick = () => {
  document.getElementById('adminLoginForm').style.display = 'block';
  document.getElementById('adminRegisterForm').style.display = 'none';
};

document.getElementById('adminRegisterForm').onsubmit = async (e) => {
  e.preventDefault();
  const name = document.getElementById('adminRegName').value;
  const email = document.getElementById('adminRegEmail').value;
  const password = document.getElementById('adminRegPassword').value;
  const res = await fetch('/api/admin/register', {
    method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name, email, password })
  });
  const data = await res.json();
  if (data.success) {
    alert('Registered — please login');
    document.getElementById('adminRegisterForm').style.display = 'none';
  } else {
    alert(data.message || 'Register failed');
  }
};

document.getElementById('adminLoginForm').onsubmit = async (e) => {
  e.preventDefault();
  const email = document.getElementById('adminLoginEmail').value;
  const password = document.getElementById('adminLoginPassword').value;
  const res = await fetch('/api/admin/login', {
    method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (data.success) {
    currentAdmin = data.admin;
    document.getElementById('adminWelcome').textContent = `Welcome, ${currentAdmin.name}`;
    document.getElementById('adminLoginForm').style.display = 'none';
    document.getElementById('reportsSection').style.display = 'block';
    loadReports();
  } else {
    alert(data.message || 'Login failed');
  }
};

async function loadReports() {
  const res = await fetch('/api/reports');
  const rows = await res.json();
  const container = document.getElementById('reportsContainer');
  container.innerHTML = '';
  if (!rows || rows.length === 0) {
    container.innerHTML = '<p>No reports yet</p>';
    return;
  }

  rows.forEach(r => {
    const card = document.createElement('div');
    card.style = 'border:1px solid #ddd;padding:12px;margin:8px 0;background:white;border-radius:8px';
    card.innerHTML = `
      <div><strong>ID:</strong> ${r.id} &nbsp; <strong>Status:</strong> ${r.status}</div>
      <div><strong>User:</strong> ${r.user ? r.user.name + ' (' + r.user.email + ')' : 'Unknown'}</div>
      <div><strong>Description:</strong> ${r.description || '(no description)'}</div>
      <div><strong>Location:</strong> ${r.address || (r.lat && r.lng ? (r.lat + ', ' + r.lng) : 'n/a')}</div>
      <div style="margin-top:8px;"><img src="${r.photoUrl}" width="240"></div>
      <div style="margin-top:8px;">
        <label>Change status:
          <select data-id="${r.id}" class="status-select">
            <option ${r.status === 'Pending' ? 'selected' : ''}>Pending</option>
            <option ${r.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
            <option ${r.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
          </select>
        </label>
      </div>
    `;
    container.appendChild(card);
  });

  document.querySelectorAll('.status-select').forEach(sel => {
    sel.addEventListener('change', async () => {
      const id = sel.dataset.id;
      const status = sel.value;
      await fetch(`/api/report/${id}/status`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ status })
      });
      alert(`Report ${id} updated to ${status}`);
      loadReports();
    });
  });
}
