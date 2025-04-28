import React, { Component } from 'react';
import { logAnalyticsEvent } from '../services/firebase';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render shows the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console and analytics
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    
    // Track in analytics
    logAnalyticsEvent('error_boundary_triggered', {
      error: error.toString(),
      component: this.props.componentName || 'Unknown',
      stack: error.stack ? error.stack.toString().substring(0, 500) : 'No stack trace',
    });
    
    // Update state with error details
    this.setState({
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({ 
      hasError: false,
      error: null,
      errorInfo: null
    });
  }

  render() {
    if (this.state.hasError) {
      // Render custom fallback UI or the provided fallback prop
      return this.props.fallback || (
        <div className="error-boundary p-4 m-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center mb-4">
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 mr-3">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <h2 className="text-lg font-semibold text-gray-800">Something went wrong</h2>
          </div>
          
          <p className="text-gray-600 mb-4">
            We apologize for the inconvenience. Please try refreshing the page or contact support if the issue persists.
          </p>
          
          {process.env.NODE_ENV === 'development' && (
            <details className="mb-4">
              <summary className="cursor-pointer text-sm text-blue-600 mb-2">Technical Details</summary>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                {this.state.error && this.state.error.toString()}
                <br />
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
          
          <div className="flex space-x-3">
            <button
              onClick={this.handleReset}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Try Again
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    // When there's no error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary;