import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';

function CustomerProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profileDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (profileDoc.exists()) {
          const profileData = profileDoc.data();
          setProfile(profileData);
          setName(profileData.name || '');
          setPhone(profileData.phone || '');
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching profile:', error);
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      setUpdateLoading(true);
      
      await updateDoc(doc(db, 'users', currentUser.uid), {
        name,
        phone,
        updatedAt: new Date().toISOString()
      });
      
      setProfile({
        ...profile,
        name,
        phone,
        updatedAt: new Date().toISOString()
      });
      
      setIsEditing(false);
    } catch (error) {
      setError('Failed to update profile: ' + error.message);
    } finally {
      setUpdateLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="form-container">
      <h2 className="form-title">Customer Profile</h2>
      
      {error && <div className="form-error">{error}</div>}
      
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
          
          <div className="form-submit">
            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateLoading}
                className="btn"
              >
                {updateLoading ? 'Updating...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div>
          <div className="mb-6">
            <h3 className="font-semibold mb-4">Account Information</h3>
            <div className="grid gap-4">
              <div>
                <span className="text-gray block">Full Name:</span>
                <span className="font-medium">{profile.name}</span>
              </div>
              <div>
                <span className="text-gray block">Email:</span>
                <span className="font-medium">{profile.email}</span>
              </div>
              <div>
                <span className="text-gray block">Phone Number:</span>
                <span className="font-medium">{profile.phone}</span>
              </div>
              <div>
                <span className="text-gray block">Account Type:</span>
                <span className="font-medium capitalize">{profile.type}</span>
              </div>
              <div>
                <span className="text-gray block">Member Since:</span>
                <span className="font-medium">
                  {new Date(profile.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => setIsEditing(true)}
            className="btn"
          >
            Edit Profile
          </button>
        </div>
      )}
    </div>
  );
}

export default CustomerProfile;
