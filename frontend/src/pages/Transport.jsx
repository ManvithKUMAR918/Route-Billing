import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api';
import { useToast } from '../context/ToastContext';

const STATUS_BADGE = {
  active: 'badge-success',
  inactive: 'badge-danger',
  exit: 'badge-muted',
};

const emptyForm = {
  student_name: '', class: '', route_name: '', pickup_point: '',
  drop_point: '', monthly_fee: '', vehicle_no: '', driver_name: '',
};

export default function Transport() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const { showToast } = useToast();

  const load = () => {
    setLoading(true);
    api.getTransport().then(res => setRecords(res.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = records.filter(r => {
    const matchSearch = r.student_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.route_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus ? r.status === filterStatus : true;
    return matchSearch && matchStatus;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.addTransport(form);
      showToast('Transport record added successfully!');
      setShowModal(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      showToast(err.message || 'Failed to add record', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this record?')) return;
    try {
      await api.deleteTransport(id);
      showToast('Record deleted');
      load();
    } catch { showToast('Delete failed', 'error'); }
  };

  const handleStatusToggle = async (record) => {
    const newStatus = record.status === 'active' ? 'inactive' : 'active';
    try {
      await api.updateTransport(record.id, { status: newStatus });
      showToast(`Status updated to ${newStatus}`);
      load();
    } catch { showToast('Update failed', 'error'); }
  };

  return (
    <div className="page-container">
      {/* Topbar */}
      <div className="topbar" style={{ marginLeft: '-32px', marginRight: '-32px', marginTop: '-32px', marginBottom: '32px', paddingLeft: '32px', paddingRight: '32px' }}>
        <div className="topbar-title">
          <h1>🚌 Transport Records</h1>
          <p>Manage all student transport assignments and routes</p>
        </div>
        <div className="topbar-actions">
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            ＋ Add Record
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-body" style={{ padding: '16px 24px' }}>
          <div className="filter-bar">
            <div className="search-bar">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search student or route..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: 160 }}>
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="exit">Exit</option>
            </select>
            <span style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 'auto' }}>
              {filtered.length} record{filtered.length !== 1 ? 's' : ''} found
            </span>
          </div>
        </div>
      </div>

      {/* Table */}
      <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🚌</div>
            <h3>No transport records found</h3>
            <p>Click "Add Record" to create the first one</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Student</th>
                  <th>Route</th>
                  <th>Pickup</th>
                  <th>Monthly Fee</th>
                  <th>Driver</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <motion.tr
                    key={r.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <td style={{ color: 'var(--text-muted)' }}>{r.id}</td>
                    <td>
                      <div className="td-name">{r.student_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.class}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{r.route_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.vehicle_no}</div>
                    </td>
                    <td style={{ fontSize: 13 }}>{r.pickup_point}</td>
                    <td className="td-amount">₹{Number(r.monthly_fee).toLocaleString()}</td>
                    <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{r.driver_name}</td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[r.status]}`}>
                        {r.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => handleStatusToggle(r)}
                          title="Toggle Status"
                        >
                          {r.status === 'active' ? '⏸' : '▶'}
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(r.id)}
                          title="Delete"
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Add Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={e => e.target === e.currentTarget && setShowModal(false)}>
            <motion.div className="modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
              <div className="modal-header">
                <h2>🚌 Add Transport Record</h2>
                <button className="btn btn-outline btn-sm btn-icon" onClick={() => setShowModal(false)}>✕</button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Student Name *</label>
                      <input required placeholder="e.g. Aarav Sharma" value={form.student_name}
                        onChange={e => setForm({ ...form, student_name: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Class</label>
                      <input placeholder="e.g. Grade 1 A" value={form.class}
                        onChange={e => setForm({ ...form, class: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Route Name *</label>
                      <input required placeholder="e.g. Route A - North" value={form.route_name}
                        onChange={e => setForm({ ...form, route_name: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Monthly Fee (₹) *</label>
                      <input required type="number" placeholder="e.g. 1500" value={form.monthly_fee}
                        onChange={e => setForm({ ...form, monthly_fee: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Pickup Point</label>
                      <input placeholder="e.g. MG Road Bus Stop" value={form.pickup_point}
                        onChange={e => setForm({ ...form, pickup_point: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Drop Point</label>
                      <input placeholder="e.g. School Gate" value={form.drop_point}
                        onChange={e => setForm({ ...form, drop_point: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Vehicle Number</label>
                      <input placeholder="e.g. MH12AB1234" value={form.vehicle_no}
                        onChange={e => setForm({ ...form, vehicle_no: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Driver Name</label>
                      <input placeholder="e.g. Ramu Yadav" value={form.driver_name}
                        onChange={e => setForm({ ...form, driver_name: e.target.value })} />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Saving...</> : '✓ Save Record'}
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
