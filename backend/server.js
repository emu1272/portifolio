/**
 * Express Server Entry Point
 * 
 * Portfolio Backend API for Emebet Morde
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { isConfigured, testConnection, getPool } = require('./config/db');
const projectsRouter = require('./routes/projects');
const certificatesRouter = require('./routes/certificates');

const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/auth");

const app = express();
const PORT = process.env.PORT || 5000;

// ==========================================
// Middleware
// ==========================================

// Enable CORS so our React frontend (port 5173) can communicate with this API
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

// Parse incoming JSON request bodies
app.use(express.json());

// Parse cookies BEFORE mounting auth routes so req.cookies is available
app.use(cookieParser());

app.use("/api/auth", authRoutes);
// ==========================================
// API Endpoints
// ==========================================

/**
 * Root Welcome Route
 * Useful when visiting http://localhost:5000 in your web browser
 */
app.get('/', (req, res) => {
  res.status(200).json({
    message: "Welcome to Emebet Morde's Portfolio API",
    status: 'online',
    endpoints: {
      health: '/api/health',
      projects: '/api/projects'
    }
  });
});

/**
 * @route   GET /api/health
 * @desc    API and Database Health Check
 * @access  Public
 */
app.get('/api/health', async (req, res) => {
  let dbStatus = {
    configured: isConfigured(),
    status: 'awaiting_credentials',
    message: 'Database connection deferred. Add your Aiven credentials to backend/.env to connect.'
  };

  // Only test database connection if credentials have actually been configured
  if (dbStatus.configured) {
    dbStatus = await testConnection();
  }

  res.status(200).json({
    status: 'ok',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    database: dbStatus
  });
});

/**
 * Mount Projects Route
 * Handles GET /api/projects
 */
app.use('/api/projects', projectsRouter);
app.use('/api/certificates', certificatesRouter);

/**
 * @route   GET /api/messages
 * @desc    Get all contact messages (admin only)
 * @access  Admin
 */
const requireAdmin = require('./requireAdmin');

app.get('/api/messages', requireAdmin, async (req, res) => {
  const pool = getPool();

  if (!pool) {
    return res.status(503).json({
      success: false,
      message: 'Database is not configured. Messages are only saved when a database is connected.'
    });
  }

  try {
    const [rows] = await pool.execute(
      'SELECT id, name, email, message, received_at FROM contact_messages ORDER BY received_at DESC'
    );
    res.status(200).json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve messages.', error: error.message });
  }
});

/**
 * @route   POST /api/contact
 * @desc    Receive contact form submission and save to database
 * @access  Public
 */
app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({
      success: false,
      message: 'Please provide name, email, and message.'
    });
  }

  console.log(`📩 New message from ${name} (${email}):`, message);

  // Save to database if configured
  const pool = getPool();
  if (pool) {
    try {
      await pool.execute(
        'INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)',
        [name.trim(), email.trim(), message.trim()]
      );
    } catch (dbErr) {
      console.error('Failed to save contact message to database:', dbErr.message);
      // Still respond success — message was received even if DB failed
    }
  }

  res.status(200).json({
    success: true,
    message: 'Thank you! Your message has been received.'
  });
});

// ==========================================
// Error Handling Middleware
// ==========================================

// 404 Handler for undefined routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.originalUrl} not found on this server.`
  });
});

// Global 500 Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error occurred.',
    error: process.env.NODE_ENV === 'production' ? null : err.message
  });
});

// ==========================================
// Start Server
// ==========================================
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 Emebet's Portfolio Backend Server Running!`);
  console.log(`📍 Local URL: http://localhost:${PORT}`);
  console.log(`🩺 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`📁 Projects API: http://localhost:${PORT}/api/projects`);
  console.log(`🔐 Database: ${isConfigured() ? 'Configured in .env' : 'Awaiting credentials in backend/.env'}`);
  console.log(`===============================================`);
});