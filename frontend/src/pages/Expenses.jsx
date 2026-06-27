import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../context/ToastContext';
import { api } from '../api';

const CATEGORIES = [
  { value: 'Fuel',           icon: '⛽', color: '#6366f1' },
  { value: 'Driver Salary',  icon: '👨‍✈️', color: '#10b981' },
  { value: 'Maintenance',    icon: '🔧', color: '#f59e0b' },
  { value: 'Insurance',      icon: '🛡️', color: '#06b6d4' },
  { value: 'Tolls & Parking',icon: '🛣️', color: '#ec4899' },
  { value: 'Cleaning',       icon: '🧹', color: '#8b5cf6' },
  { value: 'Other',          icon: '📦', color: '#94a3b8' },
];

const emptyForm = {
  category: 'Fuel', description: '', amount: '',
  date: new Date().toISOString().split('T')[0],
  route: '', vendor: '', approved_by: 'Admin', notes: '',
};

export default function Expenses() {
  const [expenses, setExpenses]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [showModal, setShowModal]       = useState(false);
  const [form, setForm]                 = useState(emptyForm);
  const [submitting, setSubmitting]     = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const { showToast } = useToast();

  const load = () => {
    setLoading(true);
    api.getExpenses()
      .then(res => setExpenses(res.data))
      .catch(() => showToast('Failed to load expenses', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = expenses.filter(e => filterCategory ? e.category === filterCategory : true);
  const totalExpenses = expenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.addExpense({ ...form, amount: parseFloat(form.amount) });
      showToast('✅ Expense recorded successfully');
      setShowModal(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      showToast('Failed to save expense', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this expense?')) return;
    try {
      await api.deleteExpense(id);
      showToast('Expense deleted');
      load();
    } catch {
      showToast('Failed to delete expense', 'error');
    }
  };

  const catInfo = (cat) => CATEGORIES.find(c => c.value === cat) || CATEGORIES[CATEGORIES.length - 1];

  const catTotals = CATEGORIES.slice(0, -1).map(c => ({
    ...c, total: expenses.filter(e => e.category === c.value).reduce((s, e) => s + parseFloat(e.amount || 0), 0)
  })).filter(c => c.total > 0);

  return (
    <div className="page-container">
      <div className="topbar" style={{ marginLeft: '-32px', marginRight: '-32px', marginTop: '-32px', marginBottom: '32px', paddingLeft: '32px', paddingRight: '32px' }}>
        <div className="topbar-title">
          <h1>💸 Expense Entry</h1>
          <p>Step 3 — Record and track all transport-related expenses by route and category</p>
        </div>
        <div className="topbar-actions">
          <div style={{ textAlign: 'right', marginRight: 12 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--danger)' }}>₹{totalExpenses.toLocaleString()}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total Expenses</div>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>＋ Add Expense</button>
        </div>
      </div>

      {/* Category breakdown */}
      {catTotals.length > 0 && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          {catTotals.map((c, i) => (
            <motion.button key={c.value}
              onClick={() => setFilterCategory(filterCategory === c.value ? '' : c.value)}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              style={{ flex: '1 1 140px', background: filterCategory === c.value ? `${c.color}22` : 'var(--bg-card)', border: `1px solid ${filterCategory === c.value ? c.color : 'var(--border)'}`, borderRadius: 12, padding: '16px 18px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
              <div style={{ fontSize: 20, marginBottom: 6 }}>{c.icon}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: c.color }}>₹{c.total.toLocaleString()}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{c.value}</div>
            </motion.button>
          ))}
        </div>
      )}

      {/* Table */}
      <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="card-header">
          <h3 className="card-title">📋 Expense Records</h3>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--danger)' }}>
            Showing: ₹{filtered.reduce((s, e) => s + parseFloat(e.amount || 0), 0).toLocaleString()}
          </span>
        </div>
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">💸</div><h3>No expenses recorded</h3><p>Click "Add Expense" to log your first entry</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>#</th><th>Category</th><th>Description</th><th>Amount</th><th>Route</th><th>Date</th><th>Approved By</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map((exp, i) => {
                  const cat = catInfo(exp.category);
                  return (
                    <motion.tr key={exp.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.06 }}>
                      <td style={{ color: 'var(--text-muted)' }}>{exp.id}</td>
                      <td>
                        <span style={{ padding: '4px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600, background: `${cat.color}20`, color: cat.color, border: `1px solid ${cat.color}40` }}>
                          {cat.icon} {exp.category}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{exp.description}</td>
                      <td style={{ color: 'var(--danger)', fontWeight: 800, fontSize: 15 }}>₹{parseFloat(exp.amount).toLocaleString()}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{exp.route || '—'}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{exp.date}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{exp.approved_by}</td>
                      <td>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(exp.id)}>🗑</button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Add Expense Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={e => e.target === e.currentTarget && setShowModal(false)}>
            <motion.div className="modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
              <div className="modal-header">
                <h2>💸 Add Expense</h2>
                <button className="btn btn-outline btn-sm btn-icon" onClick={() => setShowModal(false)}>✕</button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  {/* Category selector */}
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: 8 }}>Category *</label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {CATEGORIES.map(c => (
                        <button key={c.value} type="button" onClick={() => setForm({ ...form, category: c.value })}
                          style={{ padding: '7px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: `1px solid ${form.category === c.value ? c.color : 'var(--border)'}`, background: form.category === c.value ? `${c.color}20` : 'transparent', color: form.category === c.value ? c.color : 'var(--text-muted)', transition: 'all 0.2s' }}>
                          {c.icon} {c.value}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="form-grid">
                    <div className="form-group full">
                      <label>Description *</label>
                      <input required placeholder="e.g. Route A diesel refill - 50L" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Amount (₹) *</label>
                      <input required type="number" placeholder="e.g. 2500" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Date *</label>
                      <input required type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Route (if applicable)</label>
                      <select value={form.route} onChange={e => setForm({ ...form, route: e.target.value })}>
                        <option value="">All Routes</option>
                        <option>Route A - North</option>
                        <option>Route B - South</option>
                        <option>Route C - East</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Vendor / Payee</label>
                      <input placeholder="e.g. HP Petrol Pump" value={form.vendor} onChange={e => setForm({ ...form, vendor: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Approved By</label>
                      <select value={form.approved_by} onChange={e => setForm({ ...form, approved_by: e.target.value })}>
                        <option>Admin</option><option>Centre Head</option><option>Finance Manager</option>
                      </select>
                    </div>
                    <div className="form-group full">
                      <label>Notes</label>
                      <input placeholder="Any additional notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }} disabled={submitting}>
                    {submitting ? 'Saving...' : '💸 Save Expense'}
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
