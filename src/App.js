import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Core components
import Header from './components/Header';
import Footer from './components/Footer';
import PrivateRoute from './components/PrivateRoute';

import LoadingSpinner from './components/LoadingSpinner';

// Eagerly loaded pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import './styles/main.css';

// Lazy loaded pages for better performance
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CreateOrder = lazy(() => import('./pages/CreateOrder'));
const OrderDetails = lazy(() => import('./pages/OrderDetails'));
const OrderHistory = lazy(() => import('./pages/OrderHistory'));
const PartnerDashboard = lazy(() => import('./pages/PartnerDashboard'));
const CustomerProfile = lazy(() => import('./pages/CustomerProfile'));
const PartnerProfile = lazy(() => import('./pages/PartnerProfile'));
const PaymentMethod = lazy(() => import('./components/PaymentMethod'));

// Simple loading fallback
const Fallback = () => (
  <div className="loading">
    <div className="spinner"></div>
  </div>
);

// Auth Redirect component to handle redirects after auth state changes
const AuthRedirect = () => {
  const { currentUser, userType, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Only redirect if auth is loaded and we have a user
    if (!loading && currentUser) {
      const publicPaths = ['/', '/login', '/register'];
      
      // If user is on a public path, redirect to the appropriate dashboard
      if (publicPaths.includes(location.pathname)) {
        if (userType === 'customer') {
          navigate('/dashboard');
        } else if (userType === 'partner') {
          navigate('/partner/dashboard');
        }
      }
    }
  }, [currentUser, userType, loading, location.pathname, navigate]);
  
  return null;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="flex flex-col min-h-screen">
          <AuthRedirect />
          <Header />
          <main className="flex-grow">
            <Suspense fallback={<Fallback />}>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Static pages */}
                <Route path="/terms" element={<div className="container py-8"><h1>Terms of Service</h1><p>Coming soon...</p></div>} />
                <Route path="/privacy" element={<div className="container py-8"><h1>Privacy Policy</h1><p>Coming soon...</p></div>} />
                <Route path="/cookies" element={<div className="container py-8"><h1>Cookie Policy</h1><p>Coming soon...</p></div>} />
                <Route path="/services/:type" element={<div className="container py-8"><h1>Service Details</h1><p>Service information coming soon...</p></div>} />
                
                {/* Customer routes */}
                <Route path="/dashboard" element={
                  <PrivateRoute requiredType="customer">
                    <Dashboard />
                  </PrivateRoute>
                } />
                
                <Route path="/profile" element={
                  <PrivateRoute requiredType="customer">
                    <CustomerProfile />
                  </PrivateRoute>
                } />
                
                <Route path="/create-order" element={
                  <PrivateRoute requiredType="customer">
                    <CreateOrder />
                  </PrivateRoute>
                } />
                
                <Route path="/order/:orderId" element={
                  <PrivateRoute>
                    <OrderDetails />
                  </PrivateRoute>
                } />
                
                <Route path="/orders" element={
                  <PrivateRoute>
                    <OrderHistory />
                  </PrivateRoute>
                } />
                
                {/* Partner routes */}
                <Route path="/partner/dashboard" element={
                  <PrivateRoute requiredType="partner">
                    <PartnerDashboard />
                  </PrivateRoute>
                } />
                
                <Route path="/partner/profile" element={
                  <PrivateRoute requiredType="partner">
                    <PartnerProfile />
                  </PrivateRoute>
                } />
                
                {/* Fallback route */}
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </Suspense>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;