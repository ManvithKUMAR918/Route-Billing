import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../api';
import { useToast } from '../context/ToastContext';

export default function Finance() {
  const [finance, setFinance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const { showToast } = useToast();

  useEffect(() => {
    api.getFinanceSummary().then(res => setFinance(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (!finance) return <div className="empty-state"><p>Could not load finance data</p></div>;

  const EXPENSE_COLORS = { Fuel: '#6366f1', Maintenance: '#f59e0b', 'Driver Salary': '#10b981', Other: '#06b6d4' };

  return (
    <div className="page-container">
      <div className="topbar" style={{ marginLeft: '-32px', marginRight: '-32px', marginTop: '-32px', marginBottom: '32px', paddingLeft: '32px', paddingRight: '32px' }}>
        <div className="topbar-title">
          <h1>💼 Finance Center</h1>
          <p>Step 3 — Route fees, expenses, payments, dues & clean finance reporting</p>
        </div>
        <div className="topbar-actions">
          <button className="btn btn-outline">⬇ Export Report</button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Expected', value: `₹${finance.total_expected.toLocaleString()}`, icon: '🎯', color: 'indigo', sub: 'All route fees this month' },
          { label: 'Total Collected', value: `₹${finance.total_collected.toLocaleString()}`, icon: '💰', color: 'green', sub: `${finance.collection_rate}% collection rate` },
          { label: 'Pending Dues', value: `₹${finance.total_dues.toLocaleString()}`, icon: '⚠️', color: 'amber', sub: 'Needs immediate follow-up' },
          { label: 'Total Expenses', value: `₹${finance.total_expenses.toLocaleString()}`, icon: '📤', color: 'cyan', sub: 'Driver, fuel, maintenance' },
        ].map((s, i) => (
          <motion.div key={i} className={`stat-card ${s.color}`}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-sub">{s.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Net Balance highlight */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        style={{ background: finance.net_balance >= 0 ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${finance.net_balance >= 0 ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`, borderRadius: 12, padding: '16px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>NET BALANCE (Collected − Expenses)</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: finance.net_balance >= 0 ? 'var(--success)' : 'var(--danger)' }}>
            {finance.net_balance >= 0 ? '+' : ''}₹{Math.abs(finance.net_balance).toLocaleString()}
          </div>
        </div>
        <div style={{ fontSize: 36 }}>{finance.net_balance >= 0 ? '📈' : '📉'}</div>
      </motion.div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--bg-card)', padding: 4, borderRadius: 10, border: '1px solid var(--border)', width: 'fit-content' }}>
        {['overview', 'routes', 'expenses', 'payment_modes'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{ padding: '8px 16px', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', background: activeTab === tab ? 'var(--primary)' : 'transparent', color: activeTab === tab ? 'white' : 'var(--text-muted)', transition: 'all 0.2s' }}>
            {{ overview: '📊 Overview', routes: '🗺️ Routes', expenses: '📤 Expenses', payment_modes: '💳 Payment Modes' }[tab]}
          </button>
        ))}
      </div>

      {/* Route Breakdown */}
      {activeTab === 'routes' && (
        <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="card-header"><h3 className="card-title">🗺️ Route-wise Fee Breakdown</h3></div>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Route</th><th>Students</th><th>Monthly Total</th><th>Collected</th><th>Due</th><th>Status</th></tr></thead>
              <tbody>
                {finance.route_fees.map((r, i) => (
                  <tr key={i}>
                    <td className="td-name">{r.route}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{r.students}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>₹{r.monthly_total.toLocaleString()}</td>
                    <td className="td-amount">₹{r.collected.toLocaleString()}</td>
                    <td style={{ color: r.due > 0 ? 'var(--warning)' : 'var(--success)', fontWeight: 700 }}>₹{r.due.toLocaleString()}</td>
                    <td><span className={`badge ${r.due === 0 ? 'badge-success' : r.due < r.monthly_total ? 'badge-warning' : 'badge-danger'}`}>{r.due === 0 ? 'Fully Paid' : r.due < r.monthly_total ? 'Partial' : 'Unpaid'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Expenses */}
      {activeTab === 'expenses' && (
        <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="card-header">
            <h3 className="card-title">📤 Expense Records</h3>
            <span style={{ fontSize: 13, color: 'var(--danger)', fontWeight: 700 }}>Total: ₹{finance.total_expenses.toLocaleString()}</span>
          </div>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>#</th><th>Category</th><th>Description</th><th>Amount</th><th>Date</th><th>Approved By</th></tr></thead>
              <tbody>
                {finance.expenses.map((exp) => (
                  <tr key={exp.id}>
                    <td style={{ color: 'var(--text-muted)' }}>{exp.id}</td>
                    <td>
                      <span className="badge" style={{ background: `${EXPENSE_COLORS[exp.category] || '#6366f1'}20`, color: EXPENSE_COLORS[exp.category] || '#6366f1', border: `1px solid ${EXPENSE_COLORS[exp.category] || '#6366f1'}40` }}>
                        {exp.category}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{exp.description}</td>
                    <td style={{ color: 'var(--danger)', fontWeight: 700 }}>₹{exp.amount.toLocaleString()}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{exp.date}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{exp.approved_by}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Payment Modes */}
      {activeTab === 'payment_modes' && (
        <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="card-header"><h3 className="card-title">💳 Payment Mode Breakdown</h3></div>
          <div className="card-body">
            {finance.payment_modes.map((pm, i) => {
              const colors = { cash: '#10b981', online: '#6366f1', upi: '#06b6d4', cheque: '#f59e0b' };
              const color = colors[pm.mode] || '#94a3b8';
              const pct = Math.round((pm.amount / finance.total_collected) * 100);
              return (
                <div key={i} style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: 13 }}>{pm.mode}</span>
                    <span style={{ color, fontWeight: 700 }}>₹{pm.amount.toLocaleString()} ({pm.count} txn)</span>
                  </div>
                  <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
                    <motion.div style={{ height: '100%', background: color, borderRadius: 99 }}
                      initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: i * 0.15, duration: 0.8 }} />
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>{pct}% of total collected</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="grid-2">
            <div className="card">
              <div className="card-header"><h3 className="card-title">🗺️ Route Summary</h3></div>
              <div className="card-body">
                {finance.route_fees.map((r, i) => (
                  <div key={i} style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{r.route}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--success)' }}>₹{r.collected.toLocaleString()} / ₹{r.monthly_total.toLocaleString()}</span>
                    </div>
                    <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 99 }}>
                      <motion.div style={{ height: '100%', background: `hsl(${230 + i * 40}, 70%, 60%)`, borderRadius: 99 }}
                        initial={{ width: 0 }} animate={{ width: `${(r.collected / r.monthly_total) * 100}%` }} transition={{ delay: i * 0.1, duration: 0.8 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <div className="card-header"><h3 className="card-title">📤 Expense Summary</h3></div>
              <div className="card-body">
                {Object.entries(finance.expenses.reduce((acc, e) => { acc[e.category] = (acc[e.category] || 0) + e.amount; return acc; }, {})).map(([cat, amt], i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: EXPENSE_COLORS[cat] || '#94a3b8', marginRight: 8 }} />
                      {cat}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--danger)' }}>₹{amt.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
