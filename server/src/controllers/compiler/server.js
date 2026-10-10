const express = require('express');
const cors = require('cors');
const routes = require('./routes/index');
const { getActiveProcesses } = require('./utils/processManager');

const app = express();

const PORT = process.env.PORT || 3011;
const FRONTEND_URL = process.env.FRONTEND_URL || '*'; // fallback

// Parse allowed origins from environment variable (comma-separated)
const getAllowedOrigins = () => {
  if (FRONTEND_URL === '*') {
    return ['*']; // Allow all origins (development only)
  }
  
  // Split by comma and trim whitespace
  const origins = FRONTEND_URL.split(',').map(url => url.trim()).filter(url => url);
  
  return origins;
};

const allowedOrigins = getAllowedOrigins();

// Log loaded CORS configuration on startup
console.log(`CORS Configuration loaded. Allowed patterns: ${allowedOrigins.join(', ')}`);
console.log(`FRONTEND_URL environment variable: ${FRONTEND_URL}`);

// Check if origin matches allowed patterns (supports wildcard subdomains like *.amypo.ai)
const isOriginAllowed = (origin) => {
  // If wildcard is set, allow all origins
  if (allowedOrigins.includes('*')) {
    return true;
  }
  
  // Allow any localhost origin (for local development)
  // This allows http://localhost:3000, http://localhost:8080, http://127.0.0.1:3000, etc.
  try {
    const originUrl = new URL(origin);
    const hostname = originUrl.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0') {
      console.log(`CORS: Allowing localhost origin: ${origin}`);
      return true;
    }
  } catch (e) {
    // If URL parsing fails, check if it contains localhost
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      console.log(`CORS: Allowing localhost origin (fallback): ${origin}`);
      return true;
    }
  }
  
  // Check each allowed origin pattern
  for (const allowedOrigin of allowedOrigins) {
    // Exact match
    if (origin === allowedOrigin) {
      return true;
    }
    
    // Wildcard subdomain pattern (e.g., *.amypo.ai)
    if (allowedOrigin.startsWith('*.')) {
      const domain = allowedOrigin.substring(2); // Remove '*.' prefix
      // Extract protocol and domain from origin (e.g., https://subdomain.amypo.ai -> subdomain.amypo.ai)
      try {
        const originUrl = new URL(origin);
        const originHost = originUrl.hostname;
        
        // Check if origin hostname ends with the domain (supports any subdomain)
        if (originHost === domain || originHost.endsWith('.' + domain)) {
          return true;
        }
      } catch (e) {
        // If URL parsing fails, try simple string matching
        if (origin.includes(domain)) {
          return true;
        }
      }
    }
  }
  
  return false;
};

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin matches allowed patterns
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      console.warn(`Allowed patterns: ${allowedOrigins.join(', ')}`);
      console.warn(`FRONTEND_URL env: ${FRONTEND_URL}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'DELETE', 'PUT', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-username', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Compiler server is running' });
});

// Routes
app.use('/api', routes);

// 404 handler for undefined routes
app.use((req, res) => {
  console.warn(`404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({ 
    error: 'Route not found', 
    message: `The requested endpoint ${req.method} ${req.path} does not exist`,
    availableEndpoints: [
      'GET /health',
      'POST /api/batch',
      'POST /api/text',
      'POST /api/interactive',
      'POST /api/htmlpuppeteer'
    ]
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack || err.message || err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`Code Execution Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nCleaning up before shutdown...');

  const processes = getActiveProcesses();
  if (processes && typeof processes.forEach === 'function') {
    processes.forEach(proc => {
      try {
        proc.kill();
      } catch (e) {
        console.error('Error killing process:', e.message);
      }
    });

    if (typeof processes.clear === 'function') {
      processes.clear();
    }
  }

  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

module.exports = app;
