import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../api';
import { useToast } from '../context/ToastContext';

export default function Finance() {
  const [finance, setFinance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const { showToast } = useToast();

  // WhatsApp Alerts State
  const [alertStudents, setAlertStudents] = useState([]);
  const [alertLogs, setAlertLogs] = useState([]);
  const [showPaidModal, setShowPaidModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [paidAmount, setPaidAmount] = useState('');
  const [paidDate, setPaidDate] = useState(new Date().toISOString().split('T')[0]);
  const [actionLoading, setActionLoading] = useState(false);

  const loadAlertData = () => {
    api.getAlertStudents()
      .then(res => setAlertStudents(res.data || []))
      .catch(err => showToast(err.message, 'error'));
      
    api.getAlertLogs()
      .then(res => setAlertLogs(res.data || []))
      .catch(err => showToast(err.message, 'error'));
  };

  useEffect(() => {
    api.getFinanceSummary().then(res => setFinance(res.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (activeTab === 'alerts') {
      loadAlertData();
    }
  }, [activeTab]);

  const handleSendReminder = async (studentId, type) => {
    setActionLoading(true);
    try {
      await api.sendManualAlert({ student_id: studentId, alert_type: type });
      showToast(`Reminder alert sent successfully!`, 'success');
      loadAlertData();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkPaid = async (e) => {
    e.preventDefault();
    if (!paidAmount || !paidDate) {
      showToast('Please specify both amount and date.', 'error');
      return;
    }
    setActionLoading(true);
    try {
      await api.markPaid({
        student_id: selectedStudent.student_id,
        paid_amount: parseFloat(paidAmount),
        paid_date: paidDate
      });
      showToast('Payment recorded successfully. WhatsApp confirmation sent!', 'success');
      setShowPaidModal(false);
      loadAlertData();
      // Refresh summary
      api.getFinanceSummary().then(res => setFinance(res.data));
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (!finance) return <div className="empty-state"><p>Could not load finance data</p></div>;

  const EXPENSE_COLORS = { Fuel: '#6366f1', Maintenance: '#f59e0b', 'Driver Salary': '#10b981', Other: '#06b6d4' };

  // Calculate alerts metrics
  const pendingCount = alertStudents.filter(s => s.payment_status === 'pending').length;
  const overdueCount = alertStudents.filter(s => s.payment_status === 'overdue').length;
  const alertsSentToday = alertLogs.filter(log => {
    const logDate = new Date(log.sent_at).toDateString();
    const today = new Date().toDateString();
    return logDate === today;
  }).length;

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
        {['overview', 'routes', 'expenses', 'payment_modes', 'alerts'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{ padding: '8px 16px', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', background: activeTab === tab ? 'var(--primary)' : 'transparent', color: activeTab === tab ? 'white' : 'var(--text-muted)', transition: 'all 0.2s' }}>
            {{ overview: '📊 Overview', routes: '🗺️ Routes', expenses: '📤 Expenses', payment_modes: '💳 Payment Modes', alerts: '💬 WhatsApp Alerts' }[tab]}
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

      {/* WhatsApp Alerts Tab */}
      {activeTab === 'alerts' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Metrics Grid */}
          <div className="stats-grid" style={{ marginBottom: 24 }}>
            {[
              { label: 'Total Pending', value: pendingCount, icon: '⏳', color: 'indigo', sub: 'Awaiting fee payment' },
              { label: 'Total Overdue', value: overdueCount, icon: '🚨', color: 'amber', sub: 'Past payment due dates' },
              { label: 'Alerts Sent Today', value: alertsSentToday, icon: '💬', color: 'green', sub: 'Dispatched via Twilio Sandbox' },
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

          {/* Alert Students List Table */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header"><h3 className="card-title">💬 WhatsApp Billing & Alerts Management</h3></div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Route</th>
                    <th>Monthly Fee</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th>Last Alert Sent</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {alertStudents.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
                        No transport fee alert records found.
                      </td>
                    </tr>
                  ) : (
                    alertStudents.map((fee) => (
                      <tr key={fee.id}>
                        <td className="td-name">
                          <div>{fee.student_name}</div>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Parent: {fee.parent_name} (+{fee.parent_phone})</span>
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>{fee.route_name}</td>
                        <td className="td-amount">₹{fee.monthly_fee.toLocaleString()}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>
                          {new Date(fee.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td>
                          <span className={`badge ${
                            fee.payment_status === 'paid' ? 'badge-success' : 
                            fee.payment_status === 'overdue' ? 'badge-danger' : 'badge-warning'
                          }`}>
                            {fee.payment_status.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                          {fee.last_alert_sent 
                            ? new Date(fee.last_alert_sent).toLocaleString('en-IN')
                            : 'Never'
                          }
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 8 }}>
                            {fee.payment_status !== 'paid' && (
                              <>
                                <button 
                                  className="btn btn-sm btn-primary"
                                  onClick={() => {
                                    setSelectedStudent(fee);
                                    setPaidAmount(fee.monthly_fee);
                                    setShowPaidModal(true);
                                  }}
                                  disabled={actionLoading}
                                >
                                  💸 Mark Paid
                                </button>
                                <div style={{ display: 'flex', gap: 4 }}>
                                  <button 
                                    className="btn btn-sm btn-outline"
                                    title="Send Upcoming Due Reminder"
                                    onClick={() => handleSendReminder(fee.student_id, 'upcoming')}
                                    disabled={actionLoading}
                                  >
                                    🔔 Upcoming
                                  </button>
                                  <button 
                                    className="btn btn-sm btn-outline"
                                    title="Send Due Today Alert"
                                    onClick={() => handleSendReminder(fee.student_id, 'due_today')}
                                    disabled={actionLoading}
                                  >
                                    📱 Due Today
                                  </button>
                                  {fee.payment_status === 'overdue' && (
                                    <button 
                                      className="btn btn-sm btn-outline"
                                      style={{ color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.3)' }}
                                      title="Send Overdue Warning Alert"
                                      onClick={() => handleSendReminder(fee.student_id, 'overdue')}
                                      disabled={actionLoading}
                                    >
                                      ⚠️ Overdue
                                    </button>
                                  )}
                                </div>
                              </>
                            )}
                            {fee.payment_status === 'paid' && (
                              <button 
                                className="btn btn-sm btn-outline"
                                style={{ color: 'var(--success)' }}
                                disabled={true}
                              >
                                ✅ Fully Paid
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Logs Panel */}
          <div className="card">
            <div className="card-header"><h3 className="card-title">📜 Recent Alert Logs (Last 20)</h3></div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Parent Phone</th>
                    <th>Message Type</th>
                    <th>Message Body</th>
                    <th>Status</th>
                    <th>Sent At</th>
                  </tr>
                </thead>
                <tbody>
                  {alertLogs.slice(0, 20).length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-muted)' }}>
                        No WhatsApp logs dispatched yet.
                      </td>
                    </tr>
                  ) : (
                    alertLogs.slice(0, 20).map((log) => (
                      <tr key={log.id}>
                        <td className="td-name">{log.student_name}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>+{log.parent_phone}</td>
                        <td>
                          <span className="badge" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}>
                            {log.message_type.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: 12, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.message_body}>
                          {log.message_body}
                        </td>
                        <td>
                          <span className={`badge ${log.status === 'sent' ? 'badge-success' : 'badge-danger'}`}>
                            {log.status}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                          {new Date(log.sent_at).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* Mark as Paid modal overlay */}
      {showPaidModal && selectedStudent && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>💸 Record Transport Payment</h2>
              <button className="btn btn-sm btn-outline" style={{ background: 'transparent', border: 'none', fontSize: 16, cursor: 'pointer' }} onClick={() => setShowPaidModal(false)}>✕</button>
            </div>
            <form onSubmit={handleMarkPaid}>
              <div className="modal-body">
                <p style={{ marginBottom: 20, color: 'var(--text-secondary)', fontSize: 13, lineHeight: '1.5' }}>
                  Recording payment for <strong>{selectedStudent.student_name}</strong> (Parent: {selectedStudent.parent_name}).
                  An automatic WhatsApp confirmation message will be sent immediately to <strong>+{selectedStudent.parent_phone}</strong>.
                </p>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>Amount Paid (₹)</label>
                  <input 
                    type="number" 
                    className="form-control"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>Payment Date</label>
                  <input 
                    type="date" 
                    className="form-control"
                    value={paidDate}
                    onChange={(e) => setPaidDate(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowPaidModal(false)} disabled={actionLoading}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Recording...' : 'Confirm & Send WhatsApp'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
