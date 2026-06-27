import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../api';

export default function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.getStudents().then(res => setStudents(res.data)).finally(() => setLoading(false));
  }, []);

  const filtered = students.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.admission_no?.toLowerCase().includes(search.toLowerCase()) ||
    s.class?.toLowerCase().includes(search.toLowerCase())
  );

  const colorMap = ['indigo', 'cyan', 'green', 'amber', 'pink'];
  const gradients = [
    'linear-gradient(135deg, #6366f1, #4f46e5)',
    'linear-gradient(135deg, #06b6d4, #0891b2)',
    'linear-gradient(135deg, #10b981, #059669)',
    'linear-gradient(135deg, #f59e0b, #d97706)',
    'linear-gradient(135deg, #ec4899, #db2777)',
  ];

  return (
    <div className="page-container">
      <div className="topbar" style={{ marginLeft: '-32px', marginRight: '-32px', marginTop: '-32px', marginBottom: '32px', paddingLeft: '32px', paddingRight: '32px' }}>
        <div className="topbar-title">
          <h1>👨‍🎓 Students</h1>
          <p>All enrolled students with transport assignments</p>
        </div>
        <div className="topbar-actions">
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{students.length} total students</span>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-body" style={{ padding: '14px 24px' }}>
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input placeholder="Search by name, class, or admission number..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {filtered.map((s, i) => (
            <motion.div key={s.id} className="card"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.07 }}
              whileHover={{ y: -4, borderColor: 'var(--border-light)' }}
              style={{ cursor: 'default' }}>
              <div className="card-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: gradients[i % 5], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                    {s.name?.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{s.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.admission_no}</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    { label: 'Class', value: `${s.class} - ${s.section}` },
                    { label: 'Phone', value: s.phone },
                    { label: 'Parent', value: s.parent_name },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '8px 10px' }}>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{value || '—'}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
