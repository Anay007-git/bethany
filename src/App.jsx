import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import TermsConditions from './pages/TermsConditions';
import PrivacyPolicy from './pages/PrivacyPolicy';
import RefundPolicy from './pages/RefundPolicy';
import ContactPage from './pages/ContactPage';
import AdminLogin from './components/admin/AdminLogin';
import BillSearch from './components/bill/BillSearch';
import BillView from './components/bill/BillView';
import IcalExport from './pages/IcalExport';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/terms" element={<TermsConditions />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/refund-policy" element={<RefundPolicy />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/my-bill" element={<BillSearch />} />
        <Route path="/bill/:bookingId" element={<BillView />} />
        <Route path="/ical/:roomId" element={<IcalExport />} />
      </Routes>
    </Router>
  );
}

export default App;
