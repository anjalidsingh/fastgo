import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../services/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function register(email, password, type, userData) {
    try {
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
      throw error;
    }
  }

  async function login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      try {
        // Get user type from Firestore
        const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
        if (userDoc.exists()) {
          setUserType(userDoc.data().type);
        } else {
          console.warn("User document does not exist for", userCredential.user.uid);
        }
      } catch (docError) {
        console.error("Error fetching user document:", docError);
        // Continue with login even if document fetch fails
      }
      
      return userCredential.user;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }

  function logout() {
    setUserType(null);
    return signOut(auth);
  }

  useEffect(() => {
    setError(null);
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Get user type from Firestore
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            setUserType(userDoc.data().type);
          } else {
            console.warn("User document does not exist for", user.uid);
            setUserType(null);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setError("Permission error: " + error.message);
          // Continue without user type
          setUserType(null);
        }
      } else {
        setUserType(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userType,
    register,
    login,
    logout,
    loading,
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}