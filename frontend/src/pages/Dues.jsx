import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api';
import { useToast } from '../context/ToastContext';

const STATUS_STYLE = {
  pending: { cls: 'badge-danger', label: 'Pending' },
  partial: { cls: 'badge-warning', label: 'Partial' },
  paid: { cls: 'badge-success', label: 'Paid' },
};

function daysOverdue(due_date) {
  if (!due_date) return 0;
  const diff = Math.floor((new Date() - new Date(due_date)) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

export default function Dues() {
  const [dues, setDues]             = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [selected, setSelected]     = useState(null);
  const [form, setForm]             = useState({ student_name: '', route_name: '', due_amount: '', due_month: 'June 2026', due_date: '', remarks: '' });
  const [formError, setFormError]   = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const { showToast } = useToast();

  const load = (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    api.getDues()
      .then(res => setDues(res.data))
      .catch(() => showToast('Failed to load dues', 'error'))
      .finally(() => { setLoading(false); setRefreshing(false); });
  };

  useEffect(() => { load(); }, []);

  const filtered = dues.filter(d => filterStatus ? d.status === filterStatus : true);
  const totalDue = filtered.reduce((s, d) => s + d.due_amount, 0);

  const handleStatusUpdate = async (due, newStatus) => {
    try {
      await api.updateDue(due.id, { status: newStatus });
      showToast(`Due marked as ${newStatus}`);
      load();
    } catch { showToast('Update failed', 'error'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.due_amount || parseFloat(form.due_amount) <= 0) {
      setFormError('Due amount must be greater than zero');
      return;
    }
    setFormError('');
    setSubmitting(true);
    try {
      await api.addDue(form);
      showToast('Due added successfully');
      setShowModal(false);
      setForm({ student_name: '', route_name: '', due_amount: '', due_month: 'June 2026', due_date: '', remarks: '' });
      load(true);
    } catch (err) { showToast(err.message, 'error'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="page-container">
      <div className="topbar" style={{ marginLeft: '-32px', marginRight: '-32px', marginTop: '-32px', marginBottom: '32px', paddingLeft: '32px', paddingRight: '32px' }}>
        <div className="topbar-title">
          <h1>⚠️ Dues Tracker</h1>
          <p>Monitor pending and partial transport fee dues — click any card to view details</p>
        </div>
        <div className="topbar-actions">
          <div style={{ textAlign: 'right', marginRight: 16 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--warning)' }}>₹{totalDue.toLocaleString()}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total Dues (filtered)</div>
          </div>
          <button className="btn btn-outline" onClick={() => load(true)} disabled={refreshing}>
            {refreshing ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Refreshing</> : '🔄 Refresh'}
          </button>
          <button className="btn btn-primary" onClick={() => { setShowModal(true); setFormError(''); }}>＋ Add Due</button>
        </div>
      </div>

      {/* Status Filter */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        {['', 'pending', 'partial', 'paid'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`btn ${filterStatus === s ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '8px 16px', fontSize: 13 }}>
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.7 }}>
              ({dues.filter(d => s === '' || d.status === s).length})
            </span>
          </button>
        ))}
      </div>

      {/* Dues Cards + Detail Drawer */}
      <div style={{ display: 'flex', gap: 20 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state card" style={{ padding: '60px 20px' }}>
              <div className="empty-icon">✅</div>
              <h3>No dues found</h3>
              <p>{filterStatus ? `No "${filterStatus}" dues` : 'All payments are up to date!'}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.map((due, i) => {
                const overdue = daysOverdue(due.due_date);
                return (
                  <motion.div key={due.id} className="card"
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                    onClick={() => setSelected(due)}
                    style={{ cursor: 'pointer', borderLeft: `3px solid ${due.status === 'pending' ? 'var(--danger)' : due.status === 'partial' ? 'var(--warning)' : 'var(--success)'}`, background: selected?.id === due.id ? 'rgba(99,102,241,0.07)' : 'var(--bg-card)' }}
                    whileHover={{ x: 3 }}>
                    <div className="card-body" style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 15 }}>{due.student_name}</span>
                            <span className={`badge ${STATUS_STYLE[due.status]?.cls}`}>{STATUS_STYLE[due.status]?.label}</span>
                            {overdue > 0 && due.status !== 'paid' && (
                              <span className="badge badge-danger">🚨 {overdue}d overdue</span>
                            )}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{due.route_name} · {due.due_month}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 22, fontWeight: 800, color: due.status === 'pending' ? 'var(--danger)' : due.status === 'partial' ? 'var(--warning)' : 'var(--success)' }}>₹{parseFloat(due.due_amount).toLocaleString()}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Due: {due.due_date || 'Not set'}</div>
                        </div>
                      </div>
                      {due.status !== 'paid' && (
                        <div style={{ display: 'flex', gap: 8, marginTop: 12 }} onClick={e => e.stopPropagation()}>
                          <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => handleStatusUpdate(due, 'partial')}>Mark Partial</button>
                          <button className="btn btn-primary btn-sm" style={{ flex: 1, background: 'linear-gradient(135deg, var(--success), #059669)' }} onClick={() => handleStatusUpdate(due, 'paid')}>✓ Mark Paid</button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        <AnimatePresence>
          {selected && (
            <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }}
              style={{ width: 340, flexShrink: 0 }}>
              <div className="card" style={{ position: 'sticky', top: 100 }}>
                <div className="card-header">
                  <h3 className="card-title">⚠️ Due Detail</h3>
                  <button className="btn btn-outline btn-sm btn-icon" onClick={() => setSelected(null)}>✕</button>
                </div>
                <div className="card-body" style={{ padding: 20 }}>
                  <div style={{ fontSize: 32, fontWeight: 800, color: selected.status === 'pending' ? 'var(--danger)' : selected.status === 'partial' ? 'var(--warning)' : 'var(--success)', textAlign: 'center', marginBottom: 12 }}>₹{parseFloat(selected.due_amount).toLocaleString()}</div>
                  <div style={{ textAlign: 'center', marginBottom: 16 }}>
                    <span className={`badge ${STATUS_STYLE[selected.status]?.cls}`}>{STATUS_STYLE[selected.status]?.label}</span>
                    {daysOverdue(selected.due_date) > 0 && selected.status !== 'paid' && <span className="badge badge-danger" style={{ marginLeft: 6 }}>🚨 {daysOverdue(selected.due_date)}d overdue</span>}
                  </div>
                  {[
                    { label: 'Student',   value: selected.student_name },
                    { label: 'Route',     value: selected.route_name || '—' },
                    { label: 'Month',     value: selected.due_month },
                    { label: 'Due Date',  value: selected.due_date || 'Not set' },
                    { label: 'Remarks',   value: selected.remarks || '—' },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{value}</span>
                    </div>
                  ))}
                  {selected.status !== 'paid' && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                      <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => { handleStatusUpdate(selected, 'partial'); setSelected(prev => ({ ...prev, status: 'partial' })); }}>Partial</button>
                      <button className="btn btn-primary btn-sm" style={{ flex: 1, background: 'linear-gradient(135deg, var(--success), #059669)' }} onClick={() => { handleStatusUpdate(selected, 'paid'); setSelected(prev => ({ ...prev, status: 'paid' })); }}>✓ Mark Paid</button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Add Due Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={e => e.target === e.currentTarget && setShowModal(false)}>
            <motion.div className="modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
              <div className="modal-header">
                <h2>⚠️ Add Due</h2>
                <button className="btn btn-outline btn-sm btn-icon" onClick={() => setShowModal(false)}>✕</button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Student Name *</label>
                      <input required placeholder="Student name" value={form.student_name}
                        onChange={e => setForm({ ...form, student_name: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Route Name</label>
                      <input placeholder="e.g. Route A - North" value={form.route_name}
                        onChange={e => setForm({ ...form, route_name: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Due Amount (₹) *</label>
                      <input required type="number" placeholder="e.g. 1500" value={form.due_amount}
                        style={{ borderColor: formError ? 'var(--danger)' : '' }}
                        onChange={e => { setForm({ ...form, due_amount: e.target.value }); setFormError(''); }} />
                      {formError && <span style={{ fontSize: 11, color: 'var(--danger)', marginTop: 4 }}>⚠ {formError}</span>}
                    </div>
                    <div className="form-group">
                      <label>Due Date</label>
                      <input type="date" value={form.due_date}
                        onChange={e => setForm({ ...form, due_date: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Month</label>
                      <input placeholder="e.g. June 2026" value={form.due_month}
                        onChange={e => setForm({ ...form, due_month: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Remarks</label>
                      <input placeholder="Optional note..." value={form.remarks}
                        onChange={e => setForm({ ...form, remarks: e.target.value })} />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Saving...' : '✓ Add Due'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
