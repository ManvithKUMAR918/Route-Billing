import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api';
import { useToast } from '../context/ToastContext';

const REASON_OPTIONS = [
  'Relocated to another city',
  'Admitted to another school',
  'Financial reasons',
  'Transport route not suitable',
  'Child health issues',
  'End of academic year',
  'Other',
];

const emptyForm = {
  student_name: '', class: '', admission_no: '', parent_name: '',
  phone: '', exit_reason: 'Relocated to another city',
  exit_date: new Date().toISOString().split('T')[0],
  transport_end_date: new Date().toISOString().split('T')[0],
  outstanding_dues: '', refund_amount: '',
  recorded_by: 'Admin', notes: '',
};

export default function ExitRecord() {
  const [exits, setExits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const [selectedExit, setSelectedExit] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const load = () => {
    setLoading(true);
    api.getExits().then(res => setExits(res.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.addExit(form);
      showToast('✅ Exit record saved. Transport assignment will be deactivated.');
      setShowModal(false);
      setForm(emptyForm);
      load();
    } catch (err) { showToast(err.message || 'Failed to save', 'error'); }
    finally { setSubmitting(false); }
  };

  const handleViewCert = (exit) => {
    setSelectedExit(exit);
    setShowCertModal(true);
  };

  return (
    <div className="page-container">
      {/* Topbar */}
      <div className="topbar" style={{ marginLeft: '-32px', marginRight: '-32px', marginTop: '-32px', marginBottom: '32px', paddingLeft: '32px', paddingRight: '32px' }}>
        <div className="topbar-title">
          <h1>🚪 Exit / Transfer Records</h1>
          <p>Step 3 — Student transport exit records, refund tracking & transfer certificates</p>
        </div>
        <div className="topbar-actions">
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>＋ Record Exit</button>
        </div>
      </div>

      {/* Summary */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total Exits', value: exits.length, color: '#6366f1', icon: '🚪' },
          { label: 'Refunds Processed', value: exits.filter(e => e.refund_status === 'processed').length, color: '#10b981', icon: '💰' },
          { label: 'Refunds Pending', value: exits.filter(e => e.refund_status === 'pending').length, color: '#f59e0b', icon: '⏳' },
          { label: 'Outstanding Dues', value: `₹${exits.reduce((s, e) => s + (e.outstanding_dues || 0), 0).toLocaleString()}`, color: '#ef4444', icon: '⚠️' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px' }}>
            <div style={{ fontSize: 20 }}>{s.icon}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: s.color, marginTop: 4 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Table */}
      <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="card-header">
          <h3 className="card-title">📋 Exit Records</h3>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{exits.length} student{exits.length !== 1 ? 's' : ''} exited</span>
        </div>
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : exits.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">✅</div>
            <h3>No exit records</h3>
            <p>All students are currently active on transport</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Exit Reason</th>
                  <th>Exit Date</th>
                  <th>Outstanding Dues</th>
                  <th>Refund</th>
                  <th>Refund Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {exits.map((ex, i) => (
                  <motion.tr key={ex.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.07 }}>
                    <td>
                      <div className="td-name">{ex.student_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{ex.class} · {ex.admission_no}</div>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{ex.exit_reason}</td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{ex.exit_date}</td>
                    <td style={{ color: ex.outstanding_dues > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 700 }}>
                      ₹{(ex.outstanding_dues || 0).toLocaleString()}
                    </td>
                    <td style={{ color: 'var(--warning)', fontWeight: 700 }}>
                      ₹{(ex.refund_amount || 0).toLocaleString()}
                    </td>
                    <td>
                      <span className={`badge ${ex.refund_status === 'processed' ? 'badge-success' : 'badge-warning'}`}>
                        {ex.refund_status}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-outline btn-sm" onClick={() => handleViewCert(ex)}>
                        📄 Transfer Cert
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Record Exit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={e => e.target === e.currentTarget && setShowModal(false)}>
            <motion.div className="modal" style={{ maxWidth: 700 }} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
              <div className="modal-header">
                <h2>🚪 Record Student Exit</h2>
                <button className="btn btn-outline btn-sm btn-icon" onClick={() => setShowModal(false)}>✕</button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  {/* Warning Banner */}
                  <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '12px 16px', marginBottom: 20 }}>
                    <div style={{ fontSize: 13, color: 'var(--danger)', fontWeight: 600 }}>⚠️ Warning: This will deactivate the student's transport assignment</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Please confirm all dues are settled or recorded before saving.</div>
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Student Name *</label>
                      <input required placeholder="Full name" value={form.student_name} onChange={e => setForm({ ...form, student_name: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Admission Number</label>
                      <input placeholder="e.g. ADM001" value={form.admission_no} onChange={e => setForm({ ...form, admission_no: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Class</label>
                      <input placeholder="e.g. Grade 1 A" value={form.class} onChange={e => setForm({ ...form, class: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Parent Name</label>
                      <input placeholder="Parent/guardian name" value={form.parent_name} onChange={e => setForm({ ...form, parent_name: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Parent Phone</label>
                      <input placeholder="Mobile number" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Exit Reason *</label>
                      <select required value={form.exit_reason} onChange={e => setForm({ ...form, exit_reason: e.target.value })}>
                        {REASON_OPTIONS.map(r => <option key={r}>{r}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Exit Date *</label>
                      <input required type="date" value={form.exit_date} onChange={e => setForm({ ...form, exit_date: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Transport End Date</label>
                      <input type="date" value={form.transport_end_date} onChange={e => setForm({ ...form, transport_end_date: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Outstanding Dues (₹)</label>
                      <input type="number" placeholder="0" value={form.outstanding_dues} onChange={e => setForm({ ...form, outstanding_dues: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Refund Amount (₹)</label>
                      <input type="number" placeholder="0" value={form.refund_amount} onChange={e => setForm({ ...form, refund_amount: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Recorded By</label>
                      <select value={form.recorded_by} onChange={e => setForm({ ...form, recorded_by: e.target.value })}>
                        <option>Admin</option><option>Centre Head</option><option>Ms. Priya</option>
                      </select>
                    </div>
                    <div className="form-group full">
                      <label>Notes</label>
                      <input placeholder="Any additional notes or context" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }} disabled={submitting}>
                    {submitting ? 'Saving...' : '🚪 Confirm Exit'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transfer Certificate Modal */}
      <AnimatePresence>
        {showCertModal && selectedExit && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={e => e.target === e.currentTarget && setShowCertModal(false)}>
            <motion.div className="modal" style={{ maxWidth: 600 }} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
              <div className="modal-header">
                <h2>📄 Transfer Certificate</h2>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-outline btn-sm" onClick={() => window.print()}>🖨 Print</button>
                  <button className="btn btn-outline btn-sm btn-icon" onClick={() => setShowCertModal(false)}>✕</button>
                </div>
              </div>
              <div className="modal-body">
                {/* Certificate */}
                <div style={{ border: '2px solid var(--border-light)', borderRadius: 12, padding: '32px', textAlign: 'center', background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>🚌</div>
                  <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 20, fontWeight: 800, color: 'var(--primary-light)', marginBottom: 4 }}>
                    FirstCry Intellitots
                  </h2>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 24 }}>Transport Fee & Route Billing System</p>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
                    TRANSPORT EXIT — TRANSFER CERTIFICATE
                  </div>
                  <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[
                      { label: 'Student Name', value: selectedExit.student_name },
                      { label: 'Class', value: selectedExit.class || '—' },
                      { label: 'Admission No.', value: selectedExit.admission_no || '—' },
                      { label: 'Parent Name', value: selectedExit.parent_name || '—' },
                      { label: 'Exit Reason', value: selectedExit.exit_reason },
                      { label: 'Exit Date', value: selectedExit.exit_date },
                      { label: 'Transport End Date', value: selectedExit.transport_end_date || selectedExit.exit_date },
                      { label: 'Outstanding Dues', value: `₹${(selectedExit.outstanding_dues || 0).toLocaleString()}` },
                      { label: 'Refund Amount', value: `₹${(selectedExit.refund_amount || 0).toLocaleString()}` },
                      { label: 'Refund Status', value: selectedExit.refund_status?.toUpperCase() },
                      { label: 'Recorded By', value: selectedExit.recorded_by },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ width: 160, fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, flexShrink: 0 }}>{label}</span>
                        <span style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>{value}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ width: 120, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Parent Signature</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ width: 120, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Admin Signature</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: 16, fontSize: 11, color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                    Generated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })} · FirstCry Intellitots Transport System
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
