// Admin portal JavaScript
let currentAdmin = null;
let reports = [];

// DOM elements
const authSection = document.getElementById('authSection');
const dashboard = document.getElementById('dashboard');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const adminLoginForm = document.getElementById('adminLoginForm');
const adminSignupForm = document.getElementById('adminSignupForm');
const adminWelcome = document.getElementById('adminWelcome');
const logoutBtn = document.getElementById('logoutBtn');
const reportsContainer = document.getElementById('reportsContainer');

// Utility functions
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 4000);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

// UI functions
function showLogin() {
  loginForm.classList.remove('hidden');
  signupForm.classList.add('hidden');
}

function showSignup() {
  loginForm.classList.add('hidden');
  signupForm.classList.remove('hidden');
}

function showAuth() {
  authSection.style.display = 'flex';
  dashboard.style.display = 'none';
}

function showDashboard() {
  authSection.style.display = 'none';
  dashboard.style.display = 'block';
  if (currentAdmin) {
    adminWelcome.textContent = `Welcome, ${currentAdmin.name}`;
  }
}

// Authentication functions
async function handleLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  if (!email || !password) {
    showNotification('Please fill in all fields', 'error');
    return;
  }

  try {
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include'
    });

    const data = await response.json();
    
    if (data.success) {
      currentAdmin = data.admin;
      showDashboard();
      showNotification(`Welcome, ${currentAdmin.name}!`, 'success');
      loadReports();
    } else {
      showNotification(data.error || 'Login failed', 'error');
    }
  } catch (error) {
    console.error('Login error:', error);
    showNotification('Network error. Please try again.', 'error');
  }
}

async function handleSignup(e) {
  e.preventDefault();
  
  const name = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;
  const organizationCode = document.getElementById('orgCode').value.trim();

  if (!name || !email || !password || !organizationCode) {
    showNotification('Please fill in all fields', 'error');
    return;
  }

  try {
    const response = await fetch('/api/admin/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, organizationCode }),
      credentials: 'include'
    });

    const data = await response.json();
    
    if (data.success) {
      currentAdmin = data.admin;
      showDashboard();
      showNotification(`Registration successful! Welcome, ${currentAdmin.name}!`, 'success');
      loadReports();
    } else {
      showNotification(data.error || 'Registration failed', 'error');
    }
  } catch (error) {
    console.error('Signup error:', error);
    showNotification('Network error. Please try again.', 'error');
  }
}

async function handleLogout() {
  try {
    await fetch('/api/admin/logout', {
      method: 'POST',
      credentials: 'include'
    });
    
    currentAdmin = null;
    showAuth();
    showNotification('Logged out successfully', 'success');
  } catch (error) {
    console.error('Logout error:', error);
    showNotification('Logout failed', 'error');
  }
}

// Reports functions
async function loadReports() {
  reportsContainer.innerHTML = '<div class="loading">Loading reports...</div>';

  try {
    const response = await fetch('/api/reports', { credentials: 'include' });
    
    if (response.status === 401) {
      showNotification('Session expired. Please login again.', 'error');
      handleLogout();
      return;
    }
    
    const data = await response.json();
    reports = data;
    renderReports(reports);
    updateStatistics();
  } catch (error) {
    console.error('Failed to load reports:', error);
    reportsContainer.innerHTML = '<div class="empty-state">Failed to load reports. Please try again.</div>';
  }
}

function renderReports(reportsData) {
  if (!reportsData || reportsData.length === 0) {
    reportsContainer.innerHTML = '<div class="empty-state">No reports found</div>';
    return;
  }

  const categoryIcons = {
    'organic': '🥬', 'plastic': '♻️', 'electronic': '📱',
    'medical': '⚕️', 'construction': '🏗️', 'hazardous': '⚠️'
  };

  const reportsHTML = reportsData.map(report => `
    <div class="report-card">
      <div class="report-header">
        <div class="report-id">
          ${categoryIcons[report.wasteCategory] || '🗑️'} Report #${report.id}
          ${report.wasteCategory ? `(${report.wasteCategory})` : ''}
        </div>
        <span class="status-badge status-${report.status.toLowerCase().replace(' ', '-')}">
          ${report.status}
        </span>
      </div>
      
      <div class="report-content">
        <div class="report-details">
          <p><strong>User:</strong> ${report.user ? report.user.name : 'Anonymous'}</p>
          <p><strong>Email:</strong> ${report.user ? report.user.email : 'N/A'}</p>
          <p><strong>Submitted:</strong> ${formatDate(report.createdAt)}</p>
          ${report.wasteSize ? `<p><strong>Size:</strong> ${report.wasteSize}</p>` : ''}
          ${report.description ? `<p><strong>Description:</strong> ${report.description}</p>` : ''}
          ${report.address ? `<p><strong>Location:</strong> ${report.address}</p>` : ''}
          ${report.lat && report.lng ? `
            <p><strong>GPS:</strong> ${report.lat.toFixed(6)}, ${report.lng.toFixed(6)}
              <button onclick="openMap(${report.lat}, ${report.lng})" style="margin-left: 10px; padding: 4px 8px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">View on Map</button>
            </p>
          ` : ''}
          ${report.disposalMethod ? `<p><strong>Disposed via:</strong> ${report.disposalMethod}</p>` : ''}
        </div>
        
        ${report.photoUrl ? `
          <div class="report-image">
            <img src="${report.photoUrl}" alt="Report photo" onclick="viewImage('${report.photoUrl}')">
          </div>
        ` : ''}
      </div>
      
      <div class="status-controls">
        <label>Status:</label>
        <select onchange="updateStatus(${report.id}, this.value)">
          <option value="Pending" ${report.status === 'Pending' ? 'selected' : ''}>Pending</option>
          <option value="Collected" ${report.status === 'Collected' ? 'selected' : ''}>Collected</option>
          <option value="Sorted" ${report.status === 'Sorted' ? 'selected' : ''}>Sorted</option>
          <option value="Processed" ${report.status === 'Processed' ? 'selected' : ''}>Processed</option>
          <option value="Disposed" ${report.status === 'Disposed' ? 'selected' : ''}>Disposed</option>
        </select>
        
        <label>Disposal:</label>
        <select onchange="updateDisposal(${report.id}, this.value)">
          <option value="">Select Method</option>
          <option value="recycled" ${report.disposalMethod === 'recycled' ? 'selected' : ''}>Recycled (+25 credits)</option>
          <option value="composted" ${report.disposalMethod === 'composted' ? 'selected' : ''}>Composted (+20 credits)</option>
          <option value="incinerated" ${report.disposalMethod === 'incinerated' ? 'selected' : ''}>Incinerated (+10 credits)</option>
          <option value="landfilled" ${report.disposalMethod === 'landfilled' ? 'selected' : ''}>Landfilled (+5 credits)</option>
        </select>
      </div>
    </div>
  `).join('');

  reportsContainer.innerHTML = reportsHTML;
}

function updateStatistics() {
  const total = reports.length;
  const pending = reports.filter(r => r.status === 'Pending').length;
  const processed = reports.filter(r => r.status === 'Processed').length;
  const disposed = reports.filter(r => r.status === 'Disposed').length;

  document.getElementById('totalReports').textContent = total;
  document.getElementById('pendingReports').textContent = pending;
  document.getElementById('processedReports').textContent = processed;
  document.getElementById('disposedReports').textContent = disposed;
}

async function updateStatus(reportId, newStatus) {
  try {
    const response = await fetch(`/api/report/${reportId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
      credentials: 'include'
    });

    const result = await response.json();
    
    if (result.success) {
      const reportIndex = reports.findIndex(r => r.id === reportId);
      if (reportIndex !== -1) {
        reports[reportIndex].status = newStatus;
        updateStatistics();
      }
      showNotification(`Report #${reportId} status updated to ${newStatus}`, 'success');
    } else {
      showNotification('Failed to update status', 'error');
    }
  } catch (error) {
    console.error('Status update failed:', error);
    showNotification('Network error. Please try again.', 'error');
  }
}

async function updateDisposal(reportId, disposalMethod) {
  if (!disposalMethod) return;
  
  try {
    const response = await fetch(`/api/report/${reportId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        status: 'Disposed',
        disposalMethod: disposalMethod 
      }),
      credentials: 'include'
    });

    const result = await response.json();
    
    if (result.success) {
      const reportIndex = reports.findIndex(r => r.id === reportId);
      if (reportIndex !== -1) {
        reports[reportIndex].status = 'Disposed';
        reports[reportIndex].disposalMethod = disposalMethod;
        updateStatistics();
      }
      
      const credits = { recycled: 25, composted: 20, incinerated: 10, landfilled: 5 };
      showNotification(`Report disposed via ${disposalMethod}. User earned +${credits[disposalMethod]} credits!`, 'success');
      loadReports();
    } else {
      showNotification('Failed to update disposal method', 'error');
    }
  } catch (error) {
    console.error('Disposal update failed:', error);
    showNotification('Network error. Please try again.', 'error');
  }
}

function openMap(lat, lng) {
  const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}&zoom=17`;
  window.open(googleMapsUrl, '_blank');
}

function viewImage(imageUrl) {
  window.open(imageUrl, '_blank');
}

async function checkAuth() {
  try {
    const response = await fetch('/api/admin/me', { credentials: 'include' });
    const data = await response.json();
    
    if (data.success && data.admin) {
      currentAdmin = data.admin;
      showDashboard();
      loadReports();
    } else {
      showAuth();
    }
  } catch (error) {
    console.error('Auth check failed:', error);
    showAuth();
  }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
  checkAuth();
  
  if (adminLoginForm) adminLoginForm.addEventListener('submit', handleLogin);
  if (adminSignupForm) adminSignupForm.addEventListener('submit', handleSignup);
  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
  
  console.log('Admin portal initialized');
});

// Global functions for HTML onclick handlers
window.showLogin = showLogin;
window.showSignup = showSignup;
window.loadReports = loadReports;
window.updateStatus = updateStatus;
window.updateDisposal = updateDisposal;
window.viewImage = viewImage;
window.openMap = openMap;