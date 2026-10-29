const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const dns = require('dns');

// On Windows / cellular networks, local gateway DNS frequently refuses SRV queries.
// Set public DNS resolvers (Google & Cloudflare) for reliable SRV resolution.
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (dnsErr) {}

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is required.');
  process.exit(1);
}

const authRoutes = require('./routes/authRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const userRoutes = require('./routes/userRoutes');
const contactRoutes = require('./routes/contactRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const publicRoutes = require('./routes/publicRoutes');
const auditRoutes = require('./routes/auditRoutes');
const { notFoundHandler, errorHandler } = require('./middleware/errorMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';

// Ensure uploads dir exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Security headers with Helmet
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Hardened CORS policy
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:5174'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (such as mobile apps, server-to-server or tests)
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS policy violation: origin ${origin} is not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Protect direct public access to /uploads directory
app.use('/uploads', (req, res) => {
  res.status(403).json({
    message: 'Direct access to evidence upload directory is forbidden. Please access evidence via the authenticated evidence API.'
  });
});

// Basic Route
app.get('/', (req, res) => {
  res.send('Crime Complaint Management System Backend is running!');
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/users', userRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/audit', auditRoutes);

// Centralized error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Database Connection Architecture
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/crime_complaint_db';
const useMockExplicit = process.env.USE_MOCK_DATA === 'true';

const startServer = async () => {
  if (isProduction && useMockExplicit) {
    console.error('FATAL: USE_MOCK_DATA=true is forbidden in production environment. Terminating.');
    process.exit(1);
  }

  if (useMockExplicit) {
    global.useMockData = true;
    console.log('[Database] Mock data mode explicitly enabled via USE_MOCK_DATA=true.');
  } else {
    try {
      console.log('[Database] Attempting connection to MongoDB...');
      // On Windows / cellular networks, local gateway DNS frequently refuses SRV queries.
      // Set public DNS resolvers (Google & Cloudflare) for reliable SRV resolution.
      try {
        const dns = require('dns');
        dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
      } catch (dnsErr) {}

      await mongoose.connect(MONGO_URI, {
        serverSelectionTimeoutMS: 15000
      });
      global.useMockData = false;
      console.log('Successfully connected to MongoDB.');
    } catch (err) {
      console.error('FATAL: Could not connect to MongoDB:', err.message);
      if (isProduction) {
        console.error('Production startup failed due to database connection error.');
        process.exit(1);
      } else {
        console.error('To run with local mock data in development, explicitly set USE_MOCK_DATA=true in backend/.env');
        process.exit(1);
      }
    }
  }

  // Start the server
  app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT} (Environment: ${NODE_ENV})`);
    console.log(global.useMockData ? 'Mode: Mock Data' : 'Mode: MongoDB Production');
  });
};

startServer();

module.exports = app;
