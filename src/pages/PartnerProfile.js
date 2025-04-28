import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, collection, query, where, orderBy, getDocs, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

function PartnerProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [error, setError] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const { currentUser } = useAuth();
  
  // Rating related states
  const [recentRatings, setRecentRatings] = useState([]);
  const [ratingStats, setRatingStats] = useState({
    average: 0,
    total: 0,
    distribution: {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
  });
  const [loadingRatings, setLoadingRatings] = useState(true);

  // Use real-time listener for profile data
  useEffect(() => {
    if (!currentUser) return;
    
    const userDocRef = doc(db, 'users', currentUser.uid);
    
    // Set up real-time listener
    const unsubscribe = onSnapshot(userDocRef, 
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const profileData = docSnapshot.data();
          setProfile(profileData);
          setName(profileData.name || '');
          setPhone(profileData.phone || '');
          setVehicleType(profileData.vehicleType || '');
          setLicenseNumber(profileData.licenseNumber || '');
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching profile:', error);
        setError('Error loading profile: ' + error.message);
        setLoading(false);
      }
    );
    
    // Clean up listener on unmount
    return () => unsubscribe();
  }, [currentUser]);
  
  // Use real-time listener for ratings data
  useEffect(() => {
    if (!currentUser) return;
    
    setLoadingRatings(true);
    
    // Set up real-time listener for ratings
    const ratingsQuery = query(
      collection(db, 'ratings'),
      where('partnerId', '==', currentUser.uid),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
    
    const unsubscribe = onSnapshot(ratingsQuery, 
      (querySnapshot) => {
        const ratingsData = [];
        
        // Reset distribution for each update
        const distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0};
        
        querySnapshot.forEach(doc => {
          const rating = doc.data();
          
          // Handle timestamp conversion properly
          let createdAtDate;
          if (rating.createdAt) {
            if (rating.createdAt.toDate) {
              // Firebase Timestamp
              createdAtDate = rating.createdAt.toDate();
            } else {
              // Regular Date object or string
              createdAtDate = new Date(rating.createdAt);
            }
          } else {
            createdAtDate = new Date();
          }
          
          ratingsData.push({
            id: doc.id,
            ...rating,
            createdAt: createdAtDate
          });
          
          // Update distribution (ensure rating is treated as a number)
          const ratingValue = Number(rating.rating);
          if (ratingValue >= 1 && ratingValue <= 5) {
            // Use Math.round to properly categorize ratings
            distribution[Math.round(ratingValue)]++;
          }
        });
        
        setRecentRatings(ratingsData);
        
        // If we have a profile with rating data, update the rating stats
        if (profile && (profile.rating !== undefined || profile.totalRatings !== undefined)) {
          setRatingStats({
            average: profile.rating || 0,
            total: profile.totalRatings || 0,
            distribution
          });
        }
        
        setLoadingRatings(false);
      },
      (error) => {
        console.error('Error fetching ratings:', error);
        setError('Error loading ratings: ' + error.message);
        setLoadingRatings(false);
      }
    );
    
    // Clean up listener on unmount
    return () => unsubscribe();
  }, [currentUser, profile]);  // Include profile as a dependency to update when profile changes

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      setUpdateLoading(true);
      
      await updateDoc(doc(db, 'users', currentUser.uid), {
        name,
        phone,
        vehicleType,
        licenseNumber,
        updatedAt: new Date()  // Use Date object directly, not string
      });
      
      // No need to manually update the profile state here
      // The onSnapshot listener will update it automatically
      
      setIsEditing(false);
    } catch (error) {
      setError('Failed to update profile: ' + error.message);
    } finally {
      setUpdateLoading(false);
    }
  };
  
  // Format date function with improved error handling
  const formatDate = (date) => {
    if (!date) return 'N/A';
    
    try {
      // Handle different date formats
      const dateObj = date instanceof Date ? date : new Date(date);
      
      // Check if date is valid
      if (isNaN(dateObj.getTime())) {
        return 'N/A';
      }
      
      return dateObj.toLocaleDateString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  };
  
  // Calculate distribution percentage
  const calculatePercentage = (count) => {
    if (ratingStats.total === 0) return 0;
    return Math.round((count / ratingStats.total) * 100);
  };

  if (loading) {
    return (
      <div className="loading">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h2 className="profile-title">Partner Profile</h2>
        
        {isEditing ? (
          <button
            onClick={() => setIsEditing(false)}
            className="btn btn-outline"
          >
            Cancel
          </button>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="btn"
          >
            Edit Profile
          </button>
        )}
      </div>
      
      {error && <div className="form-error">{error}</div>}
      
      <div className="profile-content">
        <div className="profile-main">
          {isEditing ? (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  value={profile.email}
                  className="form-input"
                  disabled
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Vehicle Type</label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="form-select"
                  required
                >
                  <option value="">Select Vehicle Type</option>
                  <option value="bike">Bike</option>
                  <option value="scooter">Scooter</option>
                  <option value="car">Car</option>
                  <option value="van">Van</option>
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">License Number</label>
                <input
                  type="text"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
              
              <div className="form-submit">
                <button
                  type="submit"
                  disabled={updateLoading}
                  className="btn btn-full"
                >
                  {updateLoading ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-details">
              <div className="profile-section">
                <h3 className="profile-section-title">Personal Information</h3>
                
                <div className="profile-avatar-large">
                  {name ? name.charAt(0).toUpperCase() : 'P'}
                </div>
                
                <div className="profile-info-grid">
                  <div className="profile-info-item">
                    <span className="profile-info-label">Full Name</span>
                    <span className="profile-info-value">{name || 'Not provided'}</span>
                  </div>
                  
                  <div className="profile-info-item">
                    <span className="profile-info-label">Email</span>
                    <span className="profile-info-value">{profile.email}</span>
                  </div>
                  
                  <div className="profile-info-item">
                    <span className="profile-info-label">Phone Number</span>
                    <span className="profile-info-value">{phone || 'Not provided'}</span>
                  </div>
                  
                  <div className="profile-info-item">
                    <span className="profile-info-label">Member Since</span>
                    <span className="profile-info-value">{formatDate(profile.createdAt)}</span>
                  </div>
                </div>
              </div>
              
              <div className="profile-section">
                <h3 className="profile-section-title">Vehicle Details</h3>
                <div className="profile-info-grid">
                  <div className="profile-info-item">
                    <span className="profile-info-label">Vehicle Type</span>
                    <span className="profile-info-value capitalize">{vehicleType || 'Not provided'}</span>
                  </div>
                  
                  <div className="profile-info-item">
                    <span className="profile-info-label">License Number</span>
                    <span className="profile-info-value">{licenseNumber || 'Not provided'}</span>
                  </div>
                </div>
              </div>
              
              <div className="profile-section">
                <h3 className="profile-section-title">Account Status</h3>
                <div className="profile-status">
                  <div className={`status-badge ${profile.isAvailable ? 'status-active' : 'status-inactive'}`}>
                    {profile.isAvailable ? 'Available for Deliveries' : 'Not Available'}
                  </div>
                  
                  <p className="profile-status-note">
                    You can change your availability status from the partner dashboard.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="profile-sidebar">
          <div className="profile-section">
            <h3 className="profile-section-title">Performance Stats</h3>
            
            <div className="stats-summary mb-4">
              <div className="stats-summary-item">
                <span className="stats-summary-label">Total Deliveries</span>
                <span className="stats-summary-value">{profile.totalDeliveries || 0}</span>
              </div>
              
              <div className="stats-summary-item">
                <span className="stats-summary-label">Average Rating</span>
                <div className="stats-rating">
                  <span className="stats-rating-value">
                    {typeof ratingStats.average === 'number' ? ratingStats.average.toFixed(1) : '0.0'}
                  </span>
                  <div className="stats-rating-stars">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span 
                        key={star} 
                        className={`rating-star ${star <= ratingStats.average ? 'active' : star <= Math.ceil(ratingStats.average) && star > ratingStats.average ? 'half-active' : ''}`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="stats-rating-count">({ratingStats.total})</span>
                </div>
              </div>
            </div>
            
            <div className="rating-distribution">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="rating-bar">
                  <div className="rating-bar-label">{rating} ★</div>
                  <div className="rating-bar-track">
                    <div 
                      className="rating-bar-fill"
                      style={{ width: `${calculatePercentage(ratingStats.distribution[rating])}%` }}
                    ></div>
                  </div>
                  <div className="rating-bar-count">{ratingStats.distribution[rating]}</div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="profile-section">
            <h3 className="profile-section-title">Recent Feedback</h3>
            
            {loadingRatings ? (
              <div className="text-center py-4">
                <LoadingSpinner size="small" />
              </div>
            ) : recentRatings.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray">No ratings yet.</p>
              </div>
            ) : (
              <div className="rating-list">
                {recentRatings.map((rating) => (
                  <div key={rating.id} className="rating-item">
                    <div className="rating-item-header">
                      <div className="rating-item-stars">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span key={star} className={`rating-star ${star <= rating.rating ? 'active' : ''}`}>★</span>
                        ))}
                      </div>
                      <div className="rating-item-date">{formatDate(rating.createdAt)}</div>
                    </div>
                    
                    {rating.comment && (
                      <div className="rating-item-comment">
                        "{rating.comment}"
                      </div>
                    )}
                    
                    <div className="rating-item-order">
                      Order ID: {rating.orderId.substring(0, 8)}...
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PartnerProfile;