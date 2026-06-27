import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { api } from '../api';

const ROUTE_COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: '#1a2234', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 14px' }}>
        {payload.map((p, i) => (
          <div key={i} style={{ color: p.color, fontSize: 13, fontWeight: 600 }}>
            {p.name}: {p.name === 'students' ? p.value : `₹${p.value.toLocaleString()}`}
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function Reports() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  useEffect(() => {
    api.getReportsData()
      .then(res => setData(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (error || !data) return (
    <div className="empty-state">
      <div className="empty-icon">📊</div>
      <h3>Could not load reports</h3>
      <p>{error || 'No data available'}</p>
    </div>
  );

  const { monthlyData = [], routeData = [] } = data;

  const routeDataWithColors = routeData.map((r, i) => ({
    ...r,
    color: ROUTE_COLORS[i % ROUTE_COLORS.length]
  }));

  return (
    <div className="page-container">
      <div className="topbar" style={{ marginLeft: '-32px', marginRight: '-32px', marginTop: '-32px', marginBottom: '32px', paddingLeft: '32px', paddingRight: '32px' }}>
        <div className="topbar-title">
          <h1>📊 Reports & Analytics</h1>
          <p>Visual overview of transport fee collections and dues — live from database</p>
        </div>
        <div className="topbar-actions">
          <button className="btn btn-outline">⬇ Export CSV</button>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Area Chart */}
        <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="card-header">
            <h3 className="card-title">📈 Collection vs Dues (Monthly)</h3>
          </div>
          <div className="card-body" style={{ padding: '20px 8px' }}>
            {monthlyData.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px 0' }}>
                <p>No payment data yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="colGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="dueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v/1000}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="collected" stroke="#6366f1" strokeWidth={2} fill="url(#colGrad)" name="Collected" />
                  <Area type="monotone" dataKey="dues" stroke="#f59e0b" strokeWidth={2} fill="url(#dueGrad)" name="Dues" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Pie Chart */}
        <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="card-header">
            <h3 className="card-title">🗺️ Students per Route</h3>
          </div>
          <div className="card-body">
            {routeDataWithColors.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px 0' }}>
                <p>No active transport assignments</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={routeDataWithColors} dataKey="value" cx="50%" cy="50%" outerRadius={80} innerRadius={50} paddingAngle={4}>
                    {routeDataWithColors.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v} students`]} contentStyle={{ background: '#1a2234', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} labelStyle={{ color: '#94a3b8' }} />
                  <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>
      </div>

      {/* Summary Table */}
      <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <div className="card-header">
          <h3 className="card-title">📋 Monthly Summary</h3>
        </div>
        {monthlyData.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No data to show</h3>
            <p>Record some payments to generate this report</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Collected</th>
                  <th>Dues</th>
                  <th>Total Expected</th>
                  <th>Collection %</th>
                </tr>
              </thead>
              <tbody>
                {monthlyData.map((row, i) => {
                  const total = parseFloat(row.collected) + parseFloat(row.dues);
                  const pct   = total > 0 ? Math.round((parseFloat(row.collected) / total) * 100) : 0;
                  return (
                    <tr key={i}>
                      <td className="td-name">{row.month}</td>
                      <td className="td-amount">₹{parseFloat(row.collected).toLocaleString()}</td>
                      <td style={{ color: 'var(--warning)', fontWeight: 600 }}>₹{parseFloat(row.dues || 0).toLocaleString()}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>₹{total.toLocaleString()}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: pct > 80 ? 'var(--success)' : 'var(--warning)', borderRadius: 99 }} />
                          </div>
                          <span style={{ fontSize: 12, color: pct > 80 ? 'var(--success)' : 'var(--warning)', fontWeight: 600, minWidth: 36 }}>{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
