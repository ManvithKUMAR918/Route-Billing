import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api';
import { useToast } from '../context/ToastContext';

const ACTION_TYPES = [
  { value: 'call',    label: '📞 Phone Call',      color: '#6366f1' },
  { value: 'message', label: '💬 WhatsApp/SMS',    color: '#10b981' },
  { value: 'meeting', label: '🤝 In-Person Meet',  color: '#06b6d4' },
  { value: 'email',   label: '📧 Email',           color: '#f59e0b' },
  { value: 'admin',   label: '🏢 Admin Update',    color: '#8b5cf6' },
];

const STEPS = [
  { step: 1, label: 'Enquiry Received',     icon: '📋', desc: 'Parent submits via portal/walk-in' },
  { step: 2, label: 'Counsellor Assigned',  icon: '🧑‍💼', desc: 'Admin assigns owner/priority' },
  { step: 3, label: 'Follow-up Made',       icon: '📞', desc: 'Counsellor calls/messages parent' },
  { step: 4, label: 'Transport Confirmed',  icon: '🚌', desc: 'Route and fee details confirmed' },
  { step: 5, label: 'Admission & Payment',  icon: '💳', desc: 'Fee collected, record created' },
];

const emptyForm = {
  student_name: '', counsellor: 'Ms. Priya',
  action_taken: '', action_type: 'call',
  next_action: '', next_action_date: '', priority: 'medium',
};

function validate(form) {
  const errors = {};
  if (!form.student_name.trim()) errors.student_name = 'Student name is required';
  if (!form.action_taken.trim()) errors.action_taken = 'Please describe what action was taken';
  return errors;
}

export default function FollowUp() {
  const [followups, setFollowups]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [showModal, setShowModal]       = useState(false);
  const [selected, setSelected]         = useState(null);
  const [form, setForm]                 = useState(emptyForm);
  const [errors, setErrors]             = useState({});
  const [submitting, setSubmitting]     = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [refreshing, setRefreshing]     = useState(false);
  const { showToast } = useToast();

  const load = (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    api.getFollowUps()
      .then(res => setFollowups(res.data))
      .catch(() => showToast('Failed to load follow-ups', 'error'))
      .finally(() => { setLoading(false); setRefreshing(false); });
  };

  useEffect(() => { load(); }, []);

  const filtered = followups.filter(f => filterStatus ? f.status === filterStatus : true);
  const actionInfo = (type) => ACTION_TYPES.find(a => a.value === type) || ACTION_TYPES[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return; }
    setErrors({});
    setSubmitting(true);
    try {
      await api.addFollowUp(form);
      showToast('✅ Follow-up logged successfully!');
      setShowModal(false);
      setForm(emptyForm);
      load(true);
    } catch (err) {
      showToast(err.message || 'Failed to log follow-up', 'error');
    } finally { setSubmitting(false); }
  };

  const handleComplete = async (id) => {
    try {
      await api.updateFollowUp(id, { status: 'completed' });
      showToast('Follow-up marked as completed ✅');
      if (selected?.id === id) setSelected(prev => ({ ...prev, status: 'completed' }));
      load(true);
    } catch { showToast('Update failed', 'error'); }
  };

  return (
    <div className="page-container">
      {/* Topbar */}
      <div className="topbar" style={{ marginLeft: '-32px', marginRight: '-32px', marginTop: '-32px', marginBottom: '32px', paddingLeft: '32px', paddingRight: '32px' }}>
        <div className="topbar-title">
          <h1>🧑‍💼 Counsellor Follow-up</h1>
          <p>Step 2 — Log every parent interaction across the admission & transport workflow</p>
        </div>
        <div className="topbar-actions">
          <button className="btn btn-outline" onClick={() => load(true)} disabled={refreshing}>
            {refreshing ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Refreshing</> : '🔄 Refresh'}
          </button>
          <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setErrors({}); setShowModal(true); }}>＋ Log Follow-up</button>
        </div>
      </div>

      {/* Workflow Journey Map */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 24px', marginBottom: 28 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary-light)', marginBottom: 16 }}>🗺️ Admission & Transport Workflow Journey</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto' }}>
          {STEPS.map((s, i) => (
            <div key={s.step} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ textAlign: 'center', minWidth: 130 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: `linear-gradient(135deg, var(--primary), var(--accent))`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, margin: '0 auto 8px', boxShadow: '0 0 20px rgba(99,102,241,0.3)' }}>
                  {s.icon}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>Step {s.step}</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>{s.label}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{s.desc}</div>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, height: 2, background: 'linear-gradient(90deg, var(--primary), var(--accent))', minWidth: 30, margin: '0 4px', borderRadius: 99 }} />
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Follow-ups', value: followups.length,                                         color: 'var(--primary-light)' },
          { label: '⏳ Pending',        value: followups.filter(f => f.status === 'pending').length,      color: 'var(--warning)' },
          { label: '✅ Completed',      value: followups.filter(f => f.status === 'completed').length,    color: 'var(--success)' },
          { label: '🔴 High Priority',  value: followups.filter(f => f.priority === 'high' && f.status === 'pending').length, color: 'var(--danger)' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['', 'pending', 'completed'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`btn ${filterStatus === s ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: 13 }}>
            {s === '' ? 'All' : s === 'pending' ? '⏳ Pending' : '✅ Completed'}
            <span style={{ marginLeft: 4, fontSize: 11, opacity: 0.7 }}>({followups.filter(f => s === '' || f.status === s).length})</span>
          </button>
        ))}
      </div>

      {/* List + Detail Drawer */}
      <div style={{ display: 'flex', gap: 20 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : filtered.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-icon">🧑‍💼</div>
                <h3>No follow-ups logged</h3>
                <p>Click "+ Log Follow-up" to record the first counsellor interaction</p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.map((fu, i) => {
                const aInfo = actionInfo(fu.action_type);
                const isUrgent = fu.status === 'pending' && fu.priority === 'high';
                return (
                  <motion.div key={fu.id} className="card"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                    onClick={() => setSelected(fu)}
                    style={{ cursor: 'pointer', borderLeft: `3px solid ${isUrgent ? 'var(--danger)' : fu.status === 'completed' ? 'var(--success)' : 'var(--warning)'}`, background: selected?.id === fu.id ? 'rgba(99,102,241,0.07)' : 'var(--bg-card)' }}
                    whileHover={{ x: 3 }}>
                    <div className="card-body" style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{fu.student_name}</span>
                            <span className={`badge ${fu.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>{fu.status}</span>
                            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, fontWeight: 600, background: `${aInfo.color}20`, color: aInfo.color, border: `1px solid ${aInfo.color}40` }}>{aInfo.label}</span>
                            {isUrgent && <span className="badge badge-danger">🚨 URGENT</span>}
                          </div>
                          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>{fu.action_taken}</div>
                          {fu.next_action && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>⏭ Next: {fu.next_action} {fu.next_action_date ? `by ${fu.next_action_date}` : ''}</div>}
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>👤 {fu.counsellor}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(fu.created_at).toLocaleDateString('en-IN')}</div>
                        </div>
                      </div>
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
              style={{ width: 360, flexShrink: 0 }}>
              <div className="card" style={{ position: 'sticky', top: 100 }}>
                <div className="card-header">
                  <h3 className="card-title">🧑‍💼 Follow-up Detail</h3>
                  <button className="btn btn-outline btn-sm btn-icon" onClick={() => setSelected(null)}>✕</button>
                </div>
                <div className="card-body" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                    <span className={`badge ${selected.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>{selected.status}</span>
                    <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 99, fontWeight: 600, background: `${actionInfo(selected.action_type).color}20`, color: actionInfo(selected.action_type).color }}>{actionInfo(selected.action_type).label}</span>
                  </div>
                  {[
                    { label: 'Student',      value: selected.student_name },
                    { label: 'Counsellor',   value: selected.counsellor },
                    { label: 'Action Taken', value: selected.action_taken },
                    { label: 'Next Action',  value: selected.next_action || '—' },
                    { label: 'Due Date',     value: selected.next_action_date || '—' },
                    { label: 'Priority',     value: selected.priority?.toUpperCase() },
                    { label: 'Logged On',    value: new Date(selected.created_at).toLocaleString('en-IN') },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'right', maxWidth: 180 }}>{value}</span>
                    </div>
                  ))}
                  {selected.status === 'pending' && (
                    <button className="btn btn-primary btn-sm" style={{ width: '100%', marginTop: 16, background: 'linear-gradient(135deg, var(--success), #059669)' }}
                      onClick={() => handleComplete(selected.id)}>
                      ✓ Mark as Completed
                    </button>
                  )}
                  {selected.status === 'completed' && (
                    <div style={{ marginTop: 14, padding: '10px', background: 'rgba(16,185,129,0.1)', borderRadius: 8, textAlign: 'center', fontSize: 13, color: 'var(--success)', fontWeight: 600 }}>
                      ✅ Follow-up completed
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Log Follow-up Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={e => e.target === e.currentTarget && setShowModal(false)}>
            <motion.div className="modal" style={{ maxWidth: 640 }} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
              <div className="modal-header">
                <h2>📞 Log Counsellor Follow-up</h2>
                <button className="btn btn-outline btn-sm btn-icon" onClick={() => setShowModal(false)}>✕</button>
              </div>
              <form onSubmit={handleSubmit} noValidate>
                <div className="modal-body">
                  {/* Action type selector */}
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: 8 }}>Action Type *</label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {ACTION_TYPES.map(a => (
                        <button key={a.value} type="button" onClick={() => setForm({ ...form, action_type: a.value })}
                          style={{ padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: `1px solid ${form.action_type === a.value ? a.color : 'var(--border)'}`, background: form.action_type === a.value ? `${a.color}20` : 'transparent', color: form.action_type === a.value ? a.color : 'var(--text-muted)', transition: 'all 0.2s' }}>
                          {a.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label>Student Name *</label>
                      <input placeholder="Student this relates to" value={form.student_name}
                        style={{ borderColor: errors.student_name ? 'var(--danger)' : '' }}
                        onChange={e => { setForm({ ...form, student_name: e.target.value }); setErrors(p => ({ ...p, student_name: '' })); }} />
                      {errors.student_name && <span style={{ fontSize: 11, color: 'var(--danger)', marginTop: 4 }}>⚠ {errors.student_name}</span>}
                    </div>
                    <div className="form-group">
                      <label>Counsellor</label>
                      <select value={form.counsellor} onChange={e => setForm({ ...form, counsellor: e.target.value })}>
                        <option>Ms. Priya</option><option>Mr. Rahul</option><option>Admin</option><option>Centre Head</option>
                      </select>
                    </div>
                    <div className="form-group full">
                      <label>Action Taken *</label>
                      <textarea rows={3} placeholder="Describe what was done — e.g. Called parent, confirmed pickup point at MG Road..." value={form.action_taken}
                        style={{ borderColor: errors.action_taken ? 'var(--danger)' : '', resize: 'vertical' }}
                        onChange={e => { setForm({ ...form, action_taken: e.target.value }); setErrors(p => ({ ...p, action_taken: '' })); }} />
                      {errors.action_taken && <span style={{ fontSize: 11, color: 'var(--danger)', marginTop: 4 }}>⚠ {errors.action_taken}</span>}
                    </div>
                    <div className="form-group full">
                      <label>Next Planned Action</label>
                      <input placeholder="e.g. Send confirmation message, await payment" value={form.next_action} onChange={e => setForm({ ...form, next_action: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Next Action Due Date</label>
                      <input type="date" value={form.next_action_date} onChange={e => setForm({ ...form, next_action_date: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Priority</label>
                      <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                        <option value="high">🔴 High</option>
                        <option value="medium">🟡 Medium</option>
                        <option value="low">🟢 Low</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Saving...</> : '✓ Log Follow-up'}
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
