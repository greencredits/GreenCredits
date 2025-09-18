// ==================== CREDIT SYSTEM FUNCTIONS ====================

async function loadUserCredits() {
  if (!currentUser) return;

  try {
    const response = await fetch("/api/credits", {
      credentials: "include"
    });

    const data = await response.json();
    
    if (data.success) {
      updateCreditsDisplay(data.credits, data.badges, data.nextBadges);
    }
  } catch (error) {
    console.error('Load credits error:', error);
  }
}

async function loadLeaderboard() {
  try {
    const response = await fetch("/api/leaderboard");
    const data = await response.json();
    
    if (data.success) {
      updateLeaderboardDisplay(data.leaderboard);
    }
  } catch (error) {
    console.error('Load leaderboard error:', error);
  }
}

function updateCreditsDisplay(credits, badges, nextBadges) {
  // Update credits in header
  let creditsDisplay = document.getElementById('userCredits');
  if (!creditsDisplay) {
    creditsDisplay = document.createElement('div');
    creditsDisplay.id = 'userCredits';
    creditsDisplay.style.cssText = `
      background: linear-gradient(45deg, #10b981, #059669);
      color: white;
      padding: 8px 12px;
      border-radius: 20px;
      font-weight: 600;
      font-size: 0.9rem;
      margin-left: 10px;
    `;
    const userWelcome = document.getElementById('userWelcome');
    if (userWelcome) {
      userWelcome.appendChild(creditsDisplay);
    }
  }
  
  creditsDisplay.innerHTML = `🌱 ${credits.totalCredits} Credits`;
  
  // Update badges display if on credits tab
  const badgesContainer = document.getElementById('badgesContainer');
  if (badgesContainer) {
    displayBadges(badges, nextBadges, badgesContainer);
  }
  
  // Update credits details if on credits tab
  const creditsDetails = document.getElementById('creditsDetails');
  if (creditsDetails) {
    creditsDetails.innerHTML = `
      <div style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 20px;">
        <h3 style="margin: 0 0 16px 0; color: #10b981;">Your Green Credits</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px;">
          <div style="text-align: center;">
            <div style="font-size: 2rem; font-weight: 700; color: #10b981;">${credits.totalCredits}</div>
            <div style="color: #6b7280; font-size: 0.9rem;">Total Earned</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 2rem; font-weight: 700; color: #059669;">${credits.availableCredits}</div>
            <div style="color: #6b7280; font-size: 0.9rem;">Available</div>
          </div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 2rem; font-weight: 700; color: #ef4444;">${credits.redeemed}</div>
            <div style="color: #6b7280; font-size: 0.9rem;">Redeemed</div>
          </div>
        </div>
      </div>
    `;
  }
}

function displayBadges(badges, nextBadges, container) {
  let content = '<div style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 20px;">';
  
  // Earned Badges
  content += '<h3 style="margin: 0 0 16px 0; color: #10b981;">Earned Badges</h3>';
  if (badges && badges.length > 0) {
    content += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; margin-bottom: 24px;">';
    badges.forEach(badge => {
      content += `
        <div style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 12px; border-radius: 8px; text-align: center;">
          <div style="font-size: 2rem; margin-bottom: 8px;">${badge.icon}</div>
          <div style="font-weight: 600; margin-bottom: 4px;">${badge.name}</div>
          <div style="font-size: 0.8rem; opacity: 0.9;">${badge.description}</div>
        </div>
      `;
    });
    content += '</div>';
  } else {
    content += '<p style="color: #6b7280; margin-bottom: 24px;">No badges earned yet. Submit reports to start earning badges!</p>';
  }
  
  // Next Badges
  if (nextBadges && nextBadges.length > 0) {
    content += '<h4 style="margin: 0 0 16px 0; color: #6b7280;">Progress Towards Next Badges</h4>';
    content += '<div style="display: grid; gap: 12px;">';
    nextBadges.forEach(badge => {
      content += `
        <div style="background: #f9fafb; padding: 12px; border-radius: 8px; border-left: 4px solid #10b981;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 1.5rem;">${badge.icon}</span>
              <span style="font-weight: 600;">${badge.name}</span>
            </div>
            <span style="font-size: 0.9rem; color: #6b7280;">${badge.progress}/${badge.target}</span>
          </div>
          <div style="background: #e5e7eb; height: 8px; border-radius: 4px; overflow: hidden;">
            <div style="background: linear-gradient(90deg, #10b981, #059669); height: 100%; width: ${badge.percentage}%; transition: width 0.3s ease;"></div>
          </div>
        </div>
      `;
    });
    content += '</div>';
  }
  
  content += '</div>';
  container.innerHTML = content;
}

function updateLeaderboardDisplay(leaderboard) {
  const container = document.getElementById('leaderboardContainer');
  if (!container) return;
  
  let content = '<div style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">';
  content += '<h3 style="margin: 0 0 16px 0; color: #10b981;">Top Contributors</h3>';
  
  if (leaderboard && leaderboard.length > 0) {
    leaderboard.forEach((user, index) => {
      const rankIcon = index === 0 ? '👑' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
      content += `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px; border-bottom: 1px solid #e5e7eb; ${index === leaderboard.length - 1 ? 'border-bottom: none;' : ''}">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 1.2rem; min-width: 40px;">${rankIcon}</span>
            <div>
              <div style="font-weight: 600;">${user.name}</div>
              <div style="font-size: 0.8rem; color: #6b7280;">${user.reportCount} reports • ${user.badgeCount} badges</div>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-weight: 700; color: #10b981;">${user.totalCredits} pts</div>
          </div>
        </div>
      `;
    });
  } else {
    content += '<p style="color: #6b7280;">No leaderboard data available yet.</p>';
  }
  
  content += '</div>';
  container.innerHTML = content;
}// Global state
let currentUser = null;
let currentLocation = null;

// ==================== UTILITY FUNCTIONS ====================

function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    color: white;
    border-radius: 8px;
    z-index: 1000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    max-width: 300px;
    font-weight: 500;
  `;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // Remove after 3 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 3000);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function scrollToSection(sectionId) {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  }
}

// ==================== AUTH FUNCTIONS ====================

async function handleLogin(e) {
  e.preventDefault();
  
  // Get form elements directly by ID
  const emailField = document.getElementById('loginEmail');
  const passwordField = document.getElementById('loginPassword');
  
  const email = emailField ? emailField.value.trim() : '';
  const password = passwordField ? passwordField.value : '';

  console.log('Login attempt:', { email, password: password ? '***' : 'empty' });

  if (!email || !password) {
    showNotification('Please fill in all fields', 'error');
    return;
  }

  if (!email.includes('@')) {
    showNotification('Please enter a valid email address', 'error');
    return;
  }

  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      credentials: "include"
    });

    const data = await response.json();
    
    if (data.success) {
      currentUser = data.user;
      updateUserUI(currentUser);
      closeModal();
      showNotification(`Welcome back, ${currentUser.name}!`, 'success');
      loadMyReports();
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
  
  // Get form elements directly by ID
  const nameField = document.getElementById('signupName');
  const emailField = document.getElementById('signupEmail');
  const passwordField = document.getElementById('signupPassword');
  
  const name = nameField ? nameField.value.trim() : '';
  const email = emailField ? emailField.value.trim() : '';
  const password = passwordField ? passwordField.value : '';

  console.log('Signup attempt:', { name, email, password: password ? '***' : 'empty' });

  if (!name || !email || !password) {
    showNotification('Please fill in all fields', 'error');
    return;
  }

  if (name.length < 2) {
    showNotification('Name must be at least 2 characters', 'error');
    return;
  }

  if (!email.includes('@')) {
    showNotification('Please enter a valid email address', 'error');
    return;
  }

  if (password.length < 6) {
    showNotification('Password must be at least 6 characters', 'error');
    return;
  }

  try {
    const response = await fetch("/api/signup", {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password }),
      credentials: "include"
    });

    const data = await response.json();
    
    if (data.success) {
      currentUser = data.user;
      updateUserUI(currentUser);
      closeModal();
      showNotification(`Account created! Welcome, ${currentUser.name}!`, 'success');
      loadMyReports();
    } else {
      showNotification(data.error || 'Signup failed', 'error');
    }
  } catch (error) {
    console.error('Signup error:', error);
    showNotification('Network error. Please try again.', 'error');
  }
}

async function handleLogout() {
  try {
    await fetch("/api/logout", {
      method: "POST",
      credentials: "include"
    });
    
    currentUser = null;
    updateUserUI(null);
    showNotification('Logged out successfully', 'success');
    
    // Clear my reports
    const reportsList = document.getElementById("reportsList");
    if (reportsList) {
      reportsList.innerHTML = '<p>Please log in to view your reports.</p>';
    }
  } catch (error) {
    console.error('Logout error:', error);
    showNotification('Logout failed', 'error');
  }
}

function updateUserUI(user) {
  const authButtons = document.getElementById("authButtons");
  const userWelcome = document.getElementById("userWelcome");
  const welcomeUser = document.getElementById("welcomeUser");
  
  if (user) {
    authButtons.style.display = "none";
    userWelcome.style.display = "flex";
    welcomeUser.textContent = `Hello, ${user.name}`;
  } else {
    authButtons.style.display = "flex";
    userWelcome.style.display = "none";
    welcomeUser.textContent = "";
  }
}

// ==================== MODAL FUNCTIONS ====================

function openLogin() {
  closeModal();
  const modal = document.getElementById('loginModal');
  const backdrop = document.getElementById('modalBackdrop');
  if (modal && backdrop) {
    modal.style.display = 'block';
    modal.setAttribute('aria-hidden', 'false');
    backdrop.hidden = false;
    backdrop.style.display = 'block';
  }
}

function openSignup() {
  closeModal();
  const modal = document.getElementById('signupModal');
  const backdrop = document.getElementById('modalBackdrop');
  if (modal && backdrop) {
    modal.style.display = 'block';
    modal.setAttribute('aria-hidden', 'false');
    backdrop.hidden = false;
    backdrop.style.display = 'block';
  }
}

function closeModal() {
  const modals = document.querySelectorAll('.modal');
  const backdrop = document.getElementById('modalBackdrop');
  
  modals.forEach(modal => {
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
  });
  
  if (backdrop) {
    backdrop.hidden = true;
    backdrop.style.display = 'none';
  }
}

// ==================== LOCATION FUNCTIONS ====================

function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  });
}

async function useMyLocation() {
  const locationInput = document.getElementById('reportLocation');
  
  try {
    showNotification('Getting your location...', 'info');
    const location = await getCurrentLocation();
    currentLocation = location;
    
    // Try to get address from coordinates (reverse geocoding)
    try {
      const address = await reverseGeocode(location.lat, location.lng);
      locationInput.value = address;
      showNotification('Location updated!', 'success');
    } catch (geocodeError) {
      locationInput.value = `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
      showNotification('Location coordinates captured', 'success');
    }
  } catch (error) {
    console.error('Location error:', error);
    showNotification('Could not get location. Please enter manually.', 'error');
  }
}

async function reverseGeocode(lat, lng) {
  // This is a simple implementation. In production, you'd use a proper geocoding service
  // For now, just return coordinates
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

function clearLocation() {
  const locationInput = document.getElementById('reportLocation');
  locationInput.value = '';
  currentLocation = null;
  showNotification('Location cleared', 'info');
}

// ==================== REPORT FUNCTIONS ====================

async function submitReportForm(e) {
  e.preventDefault();

  if (!currentUser) {
    showNotification('Please log in to submit a report', 'error');
    openLogin();
    return;
  }

  const formData = new FormData(e.target);
  const photo = formData.get('photo');
  const description = formData.get('description');
  const address = formData.get('address');

  if (!photo || photo.size === 0) {
    showNotification('Please select a photo', 'error');
    return;
  }

  // Add location coordinates if available
  if (currentLocation) {
    formData.append('lat', currentLocation.lat);
    formData.append('lng', currentLocation.lng);
  }

  try {
    showNotification('Submitting report...', 'info');
    
    const response = await fetch("/api/report", {
      method: "POST",
      body: formData,
      credentials: "include"
    });

    const data = await response.json();
    
    if (data.success) {
      // Show success with credit information
      let message = 'Report submitted successfully!';
      if (data.credits && data.credits.earned > 0) {
        message += ` You earned ${data.credits.earned} Green Credits! 🌱`;
        
        // Show badge notifications
        if (data.credits.newBadges && data.credits.newBadges.length > 0) {
          setTimeout(() => {
            data.credits.newBadges.forEach(badge => {
              showBadgeNotification(badge);
            });
          }, 1000);
        }
        
        // Show credit breakdown
        setTimeout(() => {
          showCreditBreakdown(data.credits.breakdown);
        }, 500);
      }
      
      showNotification(message, 'success');
      e.target.reset();
      currentLocation = null;
      loadMyReports();
      loadUserCredits(); // Refresh credits display
    } else {
      showNotification(data.error || 'Failed to submit report', 'error');
    }
  } catch (error) {
    console.error('Submit error:', error);
    showNotification('Network error. Please try again.', 'error');
  }
}

function showBadgeNotification(badge) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    padding: 16px 24px;
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    border-radius: 12px;
    z-index: 1001;
    box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);
    max-width: 320px;
    font-weight: 600;
    border: 2px solid #34d399;
    animation: slideIn 0.3s ease-out;
  `;
  
  notification.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px;">
      <span style="font-size: 2rem;">${badge.icon}</span>
      <div>
        <div style="font-size: 1.1rem; margin-bottom: 4px;">New Badge Earned!</div>
        <div style="font-size: 0.9rem; opacity: 0.9;">${badge.name}</div>
      </div>
    </div>
  `;
  
  // Add animation keyframes
  if (!document.getElementById('badge-animations')) {
    const style = document.createElement('style');
    style.id = 'badge-animations';
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'fadeOut 0.3s ease-in forwards';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 4000);
}

function showCreditBreakdown(breakdown) {
  if (!breakdown || breakdown.length === 0) return;
  
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 16px;
    background: white;
    border-radius: 12px;
    z-index: 1001;
    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    max-width: 300px;
    border-left: 4px solid #10b981;
  `;
  
  let content = '<div style="font-weight: 600; color: #10b981; margin-bottom: 8px;">Credits Earned:</div>';
  breakdown.forEach(item => {
    content += `<div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
      <span style="font-size: 0.9rem;">${item.description}</span>
      <span style="font-weight: 600; color: #10b981;">+${item.credits}</span>
    </div>`;
  });
  
  notification.innerHTML = content;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 5000);
}

async function loadMyReports() {
  if (!currentUser) {
    return;
  }

  const reportsList = document.getElementById("reportsList");
  if (!reportsList) return;

  try {
    const response = await fetch("/api/myreports", {
      credentials: "include"
    });

    const data = await response.json();
    
    if (data.success && data.reports) {
      displayReports(data.reports, reportsList);
    } else {
      reportsList.innerHTML = '<p>No reports found.</p>';
    }
  } catch (error) {
    console.error('Load reports error:', error);
    reportsList.innerHTML = '<p>Error loading reports.</p>';
  }
}

function displayReports(reports, container) {
  if (!reports || reports.length === 0) {
    container.innerHTML = '<p>No reports yet. Submit your first report!</p>';
    return;
  }

  const reportsHTML = reports.map(report => `
    <div class="report-card" style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 12px; background: white;">
      <div class="report-header" style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
        <div class="report-status">
          <span class="status-badge status-${report.status.toLowerCase().replace(' ', '-')}" 
                style="padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; 
                       background: ${getStatusColor(report.status)}; color: white;">
            ${report.status}
          </span>
        </div>
        <div class="report-date" style="color: #6b7280; font-size: 14px;">
          ${formatDate(report.createdAt)}
        </div>
      </div>
      
      ${report.photoUrl ? `
        <div class="report-photo" style="margin-bottom: 12px;">
          <img src="${report.photoUrl}" alt="Report photo" style="width: 100%; max-width: 200px; height: auto; border-radius: 6px;">
        </div>
      ` : ''}
      
      ${report.description ? `
        <div class="report-description" style="margin-bottom: 8px;">
          <strong>Description:</strong> ${report.description}
        </div>
      ` : ''}
      
      ${report.address ? `
        <div class="report-location" style="color: #6b7280; font-size: 14px;">
          <strong>Location:</strong> ${report.address}
        </div>
      ` : ''}
      
      ${report.lat && report.lng ? `
        <div class="report-coordinates" style="color: #6b7280; font-size: 12px;">
          Coordinates: ${report.lat.toFixed(6)}, ${report.lng.toFixed(6)}
        </div>
      ` : ''}
    </div>
  `).join('');

  container.innerHTML = reportsHTML;
}

function getStatusColor(status) {
  switch (status.toLowerCase()) {
    case 'pending': return '#f59e0b';
    case 'in progress': return '#3b82f6';
    case 'resolved': return '#10b981';
    default: return '#6b7280';
  }
}

function clearReportForm() {
  const form = document.getElementById('reportForm');
  if (form) {
    form.reset();
    currentLocation = null;
    showNotification('Form cleared', 'info');
  }
}

// ==================== TAB FUNCTIONS ====================

function switchTab(tabName) {
  // Hide all panels
  document.querySelectorAll('.app-panel').forEach(panel => {
    panel.classList.remove('active');
  });
  
  // Remove active class from all tabs
  document.querySelectorAll('.app-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Show selected panel
  const targetPanel = document.getElementById(tabName);
  if (targetPanel) {
    targetPanel.classList.add('active');
  }
  
  // Add active class to clicked tab
  const targetTab = document.querySelector(`[data-tab="${tabName}"]`);
  if (targetTab) {
    targetTab.classList.add('active');
  }
  
  // Load data if needed
  if (tabName === 'myreports') {
    loadMyReports();
  } else if (tabName === 'credits') {
    loadUserCredits();
  } else if (tabName === 'leader') {
    loadLeaderboard();
  }
}

// ==================== CHART INITIALIZATION ====================

function initializeChart() {
  const canvas = document.getElementById('reportsChart');
  if (!canvas || typeof Chart === 'undefined') return;

  const ctx = canvas.getContext('2d');
  
  // Sample data for demonstration
  const chartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      label: 'Reports',
      data: [12, 19, 8, 15, 22, 8, 14],
      borderColor: '#10b981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      tension: 0.4
    }]
  };

  new Chart(ctx, {
    type: 'line',
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

// ==================== INITIALIZATION ====================

async function checkAuthStatus() {
  try {
    const response = await fetch('/api/me', { credentials: 'include' });
    const data = await response.json();
    
    if (data.success && data.user) {
      currentUser = data.user;
      updateUserUI(currentUser);
      loadMyReports();
      loadUserCredits(); // Load credits when user is authenticated
    }
  } catch (error) {
    console.error('Auth check failed:', error);
  }
}

document.addEventListener("DOMContentLoaded", function() {
  // Check authentication status
  checkAuthStatus();

  // Auth form handlers
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }

  const signupForm = document.getElementById("signupForm");
  if (signupForm) {
    signupForm.addEventListener("submit", handleSignup);
  }

  // Report form handler
  const reportForm = document.getElementById("reportForm");
  if (reportForm) {
    reportForm.addEventListener("submit", submitReportForm);
  }

  // Button event listeners
  const loginBtn = document.getElementById("loginBtn");
  if (loginBtn) {
    loginBtn.addEventListener("click", openLogin);
  }

  const signupBtn = document.getElementById("signupBtn");
  if (signupBtn) {
    signupBtn.addEventListener("click", openSignup);
  }

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", handleLogout);
  }

  const useLocationBtn = document.getElementById("useLocationBtn");
  if (useLocationBtn) {
    useLocationBtn.addEventListener("click", useMyLocation);
  }

  const clearLocationBtn = document.getElementById("clearLocationBtn");
  if (clearLocationBtn) {
    clearLocationBtn.addEventListener("click", clearLocation);
  }

  // Modal close handlers
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal-backdrop') || e.target.classList.contains('modal-close')) {
      closeModal();
    }
  });

  // Tab switching
  document.querySelectorAll('.app-tab').forEach(tab => {
    tab.addEventListener('click', function() {
      const tabName = this.getAttribute('data-tab');
      switchTab(tabName);
    });
  });

  // Logo click handler
  const logo = document.querySelector('.logo');
  if (logo) {
    logo.addEventListener('click', scrollToTop);
  }

  // Navigation links
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('href').substring(1);
      scrollToSection(targetId);
    });
  });

  // Initialize chart if available
  setTimeout(initializeChart, 500);

  console.log('🌿 GreenCredits client initialized');
});

// ==================== GLOBAL FUNCTIONS ====================

// Make functions available globally
window.openLogin = openLogin;
window.openSignup = openSignup;
window.closeModal = closeModal;
window.scrollToTop = scrollToTop;
window.scrollToSection = scrollToSection;
window.clearReportForm = clearReportForm;
window.redeemReward = redeemReward;

// Redemption function
async function redeemReward(rewardId, credits) {
  if (!currentUser) {
    showNotification('Please log in to redeem rewards', 'error');
    return;
  }

  try {
    const response = await fetch('/api/credits/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rewardId, credits }),
      credentials: 'include'
    });

    const data = await response.json();
    
    if (data.success) {
      showNotification(`Reward redeemed! Remaining credits: ${data.remaining}`, 'success');
      loadUserCredits(); // Refresh credits display
    } else {
      showNotification(data.error || 'Redemption failed', 'error');
    }
  } catch (error) {
    console.error('Redemption error:', error);
    showNotification('Network error. Please try again.', 'error');
  }
}