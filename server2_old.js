import express from 'express';
import session from 'express-session';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// In-memory data storage
let users = [];
let reports = [];
let admins = [];
let userCredits = new Map(); // Store user credits: userId -> credits data
let badges = new Map(); // Store user badges: userId -> badges array
let transactions = []; // Credit transaction history
let reportIdCounter = 1;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: "greencredits_secret_key_2024",
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// -------- CREDIT SYSTEM --------

const CREDIT_ACTIONS = {
  REPORT_SUBMITTED: { credits: 10, description: 'Report submitted with photo' },
  REPORT_WITH_GPS: { credits: 5, description: 'GPS location provided' },
  FIRST_REPORT: { credits: 25, description: 'First environmental report' },
  REPORT_VERIFIED: { credits: 15, description: 'Report verified by municipality' },
  REPORT_RESOLVED: { credits: 20, description: 'Reported issue resolved' },
  WEEKLY_STREAK: { credits: 30, description: 'Active for 7 consecutive days' },
  MONTHLY_STREAK: { credits: 100, description: 'Active for 30 consecutive days' },
  QUALITY_REPORT: { credits: 25, description: 'High-quality detailed report' }
};

const BADGE_THRESHOLDS = {
  ECO_WARRIOR: { credits: 100, name: 'Eco Warrior', icon: '🌱', description: 'Earned 100 Green Credits' },
  WASTE_HUNTER: { reports: 5, name: 'Waste Hunter', icon: '🔍', description: 'Submitted 5 waste reports' },
  GPS_MASTER: { gps_reports: 10, name: 'GPS Master', icon: '📍', description: '10 reports with GPS location' },
  CITY_GUARDIAN: { credits: 500, name: 'City Guardian', icon: '🏆', description: 'Earned 500 Green Credits' },
  GREEN_CHAMPION: { credits: 1000, name: 'Green Champion', icon: '👑', description: 'Earned 1000 Green Credits' },
  STREAK_MASTER: { streak: 30, name: 'Streak Master', icon: '⚡', description: '30-day activity streak' }
};

function initializeUserCredits(userId) {
  if (!userCredits.has(userId)) {
    userCredits.set(userId, {
      totalCredits: 0,
      availableCredits: 0,
      redeemed: 0,
      reportCount: 0,
      gpsReportCount: 0,
      streak: 0,
      lastActivity: new Date().toISOString(),
      multiplier: 1.0
    });
  }
  if (!badges.has(userId)) {
    badges.set(userId, []);
  }
}

function awardCredits(userId, action, reportId = null, customAmount = null) {
  initializeUserCredits(userId);
  
  const creditData = userCredits.get(userId);
  const actionData = CREDIT_ACTIONS[action];
  
  if (!actionData && !customAmount) return;
  
  const baseCredits = customAmount || actionData.credits;
  const multipliedCredits = Math.floor(baseCredits * creditData.multiplier);
  
  creditData.totalCredits += multipliedCredits;
  creditData.availableCredits += multipliedCredits;
  creditData.lastActivity = new Date().toISOString();
  
  // Create transaction record
  const transaction = {
    id: transactions.length + 1,
    userId,
    action,
    credits: multipliedCredits,
    description: actionData ? actionData.description : 'Custom award',
    reportId,
    timestamp: new Date().toISOString()
  };
  transactions.push(transaction);
  
  // Check for new badges
  checkAndAwardBadges(userId);
  
  return { credits: multipliedCredits, transaction };
}

function checkAndAwardBadges(userId) {
  const creditData = userCredits.get(userId);
  const userBadges = badges.get(userId);
  const newBadges = [];
  
  Object.entries(BADGE_THRESHOLDS).forEach(([badgeKey, badge]) => {
    // Check if user already has this badge
    if (userBadges.some(b => b.key === badgeKey)) return;
    
    let earned = false;
    
    if (badge.credits && creditData.totalCredits >= badge.credits) {
      earned = true;
    } else if (badge.reports && creditData.reportCount >= badge.reports) {
      earned = true;
    } else if (badge.gps_reports && creditData.gpsReportCount >= badge.gps_reports) {
      earned = true;
    } else if (badge.streak && creditData.streak >= badge.streak) {
      earned = true;
    }
    
    if (earned) {
      const newBadge = {
        key: badgeKey,
        name: badge.name,
        icon: badge.icon,
        description: badge.description,
        earnedAt: new Date().toISOString()
      };
      userBadges.push(newBadge);
      newBadges.push(newBadge);
      
      // Award bonus credits for earning badges
      awardCredits(userId, null, null, 50);
    }
  });
  
  return newBadges;
}

function calculateReportQuality(report) {
  let qualityScore = 0;
  
  // Has photo
  if (report.photoUrl) qualityScore += 30;
  
  // Has GPS location
  if (report.lat && report.lng) qualityScore += 25;
  
  // Has description
  if (report.description && report.description.length > 10) qualityScore += 20;
  
  // Has address
  if (report.address && report.address.length > 5) qualityScore += 15;
  
  // Description quality (length and keywords)
  if (report.description) {
    const envKeywords = ['waste', 'garbage', 'litter', 'pollution', 'dirty', 'cleanup', 'environment'];
    const hasKeywords = envKeywords.some(keyword => 
      report.description.toLowerCase().includes(keyword)
    );
    if (hasKeywords) qualityScore += 10;
  }
  
  return qualityScore;
}
const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, error: "Authentication required" });
  }
  next();
};

// -------- API ROUTES --------

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get current user
app.get('/api/me', (req, res) => {
  if (req.session.user) {
    res.json({ success: true, user: req.session.user });
  } else {
    res.json({ success: false, user: null });
  }
});

// Signup
app.post("/api/signup", (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.json({ success: false, error: "All fields are required" });
    }

    if (users.find(u => u.email === email)) {
      return res.json({ success: false, error: "User already exists with this email" });
    }

    const newUser = { 
      id: users.length + 1, 
      name: name.trim(), 
      email: email.trim().toLowerCase(), 
      password,
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    req.session.user = { id: newUser.id, name: newUser.name, email: newUser.email };
    
    res.json({ success: true, user: req.session.user });
  } catch (error) {
    res.json({ success: false, error: "Server error during signup" });
  }
});

// Login
app.post("/api/login", (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.json({ success: false, error: "Email and password are required" });
    }

    const user = users.find(u => u.email === email.trim().toLowerCase() && u.password === password);
    
    if (!user) {
      return res.json({ success: false, error: "Invalid email or password" });
    }

    req.session.user = { id: user.id, name: user.name, email: user.email };
    res.json({ success: true, user: req.session.user });
  } catch (error) {
    res.json({ success: false, error: "Server error during login" });
  }
});

// Logout
app.post("/api/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.json({ success: false, error: "Logout failed" });
    }
    res.json({ success: true });
  });
});

// -------- ADMIN AUTH ROUTES --------

// Admin signup
app.post("/api/admin/signup", (req, res) => {
  try {
    const { name, email, password, organizationCode } = req.body;
    
    if (!name || !email || !password || !organizationCode) {
      return res.json({ success: false, error: "All fields are required" });
    }

    // Simple organization code check (you can make this more secure)
    const validOrgCodes = ['MUNI2024', 'ADMIN123', 'GREENCITY'];
    if (!validOrgCodes.includes(organizationCode)) {
      return res.json({ success: false, error: "Invalid organization code" });
    }

    if (admins.find(a => a.email === email)) {
      return res.json({ success: false, error: "Admin already exists with this email" });
    }

    const newAdmin = { 
      id: admins.length + 1, 
      name: name.trim(), 
      email: email.trim().toLowerCase(), 
      password,
      organizationCode,
      createdAt: new Date().toISOString()
    };
    
    admins.push(newAdmin);
    req.session.admin = { id: newAdmin.id, name: newAdmin.name, email: newAdmin.email };
    
    res.json({ success: true, admin: req.session.admin });
  } catch (error) {
    res.json({ success: false, error: "Server error during admin signup" });
  }
});

// Admin login
app.post("/api/admin/login", (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.json({ success: false, error: "Email and password are required" });
    }

    const admin = admins.find(a => a.email === email.trim().toLowerCase() && a.password === password);
    
    if (!admin) {
      return res.json({ success: false, error: "Invalid email or password" });
    }

    req.session.admin = { id: admin.id, name: admin.name, email: admin.email };
    res.json({ success: true, admin: req.session.admin });
  } catch (error) {
    res.json({ success: false, error: "Server error during admin login" });
  }
});

// Admin logout
app.post("/api/admin/logout", (req, res) => {
  req.session.admin = null;
  res.json({ success: true });
});

// Get current admin
app.get('/api/admin/me', (req, res) => {
  if (req.session.admin) {
    res.json({ success: true, admin: req.session.admin });
  } else {
    res.json({ success: false, admin: null });
  }
});

// -------- CREDIT SYSTEM API --------

// Get user credits and badges
app.get("/api/credits", requireAuth, (req, res) => {
  const userId = req.session.user.id;
  initializeUserCredits(userId);
  
  const creditData = userCredits.get(userId);
  const userBadges = badges.get(userId);
  
  res.json({
    success: true,
    credits: creditData,
    badges: userBadges,
    nextBadges: getNextAvailableBadges(userId)
  });
});

// Get credit transaction history
app.get("/api/credits/history", requireAuth, (req, res) => {
  const userId = req.session.user.id;
  const userTransactions = transactions
    .filter(t => t.userId === userId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
  res.json({
    success: true,
    transactions: userTransactions
  });
});

// Get leaderboard
app.get("/api/leaderboard", (req, res) => {
  const leaderboard = Array.from(userCredits.entries())
    .map(([userId, creditData]) => {
      const user = users.find(u => u.id === userId);
      return {
        userId,
        name: user ? user.name : 'Unknown',
        totalCredits: creditData.totalCredits,
        reportCount: creditData.reportCount,
        badges: badges.get(userId) || [],
        badgeCount: (badges.get(userId) || []).length
      };
    })
    .sort((a, b) => b.totalCredits - a.totalCredits)
    .slice(0, 10); // Top 10
    
  res.json({
    success: true,
    leaderboard
  });
});

// Redeem credits (voucher system)
app.post("/api/credits/redeem", requireAuth, (req, res) => {
  const userId = req.session.user.id;
  const { rewardId, credits: redeemAmount } = req.body;
  
  initializeUserCredits(userId);
  const creditData = userCredits.get(userId);
  
  if (creditData.availableCredits < redeemAmount) {
    return res.json({ success: false, error: "Insufficient credits" });
  }
  
  // Redeem credits
  creditData.availableCredits -= redeemAmount;
  creditData.redeemed += redeemAmount;
  
  // Create redemption transaction
  const transaction = {
    id: transactions.length + 1,
    userId,
    action: 'REDEMPTION',
    credits: -redeemAmount,
    description: `Redeemed for reward: ${rewardId}`,
    reportId: null,
    rewardId,
    timestamp: new Date().toISOString()
  };
  transactions.push(transaction);
  
  res.json({
    success: true,
    message: "Credits redeemed successfully!",
    remaining: creditData.availableCredits,
    transaction
  });
});

function getNextAvailableBadges(userId) {
  const creditData = userCredits.get(userId);
  const userBadges = badges.get(userId);
  const nextBadges = [];
  
  Object.entries(BADGE_THRESHOLDS).forEach(([badgeKey, badge]) => {
    if (userBadges.some(b => b.key === badgeKey)) return;
    
    let progress = 0;
    let target = 0;
    
    if (badge.credits) {
      progress = creditData.totalCredits;
      target = badge.credits;
    } else if (badge.reports) {
      progress = creditData.reportCount;
      target = badge.reports;
    } else if (badge.gps_reports) {
      progress = creditData.gpsReportCount;
      target = badge.gps_reports;
    }
    
    if (progress < target) {
      nextBadges.push({
        ...badge,
        key: badgeKey,
        progress,
        target,
        percentage: Math.min(100, (progress / target) * 100)
      });
    }
  });
  
  return nextBadges.sort((a, b) => b.percentage - a.percentage).slice(0, 3);
}

// Submit report
app.post("/api/report", requireAuth, upload.single("photo"), (req, res) => {
  try {
    const { description, address, lat, lng } = req.body;
    const userId = req.session.user.id;
    
    const report = {
      id: reportIdCounter++,
      userId,
      user: {
        name: req.session.user.name,
        email: req.session.user.email
      },
      description: description || "",
      address: address || null,
      lat: lat ? parseFloat(lat) : null,
      lng: lng ? parseFloat(lng) : null,
      photoUrl: req.file ? `/uploads/${req.file.filename}` : null,
      photoFilename: req.file ? req.file.filename : null,
      status: "Pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    reports.push(report);
    
    // Initialize credits for new users
    initializeUserCredits(userId);
    
    // Award credits for report submission
    const creditData = userCredits.get(userId);
    const creditsEarned = [];
    
    // Base credit for submitting report
    const baseReward = awardCredits(userId, 'REPORT_SUBMITTED', report.id);
    creditsEarned.push(baseReward);
    
    // GPS bonus
    if (report.lat && report.lng) {
      const gpsReward = awardCredits(userId, 'REPORT_WITH_GPS', report.id);
      creditsEarned.push(gpsReward);
      creditData.gpsReportCount++;
    }
    
    // First report bonus
    if (creditData.reportCount === 0) {
      const firstReward = awardCredits(userId, 'FIRST_REPORT', report.id);
      creditsEarned.push(firstReward);
    }
    
    // Quality bonus
    const qualityScore = calculateReportQuality(report);
    if (qualityScore >= 80) {
      const qualityReward = awardCredits(userId, 'QUALITY_REPORT', report.id);
      creditsEarned.push(qualityReward);
    }
    
    // Update report count
    creditData.reportCount++;
    
    // Check for new badges
    const newBadges = checkAndAwardBadges(userId);
    
    // Calculate total credits earned
    const totalEarned = creditsEarned.reduce((sum, reward) => sum + reward.credits, 0);
    
    res.json({ 
      success: true, 
      report,
      credits: {
        earned: totalEarned,
        total: creditData.totalCredits,
        available: creditData.availableCredits,
        newBadges: newBadges,
        breakdown: creditsEarned.map(r => ({
          action: r.transaction.action,
          credits: r.credits,
          description: r.transaction.description
        }))
      }
    });
  } catch (error) {
    console.error('Report submission error:', error);
    res.json({ success: false, error: "Failed to submit report" });
  }
});

// Get user's reports
app.get("/api/myreports", requireAuth, (req, res) => {
  try {
    const userReports = reports
      .filter(r => r.userId === req.session.user.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json({ success: true, reports: userReports });
  } catch (error) {
    res.json({ success: false, error: "Failed to fetch reports" });
  }
});

// Get all reports (protected - admin only)
app.get("/api/reports", requireAdminAuth, (req, res) => {
  try {
    const sortedReports = reports
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json(sortedReports);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch reports" });
  }
});

// Update report status (protected - admin only)
app.post("/api/report/:id/status", requireAdminAuth, (req, res) => {
  try {
    const reportId = parseInt(req.params.id);
    const { status } = req.body;
    
    const validStatuses = ['Pending', 'In Progress', 'Resolved'];
    if (!validStatuses.includes(status)) {
      return res.json({ success: false, error: "Invalid status" });
    }

    const reportIndex = reports.findIndex(r => r.id === reportId);
    if (reportIndex === -1) {
      return res.json({ success: false, error: "Report not found" });
    }

    const oldStatus = reports[reportIndex].status;
    reports[reportIndex].status = status;
    reports[reportIndex].updatedAt = new Date().toISOString();
    
    // Award credits based on status changes
    if (oldStatus !== status) {
      const userId = reports[reportIndex].userId;
      
      if (status === 'In Progress' && oldStatus === 'Pending') {
        awardCredits(userId, 'REPORT_VERIFIED', reportId);
      } else if (status === 'Resolved') {
        awardCredits(userId, 'REPORT_RESOLVED', reportId);
      }
    }
    
    res.json({ success: true, report: reports[reportIndex] });
  } catch (error) {
    res.json({ success: false, error: "Failed to update status" });
  }
});

// Serve specific HTML files
app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Serve main page for root and unknown routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Fallback for any other routes
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, error: 'File too large' });
    }
  }
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ GreenCredits server running at http://localhost:${PORT}`);
  console.log(`📁 Uploads directory: ${uploadsDir}`);
  console.log(`🌿 Ready to accept waste reports!`);
});