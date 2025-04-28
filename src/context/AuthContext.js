import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { auth, db } from '../services/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// Create context with default value
const AuthContext = createContext(null);

// Custom hook for easier context consumption
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Convert to useCallback to optimize performance
  const register = useCallback(async (email, password, type, userData) => {
    try {
      setError(null);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user profile in Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        email,
        type, // 'customer' or 'partner'
        ...userData,
        createdAt: new Date().toISOString()
      });
      
      setUserType(type);
      return userCredential.user;
    } catch (error) {
      console.error("Registration error:", error);
      setError(error.message);
      throw error;
    }
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      setError(null);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      try {
        // Get user type from Firestore
        const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
        if (userDoc.exists()) {
          setUserType(userDoc.data().type);
        } else {
          console.warn("User document does not exist for", userCredential.user.uid);
          setError("User profile not found");
        }
      } catch (docError) {
        console.error("Error fetching user document:", docError);
        setError("Error loading user profile: " + docError.message);
        // Continue with login even if document fetch fails
      }
      
      return userCredential.user;
    } catch (error) {
      console.error("Login error:", error);
      setError(error.message);
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    setUserType(null);
    return signOut(auth).catch(error => {
      console.error("Logout error:", error);
      setError(error.message);
    });
  }, []);

  // Handle auth state changes
  useEffect(() => {
    setLoading(true);
    setError(null);
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          setCurrentUser(user);
          
          // Get user type from Firestore
          try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
              setUserType(userDoc.data().type);
            } else {
              console.warn("User document does not exist for", user.uid);
              setUserType(null);
              setError("User profile not found");
            }
          } catch (error) {
            console.error("Error fetching user data:", error);
            setError("Error loading user profile: " + error.message);
            setUserType(null);
          }
        } else {
          setCurrentUser(null);
          setUserType(null);
        }
      } catch (error) {
        console.error("Auth state change error:", error);
        setError("Authentication error: " + error.message);
      } finally {
        setLoading(false);
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Memoize the auth value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    currentUser,
    userType,
    register,
    login,
    logout,
    loading,
    error,
    clearError: () => setError(null)
  }), [currentUser, userType, register, login, logout, loading, error]);

  return (
    <AuthContext.Provider value={value}>
      {!loading ? children : null}
    </AuthContext.Provider>
  );
}