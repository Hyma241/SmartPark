import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import Snowflakes from './components/Snowflakes/Snowflakes';

// Public Screens
import LandingPage from './pages/LandingPage';
import InstructionsScreen from './pages/InstructionsScreen';
import DemoScreen from './pages/DemoScreen';
import DemoResultsScreen from './pages/DemoResultsScreen';
import DemoDashboard from './pages/DemoDashboard';
import RegistrationScreen from './pages/RegistrationScreen';
import LoginScreen from './pages/LoginScreen';
import ForgotPasswordScreen from './pages/ForgotPasswordScreen';
import ContactPage from './pages/ContactPage';
import PublicParking from './pages/PublicParking';
import NotFoundScreen from './pages/NotFoundScreen';

// Admin Dashboard Screens
import AdminDashboard from './pages/AdminDashboard';
import CCTVIntegrationScreen from './pages/CCTVIntegrationScreen';
import AnalyticsScreen from './pages/AnalyticsScreen';
import QRCodeGenerationScreen from './pages/QRCodeGenerationScreen';
import UsersManagementScreen from './pages/UsersManagementScreen';
import NotificationsScreen from './pages/NotificationsScreen';
import ProfileSettingsScreen from './pages/ProfileSettingsScreen';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <ToastContainer position="top-right" autoClose={3000} theme="dark" />
          <Snowflakes />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/how-it-works" element={<InstructionsScreen />} />
            <Route path="/demo-upload" element={<DemoScreen />} />
            <Route path="/demo-results" element={<DemoResultsScreen />} />
            <Route path="/demo-dashboard" element={<DemoDashboard />} />
            <Route path="/signup" element={<RegistrationScreen />} />
            <Route path="/login" element={<LoginScreen />} />
            <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/parking/:mallId" element={<PublicParking />} />

            {/* Admin Dashboard Protected Routes */}
            <Route path="/admin" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="cameras" element={<CCTVIntegrationScreen />} />
              <Route path="analytics" element={<AnalyticsScreen />} />
              <Route path="qr" element={<QRCodeGenerationScreen />} />
              <Route path="users" element={<UsersManagementScreen />} />
              <Route path="notifications" element={<NotificationsScreen />} />
              <Route path="settings" element={<ProfileSettingsScreen />} />
            </Route>

            {/* 404 Catch All */}
            <Route path="*" element={<NotFoundScreen />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
