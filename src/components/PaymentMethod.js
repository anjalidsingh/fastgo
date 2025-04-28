import React, { useState, useEffect } from 'react';

function PaymentMethod({ onPaymentMethodSelect, selectedPaymentMethod }) {
  const [showUnavailableMessage, setShowUnavailableMessage] = useState(false);
  const [animation, setAnimation] = useState('');
  
  useEffect(() => {
    // Initially show animation for the selected method
    if (selectedPaymentMethod) {
      setAnimation(selectedPaymentMethod);
    }
  }, []);
  
  const handlePaymentMethodSelect = (method) => {
    if (method === 'cod') {
      onPaymentMethodSelect(method);
      setAnimation(method);
      setShowUnavailableMessage(false);
    } else {
      setShowUnavailableMessage(true);
      
      // Play subtle shake animation
      setAnimation('shake');
      setTimeout(() => {
        setAnimation('');
      }, 500);
      
      // Hide message after 3 seconds
      setTimeout(() => {
        setShowUnavailableMessage(false);
      }, 3000);
    }
  };
  
  return (
    <div className="payment-method-section">
      <h3 className="section-title">Payment Method</h3>
      
      {showUnavailableMessage && (
        <div className="form-error">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="form-error-icon">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          This payment method is coming soon. Please use Cash on Delivery for now.
        </div>
      )}
      
      <div className="payment-methods">
        <div 
          className={`payment-method-option ${selectedPaymentMethod === 'cod' ? 'selected' : ''} ${animation === 'cod' ? 'animate-pulse' : ''}`}
          onClick={() => handlePaymentMethodSelect('cod')}
        >
          <div className="payment-method-icon">
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="6" width="20" height="12" rx="2"></rect>
              <circle cx="12" cy="12" r="2"></circle>
              <path d="M6 12h.01M18 12h.01"></path>
            </svg>
          </div>
          <div className="payment-method-details">
            <h4>Cash on Delivery</h4>
            <p>Pay with cash when your package arrives</p>
          </div>
          <div className="payment-method-status">
            <div className="payment-method-radio">
              <div className={`radio-inner ${selectedPaymentMethod === 'cod' ? 'active' : ''}`}></div>
            </div>
          </div>
        </div>
        
        <div 
          className={`payment-method-option disabled ${animation === 'shake' ? 'animate-shake' : ''}`}
          onClick={() => handlePaymentMethodSelect('card')}
        >
          <div className="payment-method-icon">
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
              <line x1="1" y1="10" x2="23" y2="10"></line>
            </svg>
          </div>
          <div className="payment-method-details">
            <h4>Debit/Credit Card</h4>
            <p>Pay securely with your card</p>
            <span className="coming-soon-badge">Coming Soon</span>
          </div>
          <div className="payment-method-status">
            <div className="payment-method-radio disabled"></div>
          </div>
        </div>
        
        <div 
          className={`payment-method-option disabled ${animation === 'shake' ? 'animate-shake' : ''}`}
          onClick={() => handlePaymentMethodSelect('upi')}
        >
          <div className="payment-method-icon">
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5l10-5l-10-5z"></path>
              <path d="M2 17l10 5l10-5"></path>
              <path d="M2 12l10 5l10-5"></path>
            </svg>
          </div>
          <div className="payment-method-details">
            <h4>UPI / Google Pay</h4>
            <p>Pay using UPI apps like GPay, PhonePe</p>
            <span className="coming-soon-badge">Coming Soon</span>
          </div>
          <div className="payment-method-status">
            <div className="payment-method-radio disabled"></div>
          </div>
        </div>
        
        <div 
          className={`payment-method-option disabled ${animation === 'shake' ? 'animate-shake' : ''}`}
          onClick={() => handlePaymentMethodSelect('wallet')}
        >
          <div className="payment-method-icon">
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="5" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="2" y1="10" x2="22" y2="10"></line>
            </svg>
          </div>
          <div className="payment-method-details">
            <h4>Wallet</h4>
            <p>Pay using your FastGo wallet balance</p>
            <span className="coming-soon-badge">Coming Soon</span>
          </div>
          <div className="payment-method-status">
            <div className="payment-method-radio disabled"></div>
          </div>
        </div>
      </div>
      
      {/* Add these animation styles to your main.css file instead of using style jsx */}
    </div>
  );
}

export default PaymentMethod;