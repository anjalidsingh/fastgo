import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Core components
import Header from './components/Header';
import Footer from './components/Footer';
import PrivateRoute from './components/PrivateRoute';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';

// Eagerly loaded pages - critical for initial load
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import './styles/main.css';

// Import Map stylesheet (Leaflet CSS)
import 'leaflet/dist/leaflet.css';

// Lazy loaded pages for better performance
const Dashboard = lazy(() => import(/* webpackChunkName: "dashboard" */ './pages/Dashboard'));
const CreateOrder = lazy(() => import(/* webpackChunkName: "createOrder" */ './pages/CreateOrder'));
const OrderDetails = lazy(() => import(/* webpackChunkName: "orderDetails" */ './pages/OrderDetails'));
const OrderHistory = lazy(() => import(/* webpackChunkName: "orderHistory" */ './pages/OrderHistory'));
const PartnerDashboard = lazy(() => import(/* webpackChunkName: "partnerDashboard" */ './pages/PartnerDashboard'));
const CustomerProfile = lazy(() => import(/* webpackChunkName: "customerProfile" */ './pages/CustomerProfile'));
const PartnerProfile = lazy(() => import(/* webpackChunkName: "partnerProfile" */ './pages/PartnerProfile'));
const PaymentMethod = lazy(() => import(/* webpackChunkName: "paymentMethod" */ './components/PaymentMethod'));

// Static pages with detailed content
const StaticPages = {
  Terms: () => (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-4">Terms of Service</h1>
      
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
        <p className="mb-2">Welcome to FastGo! These Terms of Service ("Terms") govern your use of the FastGo application, website, and services (collectively, the "Service"). By using FastGo, you agree to these Terms. If you do not agree, you may not use the Service.</p>
        <p>FastGo provides a platform that connects customers with delivery partners for efficient, affordable delivery services.</p>
      </section>
      
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">2. User Accounts</h2>
        <p className="mb-2">You must create an account to use certain features of the Service. You are responsible for maintaining the confidentiality of your account information and for all activity under your account.</p>
        <p className="mb-2">You must provide accurate, current, and complete information during the registration process and keep your account information updated.</p>
        <p>We reserve the right to suspend or terminate accounts that violate these Terms or engage in fraudulent activity.</p>
      </section>
      
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">3. Service Description</h2>
        <p className="mb-2">FastGo enables customers to request delivery services from independent delivery partners. FastGo does not provide delivery services directly but facilitates the connection between customers and delivery partners.</p>
        <p className="mb-2">While we strive to ensure reliable service, we cannot guarantee the availability of delivery partners at all times or in all locations.</p>
        <p>We reserve the right to modify, suspend, or discontinue any aspect of the Service at any time, with or without notice.</p>
      </section>
      
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">4. Fees and Payments</h2>
        <p className="mb-2">Customers agree to pay all fees associated with using the Service. Fees are calculated based on distance, package size, delivery type, and other factors.</p>
        <p className="mb-2">For Cash on Delivery (COD) payments, customers must pay the delivery partner the full amount upon delivery.</p>
        <p className="mb-2">Delivery partners receive a percentage of the total delivery fee, which varies based on order value and type.</p>
        <p>We reserve the right to change our fee structure at any time with reasonable notice.</p>
      </section>
      
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">5. User Conduct</h2>
        <p className="mb-2">Users must not use the Service for any illegal purposes or to transmit any harmful, threatening, abusive, or objectionable content.</p>
        <p className="mb-2">Users must not interfere with the proper functioning of the Service or attempt to gain unauthorized access to the Service or its systems.</p>
        <p>Users are responsible for all content they provide through the Service.</p>
      </section>
      
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">6. Prohibited Items</h2>
        <p className="mb-2">Users must not request delivery of:</p>
        <ul className="list-disc pl-8 mb-2">
          <li>Illegal substances or items</li>
          <li>Hazardous materials</li>
          <li>Firearms, ammunition, or weapons</li>
          <li>Counterfeit goods</li>
          <li>Stolen property</li>
          <li>Any items that violate applicable laws</li>
        </ul>
        <p>FastGo reserves the right to refuse or cancel any delivery that violates this policy.</p>
      </section>
      
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">7. Limitation of Liability</h2>
        <p className="mb-2">To the maximum extent permitted by law, FastGo shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill.</p>
        <p>Our liability is limited to the amount paid by you to FastGo in the three months preceding the event giving rise to liability.</p>
      </section>
      
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">8. Changes to Terms</h2>
        <p className="mb-2">We may modify these Terms at any time. If we make material changes, we will provide notice through the Service or by other means.</p>
        <p>Your continued use of the Service after any changes indicates your acceptance of the modified Terms.</p>
      </section>
      
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">9. Contact Information</h2>
        <p>For questions about these Terms, please contact us at support@fastgo.com.</p>
      </section>
      
      <p className="text-sm text-gray-500">Last Updated: April 30, 2025</p>
    </div>
  ),
  
  Privacy: () => (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-4">Privacy Policy</h1>
      
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
        <p className="mb-2">FastGo ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our application, website, and services (collectively, the "Service").</p>
        <p>Please read this Privacy Policy carefully. By using the Service, you consent to the practices described in this policy.</p>
      </section>
      
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">2. Information We Collect</h2>
        <p className="mb-2">We collect several types of information from and about users of our Service:</p>
        <ul className="list-disc pl-8 mb-2">
          <li><strong>Personal Information:</strong> Name, email address, phone number, physical address, payment information</li>
          <li><strong>Profile Information:</strong> User preferences, delivery history, feedback and ratings</li>
          <li><strong>Location Data:</strong> GPS location when using our mobile application</li>
          <li><strong>Device Information:</strong> Device type, IP address, browser type, operating system</li>
          <li><strong>Usage Data:</strong> How you interact with our Service, including pages visited and features used</li>
        </ul>
      </section>
      
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">3. How We Use Your Information</h2>
        <p className="mb-2">We use the information we collect to:</p>
        <ul className="list-disc pl-8 mb-2">
          <li>Provide, maintain, and improve our Service</li>
          <li>Process and manage delivery orders</li>
          <li>Connect customers with delivery partners</li>
          <li>Communicate with you about your account and orders</li>
          <li>Send promotional communications (with your consent)</li>
          <li>Monitor and analyze usage patterns and trends</li>
          <li>Detect, prevent, and address technical issues and fraudulent activities</li>
          <li>Comply with legal obligations</li>
        </ul>
      </section>
      
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">4. Sharing Your Information</h2>
        <p className="mb-2">We may share your information with:</p>
        <ul className="list-disc pl-8 mb-2">
          <li><strong>Delivery Partners:</strong> To facilitate deliveries (limited to necessary information)</li>
          <li><strong>Service Providers:</strong> Third parties that perform services on our behalf (payment processing, data analysis, etc.)</li>
          <li><strong>Business Partners:</strong> With your consent, for marketing purposes</li>
          <li><strong>Legal Requirements:</strong> To comply with applicable laws, regulations, or legal processes</li>
        </ul>
        <p>We do not sell your personal information to third parties.</p>
      </section>
      
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">5. Data Security</h2>
        <p className="mb-2">We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
        <p>However, no method of transmission over the Internet or electronic storage is 100% secure. We cannot guarantee absolute security of your data.</p>
      </section>
      
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">6. Your Rights</h2>
        <p className="mb-2">Depending on your location, you may have the following rights:</p>
        <ul className="list-disc pl-8 mb-2">
          <li>Access and obtain a copy of your personal information</li>
          <li>Correct inaccurate personal information</li>
          <li>Delete your personal information</li>
          <li>Restrict or object to the processing of your personal information</li>
          <li>Data portability</li>
          <li>Withdraw consent where processing is based on consent</li>
        </ul>
        <p>To exercise these rights, please contact us at privacy@fastgo.com.</p>
      </section>
      
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">7. Children's Privacy</h2>
        <p>Our Service is not directed to children under 18 years of age. We do not knowingly collect personal information from children under 18. If we learn we have collected personal information from a child under 18, we will promptly delete that information.</p>
      </section>
      
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">8. Changes to This Privacy Policy</h2>
        <p className="mb-2">We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.</p>
        <p>You are advised to review this Privacy Policy periodically for any changes.</p>
      </section>
      
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">9. Contact Us</h2>
        <p>If you have any questions about this Privacy Policy, please contact us at privacy@fastgo.com.</p>
      </section>
      
      <p className="text-sm text-gray-500">Last Updated: April 30, 2025</p>
    </div>
  ),
  
  Cookies: () => (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-4">Cookie Policy</h1>
      
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
        <p className="mb-2">This Cookie Policy explains how FastGo ("we," "our," or "us") uses cookies and similar technologies on our website and mobile application (collectively, the "Service").</p>
        <p>By using our Service, you agree to our use of cookies in accordance with this Cookie Policy.</p>
      </section>
      
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">2. What Are Cookies?</h2>
        <p className="mb-2">Cookies are small text files that are stored on your device when you visit a website. They are widely used to make websites work more efficiently and provide information to the website owners.</p>
        <p>Cookies may be "persistent" cookies or "session" cookies. Persistent cookies remain on your device after you close your browser, while session cookies are deleted when you close your browser.</p>
      </section>
      
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">3. Types of Cookies We Use</h2>
        <p className="mb-2">We use various types of cookies for different purposes:</p>
        <ul className="list-disc pl-8 mb-2">
          <li><strong>Essential Cookies:</strong> These cookies are necessary for the Service to function properly. They enable core functionality such as security, network management, and account access.</li>
          <li><strong>Functionality Cookies:</strong> These cookies allow us to remember choices you make (such as your preferred language or location) and provide enhanced, personalized features.</li>
          <li><strong>Performance/Analytics Cookies:</strong> These cookies collect information about how you use our Service, helping us to improve its functionality and user experience.</li>
          <li><strong>Marketing Cookies:</strong> These cookies track your online activity to help us deliver more relevant advertising or limit the number of times you see an advertisement.</li>
        </ul>
      </section>
      
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">4. Third-Party Cookies</h2>
        <p className="mb-2">Some cookies may be placed by third parties when you use our Service. These third parties may collect information about your online activities over time and across different websites.</p>
        <p>We do not control these third parties or their use of cookies. We encourage you to review the privacy policies of these third parties.</p>
      </section>
      
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">5. Your Cookie Choices</h2>
        <p className="mb-2">You can manage cookies through your browser settings. Most browsers allow you to:</p>
        <ul className="list-disc pl-8 mb-2">
          <li>Block all cookies</li>
          <li>Block third-party cookies</li>
          <li>Delete cookies when you close your browser</li>
          <li>Be notified when you receive a cookie</li>
        </ul>
        <p className="mb-2">Please note that if you choose to block or delete cookies, some features of the Service may not work properly.</p>
        <p>For more information about how to manage cookies, visit the help pages of your browser:</p>
        <ul className="list-disc pl-8">
          <li><a href="https://support.google.com/chrome/answer/95647" className="text-blue-600 hover:underline">Google Chrome</a></li>
          <li><a href="https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop" className="text-blue-600 hover:underline">Mozilla Firefox</a></li>
          <li><a href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac" className="text-blue-600 hover:underline">Safari</a></li>
          <li><a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" className="text-blue-600 hover:underline">Microsoft Edge</a></li>
        </ul>
      </section>
      
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">6. Changes to This Cookie Policy</h2>
        <p className="mb-2">We may update this Cookie Policy from time to time. We will notify you of any changes by posting the new Cookie Policy on this page and updating the "Last Updated" date.</p>
        <p>You are advised to review this Cookie Policy periodically for any changes.</p>
      </section>
      
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">7. Contact Us</h2>
        <p>If you have any questions about this Cookie Policy, please contact us at support@fastgo.com.</p>
      </section>
      
      <p className="text-sm text-gray-500">Last Updated: April 30, 2025</p>
    </div>
  ),
  
  ServiceDetails: () => {
    const location = useLocation();
    const serviceType = location.pathname.split('/').pop();
    
    // Prepare service content based on type
    let serviceContent;
    
    switch(serviceType) {
      case 'standard':
        serviceContent = (
          <>
            <h2 className="text-xl font-semibold mb-3">Standard Delivery</h2>
            <p className="mb-4">Our reliable, cost-effective delivery option for non-urgent packages.</p>
            
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Features</h3>
                <ul className="list-disc pl-6">
                  <li>Same-day delivery within city limits</li>
                  <li>Real-time package tracking</li>
                  <li>Delivery confirmation</li>
                  <li>Insurance up to ₹5,000</li>
                  <li>Flexible scheduling</li>
                </ul>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Pricing</h3>
                <ul className="list-disc pl-6">
                  <li>Base fare: ₹50</li>
                  <li>Distance fee: ₹5/km</li>
                  <li>Weight fee: ₹10/kg</li>
                  <li>No surge pricing</li>
                  <li>10% lower than market competitors</li>
                </ul>
              </div>
            </div>
            
            <h3 className="font-semibold mb-2">Weight Limits</h3>
            <p className="mb-4">Standard delivery supports packages up to 25kg. Packages are categorized as follows:</p>
            <ul className="list-disc pl-6 mb-6">
              <li>Small: Up to 5kg</li>
              <li>Medium: 5-15kg</li>
              <li>Large: 15-25kg</li>
            </ul>
            
            <h3 className="font-semibold mb-2">Delivery Window</h3>
            <p className="mb-4">For same-day delivery, orders must be placed before 3:00 PM. Orders placed after this time will be delivered the next business day.</p>
            
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-blue-700 mb-2">Why Choose Standard Delivery?</h3>
              <p>Our standard delivery service offers the perfect balance of speed, reliability, and cost-effectiveness. It's ideal for most everyday delivery needs when you don't require express speed but still want reliable, tracked delivery.</p>
            </div>
            
            <div className="text-center">
              <Link to="/register" className="btn bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors">Get Started</Link>
            </div>
          </>
        );
        break;
        
      case 'express':
        serviceContent = (
          <>
            <h2 className="text-xl font-semibold mb-3">Express Delivery</h2>
            <p className="mb-4">Our fastest delivery option for time-sensitive packages.</p>
            
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Features</h3>
                <ul className="list-disc pl-6">
                  <li>Priority handling</li>
                  <li>Guaranteed delivery within 2-3 hours</li>
                  <li>Real-time package tracking</li>
                  <li>Dedicated delivery partners</li>
                  <li>Insurance up to ₹10,000</li>
                </ul>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Pricing</h3>
                <ul className="list-disc pl-6">
                  <li>Base fare: ₹100</li>
                  <li>Distance fee: ₹7/km</li>
                  <li>Weight fee: ₹15/kg</li>
                  <li>Express surcharge: ₹100</li>
                  <li>Still 10% lower than competitors' express options</li>
                </ul>
              </div>
            </div>
            
            <h3 className="font-semibold mb-2">Weight Limits</h3>
            <p className="mb-4">Express delivery supports packages up to 15kg. Packages are categorized as follows:</p>
            <ul className="list-disc pl-6 mb-6">
              <li>Small: Up to 5kg</li>
              <li>Medium: 5-15kg</li>
            </ul>
            
            <h3 className="font-semibold mb-2">Delivery Hours</h3>
            <p className="mb-4">Express delivery is available from 8:00 AM to 10:00 PM, seven days a week.</p>
            
            <div className="bg-purple-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-purple-700 mb-2">Why Choose Express Delivery?</h3>
              <p>When time is of the essence, our express delivery service ensures your package arrives as quickly as possible. Perfect for urgent documents, time-sensitive items, or when you simply need something delivered right away.</p>
            </div>
            
            <div className="text-center">
              <Link to="/register" className="btn bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 transition-colors">Try Express Delivery</Link>
            </div>
          </>
        );
        break;
        
      case 'bulk':
        serviceContent = (
          <>
            <h2 className="text-xl font-semibold mb-3">Bulk Shipping</h2>
            <p className="mb-4">Efficient solutions for businesses and individuals with multiple packages.</p>
            
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Features</h3>
                <ul className="list-disc pl-6">
                  <li>Volume discounts</li>
                  <li>Batch order processing</li>
                  <li>Dedicated account manager</li>
                  <li>Customizable delivery schedules</li>
                  <li>Comprehensive shipment reports</li>
                  <li>API integration available</li>
                </ul>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Pricing</h3>
                <ul className="list-disc pl-6">
                  <li>5-20 packages: 5% discount</li>
                  <li>21-50 packages: 10% discount</li>
                  <li>51+ packages: 15% discount</li>
                  <li>Standard base rates apply</li>
                  <li>Monthly billing options available</li>
                </ul>
              </div>
            </div>
            
            <h3 className="font-semibold mb-2">Weight & Volume Capabilities</h3>
            <p className="mb-4">Our bulk shipping can handle packages of various sizes:</p>
            <ul className="list-disc pl-6 mb-6">
              <li>Combined weight up to 500kg per order</li>
              <li>Individual packages up to 25kg</li>
              <li>Volume discounts applied automatically</li>
            </ul>
            
            <h3 className="font-semibold mb-2">Ideal For</h3>
            <p className="mb-4">Bulk shipping is perfect for:</p>
            <ul className="list-disc pl-6 mb-6">
              <li>E-commerce businesses</li>
              <li>Retail stores with multiple deliveries</li>
              <li>Office supply distribution</li>
              <li>Event material distribution</li>
              <li>Product sample distribution</li>
            </ul>
            
            <div className="bg-green-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-green-700 mb-2">Why Choose Bulk Shipping?</h3>
              <p>Our bulk shipping service is designed to simplify logistics for businesses and individuals with multiple delivery needs. Save time, money, and effort while ensuring all your packages reach their destinations efficiently.</p>
            </div>
            
            <div className="text-center">
              <Link to="/register" className="btn bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition-colors">Start Bulk Shipping</Link>
            </div>
          </>
        );
        break;
        
      default:
        serviceContent = (
          <>
            <h2 className="text-xl font-semibold mb-3">Delivery Services</h2>
            <p className="mb-6">FastGo offers a variety of delivery solutions to meet your needs. Please select from our service options below:</p>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <h3 className="text-lg font-semibold mb-2 text-blue-600">Standard Delivery</h3>
                <p className="mb-4">Reliable, same-day delivery service for non-urgent packages at competitive rates.</p>
                <Link to="/services/standard" className="text-blue-600 font-medium hover:underline">Learn more →</Link>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <h3 className="text-lg font-semibold mb-2 text-purple-600">Express Delivery</h3>
                <p className="mb-4">Priority handling with guaranteed delivery within 2-3 hours for time-sensitive items.</p>
                <Link to="/services/express" className="text-purple-600 font-medium hover:underline">Learn more →</Link>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <h3 className="text-lg font-semibold mb-2 text-green-600">Bulk Shipping</h3>
                <p className="mb-4">Efficient solutions for businesses and individuals with multiple packages.</p>
                <Link to="/services/bulk" className="text-green-600 font-medium hover:underline">Learn more →</Link>
              </div>
            </div>
          </>
        );
    }
    
    return (
      <div className="container py-8">
        <div className="mb-6">
          <Link to="/services" className="text-blue-600 hover:underline flex items-center">
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Back to Services
          </Link>
        </div>
        
        {serviceContent}
      </div>
    );
  },
  
  Services: () => (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-4">Our Delivery Services</h1>
      <p className="mb-8">FastGo offers a range of delivery options designed to meet your specific needs, whether you require speed, economy, or volume shipping.</p>
      
      <div className="grid md:grid-cols-3 gap-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-blue-600 text-white p-4">
            <h2 className="text-xl font-semibold">Standard Delivery</h2>
          </div>
          <div className="p-6">
            <p className="mb-4">Our reliable, cost-effective delivery option for non-urgent packages.</p>
            <ul className="mb-6 space-y-2">
              <li className="flex items-start">
                <svg className="h-5 w-5 text-blue-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Same-day delivery
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-blue-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Packages up to 25kg
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-blue-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Real-time tracking
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-blue-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                10% lower than market rates
              </li>
            </ul>
            <div className="text-center">
              <Link to="/services/standard" className="btn bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors">Learn More</Link>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-purple-600 text-white p-4">
            <h2 className="text-xl font-semibold">Express Delivery</h2>
          </div>
          <div className="p-6">
            <p className="mb-4">Our fastest delivery option for time-sensitive packages.</p>
            <ul className="mb-6 space-y-2">
              <li className="flex items-start">
                <svg className="h-5 w-5 text-purple-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Delivery within 2-3 hours
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-purple-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Priority handling
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-purple-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Dedicated delivery partners
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-purple-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Enhanced insurance coverage
              </li>
            </ul>
            <div className="text-center">
              <Link to="/services/express" className="btn bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 transition-colors">Learn More</Link>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-green-600 text-white p-4">
            <h2 className="text-xl font-semibold">Bulk Shipping</h2>
          </div>
          <div className="p-6">
            <p className="mb-4">Efficient solutions for businesses and individuals with multiple packages.</p>
            <ul className="mb-6 space-y-2">
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Volume discounts
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Batch order processing
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Dedicated account manager
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Customizable delivery schedules
              </li>
            </ul>
            <div className="text-center">
              <Link to="/services/bulk" className="btn bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition-colors">Learn More</Link>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-12 bg-gray-50 p-8 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Custom Delivery Solutions</h2>
        <p className="mb-4">Need a specialized delivery solution for your unique requirements? Contact our business team to discuss custom logistics options.</p>
        <div className="text-center">
          <a href="mailto:business@fastgo.com" className="btn bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 transition-colors">Contact Business Team</a>
        </div>
      </div>
      
      <div className="mt-12">
        <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
        
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="font-semibold mb-2">What areas do you service?</h3>
            <p>FastGo currently operates in major metropolitan areas across India, including Delhi, Mumbai, Bangalore, Chennai, Kolkata, Hyderabad, Pune, and Ahmedabad. We continue to expand our service areas regularly.</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="font-semibold mb-2">How quickly can I get my package delivered?</h3>
            <p>With our Express service, deliveries can be completed within 2-3 hours. Standard deliveries are typically completed the same day if ordered before 3:00 PM, or the next business day for later orders.</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="font-semibold mb-2">What items can't be delivered through FastGo?</h3>
            <p>FastGo does not deliver illegal items, hazardous materials, firearms, ammunition, weapons, counterfeit goods, or stolen property. For a complete list, please refer to our Terms of Service.</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="font-semibold mb-2">How do I track my delivery?</h3>
            <p>All FastGo deliveries include real-time tracking. Once your order is placed, you'll receive tracking information that you can access through our app or website.</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="font-semibold mb-2">What if my package is lost or damaged?</h3>
            <p>FastGo offers insurance coverage for all deliveries. Standard deliveries include insurance up to ₹5,000, while Express deliveries include coverage up to ₹10,000. Please contact our customer service team if you experience any issues.</p>
          </div>
        </div>
      </div>
    </div>
  ),
  
  About: () => (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-4">About FastGo</h1>
      
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Our Mission</h2>
        <p className="mb-4">FastGo is revolutionizing the local delivery industry by providing faster, more reliable, and more affordable delivery services for everyone. We connect customers with trusted delivery partners to create a seamless experience that benefits both sides of the marketplace.</p>
        <p>Our mission is to make local delivery accessible to all by cutting out unnecessary costs while maintaining high service quality.</p>
      </section>
      
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Our Story</h2>
        <p className="mb-4">FastGo was founded in 2023 by a team of logistics experts and technology innovators who recognized a gap in the market: existing delivery services were either too expensive or too unreliable.</p>
        <p className="mb-4">Starting with just 20 delivery partners in Bangalore, we've grown to thousands of partners across major cities in India, completing over 100,000 deliveries monthly.</p>
        <p>We built FastGo on the principle that technology can streamline logistics, reduce costs, and improve reliability - creating a better experience for both customers and delivery partners.</p>
      </section>
      
      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">Our Advantage</h2>
          <ul className="space-y-2">
            <li className="flex items-start">
              <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span><strong>Lower Prices:</strong> 10-15% cheaper than major competitors</span>
            </li>
            <li className="flex items-start">
              <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span><strong>Better Technology:</strong> Advanced routing and matching algorithms</span>
            </li>
            <li className="flex items-start">
              <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span><strong>Transparency:</strong> Real-time tracking and clear pricing</span>
            </li>
            <li className="flex items-start">
              <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span><strong>Reliability:</strong> 98% on-time delivery rate</span>
            </li>
            <li className="flex items-start">
              <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span><strong>Partner Friendly:</strong> Higher earnings for delivery partners</span>
            </li>
          </ul>
        </div>
        
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">By The Numbers</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4">
              <div className="text-3xl font-bold text-blue-600 mb-1">5000+</div>
              <div className="text-sm text-gray-600">Delivery Partners</div>
            </div>
            <div className="text-center p-4">
              <div className="text-3xl font-bold text-blue-600 mb-1">15+</div>
              <div className="text-sm text-gray-600">Cities Covered</div>
            </div>
            <div className="text-center p-4">
              <div className="text-3xl font-bold text-blue-600 mb-1">100K+</div>
              <div className="text-sm text-gray-600">Monthly Deliveries</div>
            </div>
            <div className="text-center p-4">
              <div className="text-3xl font-bold text-blue-600 mb-1">4.9/5</div>
              <div className="text-sm text-gray-600">Average Rating</div>
            </div>
          </div>
        </div>
      </div>
      
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">For Partners</h2>
        <p className="mb-4">We believe in treating our delivery partners fairly. By optimizing routes and reducing idle time, our partners earn more while working the same hours. FastGo partners receive:</p>
        <ul className="list-disc pl-8 mb-4">
          <li>Higher share of delivery fees (up to 85% for larger orders)</li>
          <li>Flexible working hours</li>
          <li>User-friendly partner app</li>
          <li>Weekly payments</li>
          <li>Accident insurance coverage</li>
          <li>Partner support team</li>
        </ul>
        <div className="mt-4">
          <Link to="/register" className="btn bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors">Become a Partner</Link>
        </div>
      </section>
      
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Leadership Team</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white p-4 rounded-lg shadow-sm text-center">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-200 rounded-full overflow-hidden flex items-center justify-center text-2xl font-bold text-gray-500">AR</div>
            <h3 className="font-semibold">Arjun Reddy</h3>
            <p className="text-sm text-gray-600">Co-Founder & CEO</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm text-center">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-200 rounded-full overflow-hidden flex items-center justify-center text-2xl font-bold text-gray-500">SM</div>
            <h3 className="font-semibold">Shreya Mehta</h3>
            <p className="text-sm text-gray-600">Co-Founder & COO</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm text-center">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-200 rounded-full overflow-hidden flex items-center justify-center text-2xl font-bold text-gray-500">VK</div>
            <h3 className="font-semibold">Vikram Kumar</h3>
            <p className="text-sm text-gray-600">CTO</p>
          </div>
        </div>
      </section>
      
      <section>
        <h2 className="text-xl font-semibold mb-3">Contact Us</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <p className="mb-4">Have questions or need assistance? We're here to help.</p>
            <div className="space-y-2">
              <p><strong>General Inquiries:</strong> info@fastgo.com</p>
              <p><strong>Customer Support:</strong> support@fastgo.com</p>
              <p><strong>Partner Support:</strong> partners@fastgo.com</p>
              <p><strong>Business Collaborations:</strong> business@fastgo.com</p>
              <p><strong>Phone:</strong> +91 9876543210</p>
            </div>
          </div>
          <div>
            <p className="mb-4">Our Headquarters:</p>
            <address className="not-italic">
              FastGo Technologies Pvt. Ltd.<br />
              3rd Floor, Innovate Tower<br />
              HSR Layout, Sector 2<br />
              Bangalore, Karnataka 560102<br />
              India
            </address>
          </div>
        </div>
      </section>
    </div>
  ),
  
  Contact: () => (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-4">Contact Us</h1>
      
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-3">Get In Touch</h2>
          <p className="mb-6">We're here to help with any questions, concerns, or feedback you may have. Choose the contact method that works best for you.</p>
          
          <div className="space-y-6">
            <div className="flex items-start">
              <div className="bg-blue-100 p-3 rounded-full mr-4">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Email Us</h3>
                <p className="text-gray-600 mb-1">We'll respond within 24 hours</p>
                <div className="space-y-1">
                  <p><strong>General Inquiries:</strong> info@fastgo.com</p>
                  <p><strong>Customer Support:</strong> support@fastgo.com</p>
                  <p><strong>Partner Support:</strong> partners@fastgo.com</p>
                  <p><strong>Business Collaborations:</strong> business@fastgo.com</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-green-100 p-3 rounded-full mr-4">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Call Us</h3>
                <p className="text-gray-600 mb-1">Available 7 days a week, 8 AM - 10 PM</p>
                <p><strong>Customer Service:</strong> +91 9876543210</p>
                <p><strong>Partner Support:</strong> +91 9876543211</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-purple-100 p-3 rounded-full mr-4">
                <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"></path>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Live Chat</h3>
                <p className="text-gray-600 mb-1">Real-time assistance</p>
                <p>Our live chat support is available through the FastGo mobile app.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-red-100 p-3 rounded-full mr-4">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Visit Us</h3>
                <p className="text-gray-600 mb-1">Our Headquarters</p>
                <address className="not-italic">
                  FastGo Technologies Pvt. Ltd.<br />
                  3rd Floor, Innovate Tower<br />
                  HSR Layout, Sector 2<br />
                  Bangalore, Karnataka 560102<br />
                  India
                </address>
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-3">Send us a Message</h2>
          <form className="bg-gray-50 p-6 rounded-lg">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="name">Name</label>
                <input type="text" id="name" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="email">Email</label>
                <input type="email" id="email" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" htmlFor="phone">Phone (optional)</label>
              <input type="tel" id="phone" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" htmlFor="subject">Subject</label>
              <select id="subject" className="w-full px-3 py-2 border border-gray-300 rounded-md">
                <option value="">Select a subject</option>
                <option value="general">General Inquiry</option>
                <option value="support">Customer Support</option>
                <option value="partner">Partner Support</option>
                <option value="feedback">Feedback</option>
                <option value="business">Business Development</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" htmlFor="message">Message</label>
              <textarea id="message" rows="5" className="w-full px-3 py-2 border border-gray-300 rounded-md"></textarea>
            </div>
            
            <div className="mb-4">
              <label className="flex items-center">
                <input type="checkbox" className="form-checkbox" />
                <span className="ml-2 text-sm">I agree to the <Link to="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link></span>
              </label>
            </div>
            
            <button type="submit" className="btn bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors">Send Message</button>
          </form>
          
          <div className="mt-8">
            <h3 className="font-semibold mb-3">Frequently Asked Questions</h3>
            
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h4 className="font-medium mb-1">How do I track my delivery?</h4>
                <p className="text-gray-600 text-sm">You can track your delivery in real-time through the FastGo app or website by entering your order ID.</p>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h4 className="font-medium mb-1">How do I become a delivery partner?</h4>
                <p className="text-gray-600 text-sm">To become a delivery partner, sign up through our app or website and complete the verification process.</p>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h4 className="font-medium mb-1">What if my delivery is late?</h4>
                <p className="text-gray-600 text-sm">If your delivery is late, please contact our customer support team for assistance and we'll resolve the issue promptly.</p>
              </div>
            </div>
            
            <div className="mt-4 text-center">
              <Link to="/services" className="text-blue-600 hover:underline">View more FAQs →</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
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
                    <Route path="/services" element={<StaticPages.Services />} />
                    <Route path="/services/:type" element={<StaticPages.ServiceDetails />} />
                    <Route path="/about" element={<StaticPages.About />} />
                    <Route path="/contact" element={<StaticPages.Contact />} />
                    
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