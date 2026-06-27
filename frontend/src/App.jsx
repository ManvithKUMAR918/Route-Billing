import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import Sidebar from './components/Sidebar';
// Core pages
import Dashboard from './pages/Dashboard';
import Transport from './pages/Transport';
import Payments from './pages/Payments';
import Dues from './pages/Dues';
import Students from './pages/Students';
import Reports from './pages/Reports';
// Step 1 — Data Entry
import Enquiry from './pages/Enquiry';
import FollowUp from './pages/FollowUp';
// Step 3 — Admin Workflow
import Finance from './pages/Finance';
import Expenses from './pages/Expenses';
import ExitRecord from './pages/ExitRecord';
// Step 4 — AI Insights
import Insights from './pages/Insights';
// Step 6 — Messaging
import Messages from './pages/Messages';
// Receipt / Export
import Receipt from './pages/Receipt';
import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <div className="app-layout">
          <Sidebar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/transport" element={<Transport />} />
              <Route path="/payments" element={<Payments />} />
              <Route path="/dues" element={<Dues />} />
              <Route path="/students" element={<Students />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/enquiry" element={<Enquiry />} />
              <Route path="/followup" element={<FollowUp />} />
              <Route path="/finance" element={<Finance />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/exit" element={<ExitRecord />} />
              <Route path="/insights" element={<Insights />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/receipt" element={<Receipt />} />
            </Routes>
          </main>
        </div>
      </ToastProvider>
    </BrowserRouter>
  );
}
