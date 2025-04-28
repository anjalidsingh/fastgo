import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Core components
import Header from './components/Header';
import Footer from './components/Footer';
import PrivateRoute from './components/PrivateRoute';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary'; // New error boundary component

// Eagerly loaded pages - critical for initial load
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import './styles/main.css';

// Lazy loaded pages for better performance
const Dashboard = lazy(() => import(/* webpackChunkName: "dashboard" */ './pages/Dashboard'));
const CreateOrder = lazy(() => import(/* webpackChunkName: "createOrder" */ './pages/CreateOrder'));
const OrderDetails = lazy(() => import(/* webpackChunkName: "orderDetails" */ './pages/OrderDetails'));
const OrderHistory = lazy(() => import(/* webpackChunkName: "orderHistory" */ './pages/OrderHistory'));
const PartnerDashboard = lazy(() => import(/* webpackChunkName: "partnerDashboard" */ './pages/PartnerDashboard'));
const CustomerProfile = lazy(() => import(/* webpackChunkName: "customerProfile" */ './pages/CustomerProfile'));
const PartnerProfile = lazy(() => import(/* webpackChunkName: "partnerProfile" */ './pages/PartnerProfile'));
const PaymentMethod = lazy(() => import(/* webpackChunkName: "paymentMethod" */ './components/PaymentMethod'));

// Static pages with minimal content can be grouped together
const StaticPages = {
  Terms: () => (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-4">Terms of Service</h1>
      <p>Coming soon...</p>
    </div>
  ),
  Privacy: () => (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-4">Privacy Policy</h1>
      <p>Coming soon...</p>
    </div>
  ),
  Cookies: () => (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-4">Cookie Policy</h1>
      <p>Coming soon...</p>
    </div>
  ),
  ServiceDetails: () => {
    const location = useLocation();
    const serviceType = location.pathname.split('/').pop();
    
    return (
      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-4">Service Details: {serviceType}</h1>
        <p>Service information coming soon...</p>
      </div>
    );
  }
};

// Enhanced loading fallback
const Fallback = () => (
  <div className="flex items-center justify-center min-h-screen p-4">
    <LoadingSpinner size="large" text="Loading content..." />
  </div>
);

// Auth Redirect component with memoization
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
          navigate('/dashboard', { replace: true });
        } else if (userType === 'partner') {
          navigate('/partner/dashboard', { replace: true });
        }
      }
    }
  }, [currentUser, userType, loading, location.pathname, navigate]);
  
  return null;
};

function App() {
  return (
    <Router>
      <ErrorBoundary fallback={<div className="container py-8 text-center">Something went wrong. Please refresh the page.</div>}>
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            <AuthRedirect />
            <Header />
            <main className="flex-grow">
              <ErrorBoundary fallback={<div className="container py-8">Error loading content. Please try again later.</div>}>
                <Suspense fallback={<Fallback />}>
                  <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    
                    {/* Static pages */}
                    <Route path="/terms" element={<StaticPages.Terms />} />
                    <Route path="/privacy" element={<StaticPages.Privacy />} />
                    <Route path="/cookies" element={<StaticPages.Cookies />} />
                    <Route path="/services/:type" element={<StaticPages.ServiceDetails />} />
                    
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
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
              </ErrorBoundary>
            </main>
            <Footer />
          </div>
        </AuthProvider>
      </ErrorBoundary>
    </Router>
  );
}

export default App;