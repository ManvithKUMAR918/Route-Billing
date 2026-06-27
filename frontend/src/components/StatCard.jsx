import { motion } from 'framer-motion';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.4, ease: 'easeOut' } }),
};

export default function StatCard({ icon, value, label, sub, color = 'indigo', index = 0 }) {
  return (
    <motion.div
      className={`stat-card ${color}`}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      custom={index}
    >
      <div className="stat-icon">{icon}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </motion.div>
  );
}
