import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import StatCard from '../components/StatCard';
import { api } from '../api';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#1a2234', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 14px' }}>
        <p style={{ color: '#94a3b8', fontSize: 12 }}>{label}</p>
        <p style={{ color: '#818cf8', fontWeight: 700, fontSize: 16 }}>₹{payload[0].value.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboardStats()
      .then(res => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (!stats) return <div className="empty-state"><p>Could not load dashboard</p></div>;

  const paymentModeColor = { cash: '#10b981', online: '#6366f1', upi: '#06b6d4', cheque: '#f59e0b' };

  return (
    <div className="page-container">
      {/* Topbar */}
      <div className="topbar" style={{ marginLeft: '-32px', marginRight: '-32px', marginTop: '-32px', marginBottom: '32px', paddingLeft: '32px', paddingRight: '32px' }}>
        <div className="topbar-title">
          <h1>🏠 Dashboard</h1>
          <p>Welcome back, Admin — here's what's happening today</p>
        </div>
        <div className="topbar-actions">
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>📅 {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        <StatCard icon="👨‍🎓" value={stats.totalStudents} label="Total Students" sub="Enrolled this term" color="indigo" index={0} />
        <StatCard icon="🚌" value={stats.activeTransport} label="Active Routes" sub="Transport assignments" color="cyan" index={1} />
        <StatCard icon="💰" value={`₹${stats.totalCollected.toLocaleString()}`} label="Total Collected" sub="This month" color="green" index={2} />
        <StatCard icon="⚠️" value={`₹${stats.pendingDues.toLocaleString()}`} label="Pending Dues" sub="Needs follow-up" color="amber" index={3} />
      </div>

      {/* Charts + Recent */}
      <div className="grid-2" style={{ gap: 24, marginBottom: 24 }}>
        {/* Monthly Collection Chart */}
        <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div className="card-header">
            <h3 className="card-title">📈 Monthly Collection</h3>
            <span className="badge badge-info">2026</span>
          </div>
          <div className="card-body" style={{ padding: '20px 16px' }}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.monthlyCollection} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v/1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="amount" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Route Summary */}
        <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <div className="card-header">
            <h3 className="card-title">🗺️ Route Summary</h3>
          </div>
          <div className="card-body">
            {stats.routeSummary.map((route, i) => (
              <div key={i} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{route.route_name}</span>
                  <span style={{ fontSize: 13, color: 'var(--success)', fontWeight: 700 }}>₹{route.total_fee.toLocaleString()}</span>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
                  <motion.div
                    style={{ height: '100%', background: `hsl(${230 + i * 30}, 80%, 60%)`, borderRadius: 99 }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(route.count / 5) * 100}%` }}
                    transition={{ delay: 0.6 + i * 0.1, duration: 0.8 }}
                  />
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>{route.count} students</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent Payments Table */}
      <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
        <div className="card-header">
          <h3 className="card-title">💳 Recent Payments</h3>
          <a href="/payments" style={{ fontSize: 13, color: 'var(--primary-light)', textDecoration: 'none', fontWeight: 500 }}>View all →</a>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Amount</th>
                <th>Month</th>
                <th>Mode</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentPayments.map((p) => (
                <tr key={p.id}>
                  <td className="td-name">{p.student_name}</td>
                  <td className="td-amount">₹{p.amount_paid.toLocaleString()}</td>
                  <td><span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{p.month_paid}</span></td>
                  <td>
                    <span className="badge" style={{ background: `${paymentModeColor[p.payment_mode]}22`, color: paymentModeColor[p.payment_mode], border: `1px solid ${paymentModeColor[p.payment_mode]}44` }}>
                      {p.payment_mode.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{p.payment_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
