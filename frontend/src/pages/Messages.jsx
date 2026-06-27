import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api';
import { useToast } from '../context/ToastContext';

const CHANNEL_STYLE = {
  whatsapp: { icon: '💬', color: '#25D366', label: 'WhatsApp' },
  sms:      { icon: '📱', color: '#6366f1', label: 'SMS' },
  email:    { icon: '📧', color: '#06b6d4', label: 'Email' },
};

const TYPE_LABEL = {
  reminder:     { label: 'Reminder', color: 'var(--warning)' },
  confirmation: { label: 'Confirmation', color: 'var(--success)' },
  overdue_alert:{ label: 'Overdue Alert', color: 'var(--danger)' },
  followup:     { label: 'Follow-up', color: 'var(--primary-light)' },
};

const emptyForm = {
  recipient: '', phone: '', student_name: '',
  message_type: 'reminder', channel: 'whatsapp', content: '', created_by: 'Admin'
};

export default function Messages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [autoGenerating, setAutoGenerating] = useState(false);
  const [filterType, setFilterType] = useState('');
  const { showToast } = useToast();

  const load = () => {
    setLoading(true);
    api.getMessages().then(res => setMessages(res.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = messages.filter(m => filterType ? m.message_type === filterType : true);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.sendMessage(form);
      showToast('✅ Message sent successfully!');
      setShowModal(false);
      setForm(emptyForm);
      load();
    } catch (err) { showToast(err.message, 'error'); }
    finally { setSubmitting(false); }
  };

  const handleAutoGenerate = async () => {
    setAutoGenerating(true);
    try {
      const res = await api.autoGenerateReminders();
      showToast(`🚀 ${res.message}`);
      load();
    } catch (err) { showToast(err.message, 'error'); }
    finally { setAutoGenerating(false); }
  };

  return (
    <div className="page-container">
      <div className="topbar" style={{ marginLeft: '-32px', marginRight: '-32px', marginTop: '-32px', marginBottom: '32px', paddingLeft: '32px', paddingRight: '32px' }}>
        <div className="topbar-title">
          <h1>💬 Messages & Reminders</h1>
          <p>Step 6 — Automated reminders, confirmations & follow-up messages</p>
        </div>
        <div className="topbar-actions">
          <button className="btn btn-outline" onClick={handleAutoGenerate} disabled={autoGenerating}>
            {autoGenerating ? '⏳ Generating...' : '⚡ Auto-Generate Reminders'}
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>✉️ Send Message</button>
        </div>
      </div>

      {/* Step 6 explanation */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.08), rgba(16,185,129,0.06))', border: '1px solid rgba(6,182,212,0.2)', borderRadius: 12, padding: '16px 24px', marginBottom: 24 }}>
        <div style={{ fontWeight: 700, color: 'var(--accent)', marginBottom: 8, fontSize: 13 }}>⚡ Step 6 — Automated Message Types</div>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {[
            { icon: '⏰', label: 'Fee Reminders', desc: 'Sent before due date' },
            { icon: '✅', label: 'Confirmations', desc: 'After payment received' },
            { icon: '🚨', label: 'Overdue Alerts', desc: 'After due date passes' },
            { icon: '📞', label: 'Follow-up Msgs', desc: 'After counsellor action' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{item.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Sent', value: messages.filter(m => m.status === 'sent').length, color: '#10b981', icon: '✅' },
          { label: 'Pending', value: messages.filter(m => m.status === 'pending').length, color: '#f59e0b', icon: '⏳' },
          { label: 'Via WhatsApp', value: messages.filter(m => m.channel === 'whatsapp').length, color: '#25D366', icon: '💬' },
          { label: 'Via SMS', value: messages.filter(m => m.channel === 'sms').length, color: '#6366f1', icon: '📱' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            style={{ flex: '1 1 120px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px', textAlign: 'center' }}>
            <div style={{ fontSize: 20 }}>{s.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['', 'reminder', 'confirmation', 'overdue_alert', 'followup'].map(t => (
          <button key={t} onClick={() => setFilterType(t)}
            className={`btn ${filterType === t ? 'btn-primary' : 'btn-outline'}`} style={{ fontSize: 12 }}>
            {t === '' ? 'All' : TYPE_LABEL[t]?.label || t}
          </button>
        ))}
      </div>

      {/* Messages list */}
      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((msg, i) => {
            const ch = CHANNEL_STYLE[msg.channel] || CHANNEL_STYLE.sms;
            const ty = TYPE_LABEL[msg.message_type];
            return (
              <motion.div key={msg.id} className="card"
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}>
                <div className="card-body" style={{ padding: '18px 24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: 20 }}>{ch.icon}</span>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{msg.recipient}</span>
                        <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 99, fontWeight: 600, background: `${ch.color}20`, color: ch.color, border: `1px solid ${ch.color}40` }}>{ch.label}</span>
                        {ty && <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 99, fontWeight: 600, background: `${ty.color}15`, color: ty.color, border: `1px solid ${ty.color}30` }}>{ty.label}</span>}
                        <span className={`badge ${msg.status === 'sent' ? 'badge-success' : 'badge-warning'}`}>{msg.status}</span>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>
                        📞 {msg.phone} &nbsp;|&nbsp; 👤 {msg.student_name}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '10px 14px', lineHeight: 1.6, fontStyle: 'italic' }}>
                        "{msg.content}"
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>By: {msg.created_by}</div>
                      {msg.sent_at && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{new Date(msg.sent_at).toLocaleDateString('en-IN')}</div>}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Send Message Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={e => e.target === e.currentTarget && setShowModal(false)}>
            <motion.div className="modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
              <div className="modal-header">
                <h2>✉️ Send Message</h2>
                <button className="btn btn-outline btn-sm btn-icon" onClick={() => setShowModal(false)}>✕</button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Recipient Name *</label>
                      <input required placeholder="Parent name" value={form.recipient} onChange={e => setForm({ ...form, recipient: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Phone Number</label>
                      <input placeholder="Mobile number" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Student Name</label>
                      <input placeholder="Student name" value={form.student_name} onChange={e => setForm({ ...form, student_name: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Channel</label>
                      <select value={form.channel} onChange={e => setForm({ ...form, channel: e.target.value })}>
                        <option value="whatsapp">💬 WhatsApp</option>
                        <option value="sms">📱 SMS</option>
                        <option value="email">📧 Email</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Message Type</label>
                      <select value={form.message_type} onChange={e => setForm({ ...form, message_type: e.target.value })}>
                        <option value="reminder">Reminder</option>
                        <option value="confirmation">Confirmation</option>
                        <option value="overdue_alert">Overdue Alert</option>
                        <option value="followup">Follow-up</option>
                      </select>
                    </div>
                    <div className="form-group full">
                      <label>Message Content *</label>
                      <textarea required rows={4} placeholder="Type your message here..." value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} style={{ resize: 'vertical', minHeight: 100 }} />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Sending...' : '✉️ Send Message'}
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
