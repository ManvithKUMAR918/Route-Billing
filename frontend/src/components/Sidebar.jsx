import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';

const navGroups = [
  {
    label: 'Overview',
    items: [
      { to: '/', icon: '🏠', label: 'Dashboard', end: true },
    ]
  },
  {
    label: 'Step 1 — Data Entry',
    items: [
      { to: '/enquiry', icon: '📋', label: 'Parent Enquiry Form' },
      { to: '/followup', icon: '🧑‍💼', label: 'Counsellor Follow-up' },
    ]
  },
  {
    label: 'Step 3 — Admin Workflow',
    items: [
      { to: '/transport', icon: '🚌', label: 'Transport Records' },
      { to: '/payments', icon: '💳', label: 'Payments' },
      { to: '/dues', icon: '⚠️', label: 'Dues Tracker' },
      { to: '/expenses', icon: '💸', label: 'Expense Entry' },
      { to: '/exit', icon: '🚪', label: 'Exit / Transfer' },
      { to: '/finance', icon: '💼', label: 'Finance Dashboard' },
    ]
  },
  {
    label: 'Step 4 — AI Insights',
    items: [
      { to: '/insights', icon: '🤖', label: 'AI Insights & Alerts' },
    ]
  },
  {
    label: 'Step 5 — Records',
    items: [
      { to: '/students', icon: '👨‍🎓', label: 'Students' },
      { to: '/receipt', icon: '🧾', label: 'Receipts & Export' },
      { to: '/reports', icon: '📊', label: 'Reports' },
    ]
  },
  {
    label: 'Step 6 — Messaging',
    items: [
      { to: '/messages', icon: '💬', label: 'Messages & Reminders' },
    ]
  },
];

export default function Sidebar() {
  return (
    <motion.aside
      className="sidebar"
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-badge">
          <div className="logo-icon">🚌</div>
          <div className="logo-text">
            <h2>FirstCry Intellitots</h2>
            <span>Transport Billing System</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navGroups.map((group) => (
          <div key={group.label}>
            <div className="nav-section-label">{group.label}</div>
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* User Footer */}
      <div className="sidebar-footer">
        <div className="user-card">
          <div className="avatar">A</div>
          <div className="user-info">
            <p>Admin User</p>
            <span>Centre Administrator</span>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}
