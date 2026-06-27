const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// Existing Routes
const studentsRouter = require('./routes/students');
const transportRouter = require('./routes/transport');
const paymentsRouter = require('./routes/payments');
const duesRouter = require('./routes/dues');
const dashboardRouter = require('./routes/dashboard');

// New Workflow Routes
const enquiriesRouter = require('./routes/enquiries');
const followupsRouter = require('./routes/followups');
const exitsRouter = require('./routes/exits');
const financeRouter = require('./routes/finance');
const insightsRouter = require('./routes/insights');
const messagesRouter = require('./routes/messages');

// Mount all routes
app.use('/api/students', studentsRouter);
app.use('/api/transport', transportRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/dues', duesRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/enquiries', enquiriesRouter);
app.use('/api/followups', followupsRouter);
app.use('/api/exits', exitsRouter);
app.use('/api/finance', financeRouter);
app.use('/api/insights', insightsRouter);
app.use('/api/messages', messagesRouter);

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Transport Fee & Billing API — All systems running 🚌',
    routes: [
      '/api/students', '/api/transport', '/api/payments', '/api/dues',
      '/api/dashboard', '/api/enquiries', '/api/followups', '/api/exits',
      '/api/finance', '/api/insights', '/api/messages'
    ]
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📋 All 11 API route groups registered`);
});
