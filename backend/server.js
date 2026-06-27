const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────────
// Allow local dev + the deployed Vercel frontend origin
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  // Vercel preview & production — wildcard for your project
  /\.vercel\.app$/,
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. curl, Postman)
    if (!origin) return callback(null, true);
    const allowed = allowedOrigins.some(o =>
      typeof o === 'string' ? o === origin : o.test(origin)
    );
    if (allowed) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));

app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────
const studentsRouter  = require('./routes/students');
const transportRouter = require('./routes/transport');
const paymentsRouter  = require('./routes/payments');
const duesRouter      = require('./routes/dues');
const dashboardRouter = require('./routes/dashboard');
const enquiriesRouter = require('./routes/enquiries');
const followupsRouter = require('./routes/followups');
const exitsRouter     = require('./routes/exits');
const financeRouter   = require('./routes/finance');
const insightsRouter  = require('./routes/insights');
const messagesRouter  = require('./routes/messages');

app.use('/api/students',  studentsRouter);
app.use('/api/transport', transportRouter);
app.use('/api/payments',  paymentsRouter);
app.use('/api/dues',      duesRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/enquiries', enquiriesRouter);
app.use('/api/followups', followupsRouter);
app.use('/api/exits',     exitsRouter);
app.use('/api/finance',   financeRouter);
app.use('/api/insights',  insightsRouter);
app.use('/api/messages',  messagesRouter);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Transport Fee & Billing API — All systems running 🚌',
    env: process.env.NODE_ENV || 'development',
    routes: [
      '/api/students', '/api/transport', '/api/payments', '/api/dues',
      '/api/dashboard', '/api/enquiries', '/api/followups', '/api/exits',
      '/api/finance', '/api/insights', '/api/messages'
    ]
  });
});

// ── Start server locally (not on Vercel) ──────────────────────────────────────
// Vercel runs the file as a module and imports `module.exports` directly.
// The `require.main === module` guard ensures listen() only fires when you
// run `node server.js` locally.
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📋 All 11 API route groups registered`);
  });
}

module.exports = app;
