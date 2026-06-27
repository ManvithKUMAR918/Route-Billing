import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../api';
import { useToast } from '../context/ToastContext';

const INSIGHT_STYLE = {
  alert:   { icon: '🚨', border: 'var(--danger)',  bg: 'rgba(239,68,68,0.06)',   badge: 'badge-danger' },
  warning: { icon: '⚠️', border: 'var(--warning)', bg: 'rgba(245,158,11,0.06)',  badge: 'badge-warning' },
  info:    { icon: 'ℹ️', border: 'var(--primary-light)', bg: 'rgba(99,102,241,0.06)', badge: 'badge-info' },
  success: { icon: '✅', border: 'var(--success)', bg: 'rgba(16,185,129,0.06)',  badge: 'badge-success' },
  summary: { icon: '📊', border: 'var(--accent)',  bg: 'rgba(6,182,212,0.06)',   badge: 'badge-muted' },
};

export default function Insights() {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastGenerated, setLastGenerated] = useState(null);
  const { showToast } = useToast();

  const load = () => {
    setLoading(true);
    api.getInsights()
      .then(res => { setInsights(res.data); setLastGenerated(res.generated_at); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const counts = {
    high: insights.filter(i => i.severity === 'high').length,
    medium: insights.filter(i => i.severity === 'medium').length,
    low: insights.filter(i => i.severity === 'low').length,
  };

  return (
    <div className="page-container">
      <div className="topbar" style={{ marginLeft: '-32px', marginRight: '-32px', marginTop: '-32px', marginBottom: '32px', paddingLeft: '32px', paddingRight: '32px' }}>
        <div className="topbar-title">
          <h1>🤖 AI Insights</h1>
          <p>Step 4 — Rule-based logic generates alerts, summaries & recommendations</p>
        </div>
        <div className="topbar-actions">
          {lastGenerated && <span style={{ fontSize: 12, color: 'var(--text-muted)', marginRight: 12 }}>Generated: {new Date(lastGenerated).toLocaleTimeString('en-IN')}</span>}
          <button className="btn btn-primary" onClick={load}>🔄 Refresh Insights</button>
        </div>
      </div>

      {/* How it works */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(6,182,212,0.06))', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 14, padding: '20px 24px', marginBottom: 28 }}>
        <div style={{ fontWeight: 700, color: 'var(--primary-light)', marginBottom: 10, fontSize: 14 }}>🤖 How AI Insights Work (Step 4)</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {[
            { rule: 'Rule 1', desc: 'High-priority pending enquiries → Urgent alert' },
            { rule: 'Rule 2', desc: 'Overdue dues past due date → Warning with student list' },
            { rule: 'Rule 3', desc: 'Inactive transport with no exit record → Info alert' },
            { rule: 'Rule 4', desc: 'Collection rate < 80% → Recommend sending reminders' },
            { rule: 'Rule 5', desc: 'End of month → Auto-generate summary report' },
          ].map((r, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '10px 14px' }}>
              <div style={{ fontSize: 11, color: 'var(--primary-light)', fontWeight: 700, marginBottom: 4 }}>{r.rule}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{r.desc}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Severity summary */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'High Severity', count: counts.high, color: 'var(--danger)' },
          { label: 'Medium Severity', count: counts.medium, color: 'var(--warning)' },
          { label: 'Low / Info', count: counts.low, color: 'var(--success)' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}
            style={{ flex: 1, background: 'var(--bg-card)', border: `1px solid ${s.color}44`, borderRadius: 12, padding: '16px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 30, fontWeight: 800, color: s.color }}>{s.count}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Insights List */}
      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {insights.map((insight, i) => {
            const style = INSIGHT_STYLE[insight.type] || INSIGHT_STYLE.info;
            return (
              <motion.div key={insight.id}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                style={{ background: style.bg, border: `1px solid ${style.border}44`, borderLeft: `4px solid ${style.border}`, borderRadius: 12, padding: '20px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <span style={{ fontSize: 22 }}>{style.icon}</span>
                      <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{insight.title}</h3>
                      <span className={`badge ${style.badge}`}>{insight.severity?.toUpperCase()}</span>
                    </div>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: insight.students?.length ? 12 : 0 }}>
                      {insight.message}
                    </p>
                    {insight.students?.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                        {insight.students.map((s, si) => (
                          <span key={si} style={{ padding: '3px 10px', background: 'rgba(255,255,255,0.07)', borderRadius: 99, fontSize: 12, color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                            👤 {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {insight.action && (
                    <a href={insight.action_link}
                      style={{ flexShrink: 0, padding: '8px 16px', borderRadius: 8, background: `${style.border}22`, color: style.border, border: `1px solid ${style.border}44`, fontSize: 13, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap', transition: 'all 0.2s' }}>
                      {insight.action} →
                    </a>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
