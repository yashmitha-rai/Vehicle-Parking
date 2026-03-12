import React, { useContext, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './Context/Context';
import AuthContext from './Context/Context';
import UserLayout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import Home from './pages/Home';
import AdminLogin from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import SlotManagement from './pages/Slot';
import UserParking from './pages/UserParking';
import AdminSessions from './pages/AdminSessions';
import About from './pages/About';
import Contact from './pages/Contact';
import AdminContact from './pages/AdminContact';

// Protected Route Component - Simple Token Check
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (!token || user.role !== 'admin') {
    return <Navigate to="/admin/login" replace />;
  }
  
  return children;
};

// Login Route - Redirect if already logged in
const LoginRoute = () => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  // Only redirect if there's a valid token AND user with admin role
  if (token && user && user.role === 'admin' && user.email) {
    return <Navigate to="/admin/dashboard" replace />;
  }
  
  // Clear invalid data
  if (!token || !user.email || user.role !== 'admin') {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
  
  return <AdminLogin />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" />
        <Routes>
          {/* User Routes */}
          <Route path="/" element={<UserLayout />}>
            <Route index element={<Home />} />
            <Route path="parking" element={<UserParking />} />
            <Route path="about" element={<About />} />
            <Route path="contact" element={<Contact />} />
          </Route>

          {/* Admin Login */}
          <Route path="/admin/login" element={<LoginRoute />} />

          {/* Admin Routes - Protected */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="slots" element={<SlotManagement />} />
            <Route path="sessions" element={<AdminSessions />} />
            <Route path="contacts" element={<AdminContact />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;