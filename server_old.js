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

// In-memory data storage (replace with database in production)
let users = [];
let reports = [];
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
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
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
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Auth middleware
const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, error: "Authentication required" });
  }
  next();
};

// -------- ROUTES --------

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

// Submit report
app.post("/api/report", requireAuth, upload.single("photo"), (req, res) => {
  try {
    const { description, address, lat, lng } = req.body;
    
    const report = {
      id: reportIdCounter++,
      userId: req.session.user.id,
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
    res.json({ success: true, report });
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

// Get all reports (for admin/municipality)
app.get("/api/reports", (req, res) => {
  try {
    const sortedReports = reports
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json(sortedReports);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch reports" });
  }
});

// Update report status
app.post("/api/report/:id/status", (req, res) => {
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

    reports[reportIndex].status = status;
    reports[reportIndex].updatedAt = new Date().toISOString();
    
    res.json({ success: true, report: reports[reportIndex] });
  } catch (error) {
    res.json({ success: false, error: "Failed to update status" });
  }
});

// Serve admin page
app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Handle SPA routing - serve index.html for unknown routes
app.get('*', (req, res) => {
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