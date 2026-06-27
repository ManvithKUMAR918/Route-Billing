import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api';
import { useToast } from '../context/ToastContext';

const SOURCE_OPTIONS = [
  { value: 'parent_portal',     label: '🌐 Parent Portal',        color: '#6366f1' },
  { value: 'teacher_dashboard', label: '👩‍🏫 Teacher Dashboard',    color: '#06b6d4' },
  { value: 'centre_admin',      label: '🏢 Centre Admin Panel',    color: '#10b981' },
  { value: 'counsellor',        label: '🧑‍💼 Counsellor Follow-up', color: '#f59e0b' },
  { value: 'phone_call',        label: '📞 Phone Call',            color: '#ec4899' },
  { value: 'walk_in',           label: '🚶 Walk-in',               color: '#8b5cf6' },
];

const PRIORITY_OPTIONS = [
  { value: 'high',   label: 'High',   color: 'var(--danger)' },
  { value: 'medium', label: 'Medium', color: 'var(--warning)' },
  { value: 'low',    label: 'Low',    color: 'var(--success)' },
];

const STATUS_BADGE = {
  pending:     'badge-warning',
  in_progress: 'badge-info',
  resolved:    'badge-success',
};

const emptyForm = {
  student_name: '', parent_name: '', phone: '', email: '',
  class: '', address: '', route_requested: '',
  source: 'parent_portal', owner: 'Admin',
  notes: '', priority: 'medium',
};

function validate(form) {
  const errors = {};
  if (!form.student_name.trim()) errors.student_name = 'Student name is required';
  if (!form.phone.trim()) errors.phone = 'Phone number is required';
  else if (!/^\d{10}$/.test(form.phone.trim())) errors.phone = 'Enter a valid 10-digit phone number';
  if (form.email && !/\S+@\S+\.\S+/.test(form.email)) errors.email = 'Enter a valid email address';
  return errors;
}

export default function Enquiry() {
  const [enquiries, setEnquiries]         = useState([]);
  const [loading, setLoading]             = useState(true);
  const [showModal, setShowModal]         = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [form, setForm]                   = useState(emptyForm);
  const [errors, setErrors]               = useState({});
  const [submitting, setSubmitting]       = useState(false);
  const [filterStatus, setFilterStatus]   = useState('');
  const [refreshing, setRefreshing]       = useState(false);
  const { showToast } = useToast();

  const load = (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    api.getEnquiries()
      .then(res => setEnquiries(res.data))
      .catch(() => showToast('Failed to load enquiries', 'error'))
      .finally(() => { setLoading(false); setRefreshing(false); });
  };

  useEffect(() => { load(); }, []);

  const filtered = enquiries.filter(e => filterStatus ? e.status === filterStatus : true);
  const sourceInfo = (src) => SOURCE_OPTIONS.find(s => s.value === src) || SOURCE_OPTIONS[0];
  const priorityInfo = (p) => PRIORITY_OPTIONS.find(o => o.value === p) || PRIORITY_OPTIONS[1];

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      await api.addEnquiry(form);
      showToast('✅ Enquiry submitted! Logged with source, owner & timestamp.');
      setShowModal(false);
      setForm(emptyForm);
      load(true);
    } catch (err) {
      showToast(err.message || 'Failed to submit', 'error');
    } finally { setSubmitting(false); }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.updateEnquiry(id, { status });
      showToast(`Status updated to "${status.replace('_', ' ')}"`);
      if (selectedEnquiry?.id === id) setSelectedEnquiry(prev => ({ ...prev, status }));
      load(true);
    } catch { showToast('Update failed', 'error'); }
  };

  return (
    <div className="page-container">
      {/* Topbar */}
      <div className="topbar" style={{ marginLeft: '-32px', marginRight: '-32px', marginTop: '-32px', marginBottom: '32px', paddingLeft: '32px', paddingRight: '32px' }}>
        <div className="topbar-title">
          <h1>📋 Parent Enquiry Form</h1>
          <p>Step 1 — Data entry from parent portal, teacher dashboard, admin panel, or counsellor</p>
        </div>
        <div className="topbar-actions">
          <button className="btn btn-outline" onClick={() => load(true)} disabled={refreshing}>
            {refreshing ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Refreshing</> : '🔄 Refresh'}
          </button>
          <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setErrors({}); setShowModal(true); }}>＋ New Enquiry</button>
        </div>
      </div>

      {/* Source Banner */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(6,182,212,0.08))', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 14, padding: '16px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>STEP 1 — ENTRY SOURCES</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Enquiries can be submitted from any of these channels:</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {SOURCE_OPTIONS.map(src => (
            <span key={src.value} style={{ padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: `${src.color}20`, color: src.color, border: `1px solid ${src.color}40` }}>{src.label}</span>
          ))}
        </div>
      </motion.div>

      {/* Stats bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Total', count: enquiries.length, color: 'var(--primary-light)' },
          { label: '⏳ Pending', count: enquiries.filter(e => e.status === 'pending').length, color: 'var(--warning)' },
          { label: '🔄 In Progress', count: enquiries.filter(e => e.status === 'in_progress').length, color: 'var(--accent)' },
          { label: '✅ Resolved', count: enquiries.filter(e => e.status === 'resolved').length, color: 'var(--success)' },
          { label: '🔴 High Priority', count: enquiries.filter(e => e.priority === 'high' && e.status !== 'resolved').length, color: 'var(--danger)' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.count}</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[
          { val: '',            label: 'All' },
          { val: 'pending',     label: '⏳ Pending' },
          { val: 'in_progress', label: '🔄 In Progress' },
          { val: 'resolved',    label: '✅ Resolved' },
        ].map(tab => (
          <button key={tab.val} onClick={() => setFilterStatus(tab.val)}
            className={`btn ${filterStatus === tab.val ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: 13 }}>
            {tab.label} <span style={{ marginLeft: 4, fontSize: 11, opacity: 0.7 }}>({enquiries.filter(e => tab.val === '' || e.status === tab.val).length})</span>
          </button>
        ))}
      </div>

      {/* Layout: list + detail drawer */}
      <div style={{ display: 'flex', gap: 20 }}>
        {/* Left — card list */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : filtered.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <h3>No enquiries found</h3>
                <p>{filterStatus ? `No "${filterStatus.replace('_', ' ')}" enquiries` : 'Click "+ New Enquiry" to add the first one'}</p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.map((enq, i) => {
                const src = sourceInfo(enq.source);
                const pInfo = priorityInfo(enq.priority);
                const isOverdue = enq.status !== 'resolved' && enq.priority === 'high';
                return (
                  <motion.div key={enq.id} className="card"
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                    onClick={() => setSelectedEnquiry(enq)}
                    style={{ cursor: 'pointer', borderLeft: `3px solid ${pInfo.color}`, background: selectedEnquiry?.id === enq.id ? 'rgba(99,102,241,0.07)' : 'var(--bg-card)', transition: 'all 0.2s' }}
                    whileHover={{ x: 4 }}>
                    <div className="card-body" style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{enq.student_name}</span>
                            <span className={`badge ${STATUS_BADGE[enq.status] || 'badge-muted'}`}>{enq.status?.replace('_', ' ')}</span>
                            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, fontWeight: 700, background: `${pInfo.color}22`, color: pInfo.color, border: `1px solid ${pInfo.color}44` }}>
                              {enq.priority?.toUpperCase()}
                            </span>
                            {isOverdue && <span className="badge badge-danger">🚨 ACTION NEEDED</span>}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            👤 {enq.parent_name || '—'} &nbsp;|&nbsp; 📞 {enq.phone} &nbsp;|&nbsp; 🏫 {enq.class || '—'} &nbsp;|&nbsp; 🚌 {enq.route_requested || 'Not specified'}
                          </div>
                        </div>
                        <div style={{ flexShrink: 0, textAlign: 'right' }}>
                          <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 99, fontWeight: 600, background: `${src.color}20`, color: src.color, border: `1px solid ${src.color}40` }}>{src.label}</span>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>👤 {enq.owner}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(enq.created_at).toLocaleDateString('en-IN')}</div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right — Detail Panel */}
        <AnimatePresence>
          {selectedEnquiry && (
            <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }}
              style={{ width: 380, flexShrink: 0 }}>
              <div className="card" style={{ position: 'sticky', top: 100 }}>
                <div className="card-header">
                  <h3 className="card-title">📋 Enquiry Detail</h3>
                  <button className="btn btn-outline btn-sm btn-icon" onClick={() => setSelectedEnquiry(null)}>✕</button>
                </div>
                <div className="card-body" style={{ padding: 20 }}>
                  {/* Priority & Status */}
                  <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                    <span className={`badge ${STATUS_BADGE[selectedEnquiry.status] || 'badge-muted'}`}>{selectedEnquiry.status?.replace('_', ' ')}</span>
                    <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 99, fontWeight: 700, background: `${priorityInfo(selectedEnquiry.priority).color}22`, color: priorityInfo(selectedEnquiry.priority).color, border: `1px solid ${priorityInfo(selectedEnquiry.priority).color}44` }}>
                      {selectedEnquiry.priority?.toUpperCase()} PRIORITY
                    </span>
                    <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 99, fontWeight: 600, background: `${sourceInfo(selectedEnquiry.source).color}20`, color: sourceInfo(selectedEnquiry.source).color }}>
                      {sourceInfo(selectedEnquiry.source).label}
                    </span>
                  </div>

                  {/* Fields */}
                  {[
                    { label: 'Student Name',    value: selectedEnquiry.student_name },
                    { label: 'Parent Name',     value: selectedEnquiry.parent_name || '—' },
                    { label: 'Phone',           value: selectedEnquiry.phone },
                    { label: 'Email',           value: selectedEnquiry.email || '—' },
                    { label: 'Class',           value: selectedEnquiry.class || '—' },
                    { label: 'Route Requested', value: selectedEnquiry.route_requested || '—' },
                    { label: 'Owner',           value: selectedEnquiry.owner },
                    { label: 'Address',         value: selectedEnquiry.address || '—' },
                    { label: 'Submitted',       value: new Date(selectedEnquiry.created_at).toLocaleString('en-IN') },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'right', maxWidth: 200, wordBreak: 'break-word' }}>{value}</span>
                    </div>
                  ))}

                  {selectedEnquiry.notes && (
                    <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: 8 }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>NOTES</div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{selectedEnquiry.notes}</div>
                    </div>
                  )}

                  {/* Actions */}
                  {selectedEnquiry.status !== 'resolved' && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                      {selectedEnquiry.status === 'pending' && (
                        <button className="btn btn-outline btn-sm" style={{ flex: 1 }}
                          onClick={() => handleStatusUpdate(selectedEnquiry.id, 'in_progress')}>
                          🔄 Start Progress
                        </button>
                      )}
                      <button className="btn btn-primary btn-sm" style={{ flex: 1, background: 'linear-gradient(135deg, var(--success), #059669)' }}
                        onClick={() => handleStatusUpdate(selectedEnquiry.id, 'resolved')}>
                        ✓ Mark Resolved
                      </button>
                    </div>
                  )}
                  {selectedEnquiry.status === 'resolved' && (
                    <div style={{ marginTop: 16, padding: '10px', background: 'rgba(16,185,129,0.1)', borderRadius: 8, textAlign: 'center', fontSize: 13, color: 'var(--success)', fontWeight: 600 }}>
                      ✅ This enquiry has been resolved
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* New Enquiry Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={e => e.target === e.currentTarget && setShowModal(false)}>
            <motion.div className="modal" style={{ maxWidth: 700 }} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
              <div className="modal-header">
                <h2>📋 New Enquiry — Step 1 Data Entry</h2>
                <button className="btn btn-outline btn-sm btn-icon" onClick={() => setShowModal(false)}>✕</button>
              </div>
              <form onSubmit={handleSubmit} noValidate>
                <div className="modal-body">
                  {/* Source selector */}
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: 8 }}>Entry Source *</label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {SOURCE_OPTIONS.map(src => (
                        <button key={src.value} type="button" onClick={() => setForm({ ...form, source: src.value })}
                          style={{ padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: `1px solid ${form.source === src.value ? src.color : 'var(--border)'}`, background: form.source === src.value ? `${src.color}20` : 'transparent', color: form.source === src.value ? src.color : 'var(--text-muted)', transition: 'all 0.2s' }}>
                          {src.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label>Student Name *</label>
                      <input placeholder="Full name" value={form.student_name}
                        style={{ borderColor: errors.student_name ? 'var(--danger)' : '' }}
                        onChange={e => { setForm({ ...form, student_name: e.target.value }); setErrors(prev => ({ ...prev, student_name: '' })); }} />
                      {errors.student_name && <span style={{ fontSize: 11, color: 'var(--danger)', marginTop: 4 }}>⚠ {errors.student_name}</span>}
                    </div>
                    <div className="form-group">
                      <label>Parent / Guardian Name</label>
                      <input placeholder="Parent name" value={form.parent_name} onChange={e => setForm({ ...form, parent_name: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Phone Number *</label>
                      <input placeholder="10-digit mobile" value={form.phone} maxLength={10}
                        style={{ borderColor: errors.phone ? 'var(--danger)' : '' }}
                        onChange={e => { setForm({ ...form, phone: e.target.value }); setErrors(prev => ({ ...prev, phone: '' })); }} />
                      {errors.phone && <span style={{ fontSize: 11, color: 'var(--danger)', marginTop: 4 }}>⚠ {errors.phone}</span>}
                    </div>
                    <div className="form-group">
                      <label>Email</label>
                      <input type="email" placeholder="parent@email.com" value={form.email}
                        style={{ borderColor: errors.email ? 'var(--danger)' : '' }}
                        onChange={e => { setForm({ ...form, email: e.target.value }); setErrors(prev => ({ ...prev, email: '' })); }} />
                      {errors.email && <span style={{ fontSize: 11, color: 'var(--danger)', marginTop: 4 }}>⚠ {errors.email}</span>}
                    </div>
                    <div className="form-group">
                      <label>Class / Grade</label>
                      <input placeholder="e.g. Grade 2 A" value={form.class} onChange={e => setForm({ ...form, class: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Route Requested</label>
                      <input placeholder="e.g. Route A - North" value={form.route_requested} onChange={e => setForm({ ...form, route_requested: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Priority</label>
                      <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                        <option value="high">🔴 High</option>
                        <option value="medium">🟡 Medium</option>
                        <option value="low">🟢 Low</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Assigned To (Owner)</label>
                      <select value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })}>
                        <option>Admin</option><option>Ms. Priya</option><option>Mr. Rahul</option><option>Centre Head</option>
                      </select>
                    </div>
                    <div className="form-group full">
                      <label>Address</label>
                      <input placeholder="Residential address for pickup point" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                    </div>
                    <div className="form-group full">
                      <label>Notes / Special Requirements</label>
                      <input placeholder="Any special requirements, timing preferences, etc." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                    </div>
                  </div>

                  {/* Auto-save info */}
                  <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8 }}>
                    <div style={{ fontSize: 12, color: 'var(--success)', fontWeight: 600 }}>⚙️ Backend will automatically save with:</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                      Source: <strong style={{ color: 'var(--text-secondary)' }}>{sourceInfo(form.source).label}</strong> &nbsp;|&nbsp;
                      Status: <strong style={{ color: 'var(--warning)' }}>Pending</strong> &nbsp;|&nbsp;
                      Owner: <strong style={{ color: 'var(--text-secondary)' }}>{form.owner}</strong> &nbsp;|&nbsp;
                      Timestamp: <strong style={{ color: 'var(--text-secondary)' }}>{new Date().toLocaleString('en-IN')}</strong>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Submitting...</> : '✓ Submit Enquiry'}
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
