import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';

// Guards
import ProtectedRoute from './routes/ProtectedRoute';
import AdminRoute from './routes/AdminRoute';

// Public Pages
import Home from './pages/public/Home';
import About from './pages/public/About';
import Contact from './pages/public/Contact';
import Login from './pages/public/Login';
import Register from './pages/public/Register';
import Track from './pages/public/Track';
import NotFound from './pages/public/NotFound';

// Citizen Pages
import Dashboard from './pages/citizen/Dashboard';
import FileComplaint from './pages/citizen/FileComplaint';
import ComplaintDetails from './pages/citizen/ComplaintDetails';
import Profile from './pages/citizen/Profile';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminComplaints from './pages/admin/AdminComplaints';
import AdminEmergencies from './pages/admin/AdminEmergencies';
import AdminUsers from './pages/admin/AdminUsers';
import AdminInquiries from './pages/admin/AdminInquiries';
import AdminReports from './pages/admin/AdminReports';
import AdminSettings from './pages/admin/AdminSettings';
import AdminAudit from './pages/admin/AdminAudit';

// Global Transition Context & Overlay
import { PageTransitionProvider } from './context/PageTransitionContext';
import PageTransition from './components/common/PageTransition';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <PageTransitionProvider>
          <PageTransition />
          <Routes>
          {/* Public & Citizen Layout Routes */}
          <Route element={<PublicLayout />}>
            <Route index element={<Home />} />
            <Route path="about" element={<About />} />
            <Route path="contact" element={<Contact />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="track" element={<Track />} />

            {/* Protected Citizen Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="complaint" element={<FileComplaint />} />
              <Route path="complaints/:id" element={<ComplaintDetails />} />
              <Route path="profile" element={<Profile />} />
            </Route>

            {/* 404 Catch-All */}
            <Route path="*" element={<NotFound />} />
          </Route>

          {/* Protected Admin Layout Routes */}
          <Route path="admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="complaints" element={<AdminComplaints />} />
            <Route path="emergencies" element={<AdminEmergencies />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="contacts" element={<AdminInquiries />} />
            <Route path="inquiries" element={<AdminInquiries />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="audit" element={<AdminAudit />} />
          </Route>
        </Routes>
        </PageTransitionProvider>
      </Router>
    </AuthProvider>
  );
}

