import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api';

export default function Receipt() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.getPayments().then(res => setPayments(res.data)).finally(() => setLoading(false));
  }, []);

  const filtered = payments.filter(p =>
    p.student_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.receipt_number?.toLowerCase().includes(search.toLowerCase())
  );

  const MODE_ICON = { cash: '💵', online: '🌐', upi: '📱', cheque: '🏦' };
  const MODE_COLOR = { cash: '#10b981', online: '#6366f1', upi: '#06b6d4', cheque: '#f59e0b' };

  const handlePrint = () => {
    const printContent = document.getElementById('print-receipt');
    const originalBody = document.body.innerHTML;
    document.body.innerHTML = `<html><head><title>Receipt</title><style>
      body { font-family: Arial, sans-serif; padding: 40px; color: #1a1a1a; }
      .header { text-align: center; border-bottom: 2px solid #6366f1; padding-bottom: 16px; margin-bottom: 24px; }
      .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
      .label { color: #666; font-size: 13px; }
      .value { font-weight: 700; font-size: 14px; }
      .amount { font-size: 28px; font-weight: 800; color: #6366f1; text-align: center; margin: 20px 0; }
      .footer { text-align: center; margin-top: 32px; font-size: 12px; color: #888; }
      .status { color: #10b981; font-weight: 700; font-size: 16px; text-align: center; }
    </style></head><body>${printContent.innerHTML}</body></html>`;
    window.print();
    document.body.innerHTML = originalBody;
    window.location.reload();
  };

  return (
    <div className="page-container">
      {/* Topbar */}
      <div className="topbar" style={{ marginLeft: '-32px', marginRight: '-32px', marginTop: '-32px', marginBottom: '32px', paddingLeft: '32px', paddingRight: '32px' }}>
        <div className="topbar-title">
          <h1>🧾 Receipt / Export View</h1>
          <p>View and print payment receipts for all transport fee transactions</p>
        </div>
        <div className="topbar-actions">
          <button className="btn btn-outline" onClick={() => {
            const rows = [['Receipt #', 'Student', 'Class', 'Amount', 'Month', 'Mode', 'Date']];
            filtered.forEach(p => rows.push([p.receipt_number, p.student_name, p.class, p.amount_paid, p.month_paid, p.payment_mode, p.payment_date]));
            const csv = rows.map(r => r.join(',')).join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = 'transport_payments.csv'; a.click();
          }}>⬇ Export CSV</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 24 }}>
        {/* Left — payments list */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Search */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-body" style={{ padding: '12px 20px' }}>
              <div className="search-bar">
                <span className="search-icon">🔍</span>
                <input placeholder="Search by name or receipt number..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%' }} />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filtered.map((p, i) => (
                <motion.div key={p.id}
                  onClick={() => setSelected(p)}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  style={{ background: selected?.id === p.id ? 'rgba(99,102,241,0.12)' : 'var(--bg-card)', border: `1px solid ${selected?.id === p.id ? 'rgba(99,102,241,0.4)' : 'var(--border)'}`, borderRadius: 10, padding: '14px 18px', cursor: 'pointer', transition: 'all 0.2s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 14 }}>{p.student_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'monospace' }}>{p.receipt_number}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: MODE_COLOR[p.payment_mode] || '#10b981' }}>₹{Number(p.amount_paid).toLocaleString()}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.payment_date}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Right — receipt preview */}
        <div style={{ width: 380, flexShrink: 0 }}>
          <div className="card" style={{ position: 'sticky', top: 100 }}>
            {!selected ? (
              <div className="empty-state" style={{ padding: '60px 20px' }}>
                <div className="empty-icon">🧾</div>
                <h3>Select a payment</h3>
                <p>Click any payment to preview its receipt</p>
              </div>
            ) : (
              <>
                <div className="card-header">
                  <h3 className="card-title">Receipt Preview</h3>
                  <button className="btn btn-primary btn-sm" onClick={handlePrint}>🖨 Print</button>
                </div>
                <div className="card-body" id="print-receipt">
                  {/* Receipt Content */}
                  <div className="header" style={{ textAlign: 'center', borderBottom: '2px solid var(--primary)', paddingBottom: 16, marginBottom: 20 }}>
                    <div style={{ fontSize: 28, marginBottom: 4 }}>🚌</div>
                    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 800, color: 'var(--primary-light)' }}>FirstCry Intellitots</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Transport Fee & Route Billing System</div>
                    <div style={{ marginTop: 8, fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '1px' }}>PAYMENT RECEIPT</div>
                  </div>

                  <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--success)', textAlign: 'center', marginBottom: 20 }}>
                    ₹{Number(selected.amount_paid).toLocaleString()}
                  </div>

                  <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <span style={{ fontSize: 12, padding: '4px 14px', borderRadius: 99, background: 'rgba(16,185,129,0.15)', color: 'var(--success)', border: '1px solid rgba(16,185,129,0.3)', fontWeight: 700 }}>
                      ✅ PAYMENT RECEIVED
                    </span>
                  </div>

                  {[
                    { label: 'Receipt No.', value: selected.receipt_number },
                    { label: 'Student Name', value: selected.student_name },
                    { label: 'Class', value: selected.class || '—' },
                    { label: 'Month', value: selected.month_paid },
                    { label: 'Payment Mode', value: `${MODE_ICON[selected.payment_mode] || '💰'} ${selected.payment_mode?.toUpperCase()}` },
                    { label: 'Payment Date', value: selected.payment_date },
                    { label: 'Remarks', value: selected.remarks || 'Nil' },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', gap: 12 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
                      <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600, textAlign: 'right' }}>{value}</span>
                    </div>
                  ))}

                  <div style={{ marginTop: 24, textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                    Thank you for your payment. Keep this receipt for your records.
                    <br />Generated: {new Date().toLocaleDateString('en-IN')} · FirstCry Intellitots
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
