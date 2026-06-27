import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api';
import { useToast } from '../context/ToastContext';

const MODE_COLOR = { cash: '#10b981', online: '#6366f1', upi: '#06b6d4', cheque: '#f59e0b' };

const emptyForm = {
  student_name: '', class: '', amount_paid: '',
  payment_date: new Date().toISOString().split('T')[0],
  payment_mode: 'cash', month_paid: 'June 2026', remarks: '',
};

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const { showToast } = useToast();

  const load = () => {
    setLoading(true);
    api.getPayments().then(res => setPayments(res.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = payments.filter(p =>
    p.student_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.receipt_number?.toLowerCase().includes(search.toLowerCase())
  );

  const totalAmount = filtered.reduce((sum, p) => sum + p.amount_paid, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.addPayment(form);
      showToast('Payment recorded successfully! 💳');
      setShowModal(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      showToast(err.message || 'Failed to record payment', 'error');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="page-container">
      <div className="topbar" style={{ marginLeft: '-32px', marginRight: '-32px', marginTop: '-32px', marginBottom: '32px', paddingLeft: '32px', paddingRight: '32px' }}>
        <div className="topbar-title">
          <h1>💳 Payments</h1>
          <p>Track all transport fee payments and receipts</p>
        </div>
        <div className="topbar-actions">
          <div style={{ textAlign: 'right', marginRight: 16 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--success)' }}>₹{totalAmount.toLocaleString()}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total Collected</div>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>＋ Record Payment</button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        {Object.entries(MODE_COLOR).map(([mode, color]) => {
          const modePayments = payments.filter(p => p.payment_mode === mode);
          const modeTotal = modePayments.reduce((s, p) => s + p.amount_paid, 0);
          return (
            <div key={mode} style={{ flex: '1 1 140px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{mode}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color }}>{modePayments.length} txn</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>₹{modeTotal.toLocaleString()}</div>
            </div>
          );
        })}
      </div>

      {/* Search */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-body" style={{ padding: '14px 24px' }}>
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input placeholder="Search by student name or receipt number..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Table */}
      <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💳</div>
            <h3>No payments found</h3>
            <p>Record a payment to get started</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Receipt #</th>
                  <th>Student</th>
                  <th>Amount</th>
                  <th>Month</th>
                  <th>Mode</th>
                  <th>Date</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                    <td><span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--primary-light)' }}>{p.receipt_number}</span></td>
                    <td>
                      <div className="td-name">{p.student_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.class}</div>
                    </td>
                    <td className="td-amount">₹{Number(p.amount_paid).toLocaleString()}</td>
                    <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{p.month_paid}</td>
                    <td>
                      <span className="badge" style={{ background: `${MODE_COLOR[p.payment_mode]}22`, color: MODE_COLOR[p.payment_mode], border: `1px solid ${MODE_COLOR[p.payment_mode]}44` }}>
                        {p.payment_mode?.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{p.payment_date}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.remarks || '—'}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Add Payment Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={e => e.target === e.currentTarget && setShowModal(false)}>
            <motion.div className="modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
              <div className="modal-header">
                <h2>💳 Record Payment</h2>
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
                      <label>Class</label>
                      <input placeholder="e.g. Grade 1 A" value={form.class}
                        onChange={e => setForm({ ...form, class: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Amount Paid (₹) *</label>
                      <input required type="number" placeholder="e.g. 1500" value={form.amount_paid}
                        onChange={e => setForm({ ...form, amount_paid: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Payment Date *</label>
                      <input required type="date" value={form.payment_date}
                        onChange={e => setForm({ ...form, payment_date: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Payment Mode</label>
                      <select value={form.payment_mode} onChange={e => setForm({ ...form, payment_mode: e.target.value })}>
                        <option value="cash">Cash</option>
                        <option value="online">Online</option>
                        <option value="upi">UPI</option>
                        <option value="cheque">Cheque</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Month Paid For</label>
                      <input placeholder="e.g. June 2026" value={form.month_paid}
                        onChange={e => setForm({ ...form, month_paid: e.target.value })} />
                    </div>
                    <div className="form-group full">
                      <label>Remarks</label>
                      <input placeholder="Optional notes..." value={form.remarks}
                        onChange={e => setForm({ ...form, remarks: e.target.value })} />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Saving...</> : '✓ Record Payment'}
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
