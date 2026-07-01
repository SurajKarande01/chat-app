import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

// Create the global authorization context to hold state across components.
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Local state holding the current active user model and app initialization status.
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Method 1: Check for an existing session token in local storage on app mount.
  // If found, fetch their user details from the `/me` endpoint to log them in automatically.
  useEffect(() => {
    const checkToken = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Fetch currently authenticated user payload from REST API
          const res = await api.get('/auth/me');
          setUser(res.data);
        } catch (err) {
          // Clear invalid tokens from browser storage
          console.error("Token verification failed", err);
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      setLoading(false);
    };
    checkToken();
  }, []);

  // Method 2: Log in a user by verifying their username and password.
  // Stores the signed JWT token in local storage and populates user state details.
  const login = async (username, password) => {
    const res = await api.post('/auth/login', { username, password });
    const { token, ...userData } = res.data;
    
    // Persist jwt token for future axios request interceptors
    localStorage.setItem('token', token);
    setUser(userData);
    
    return userData;
  };

  // Method 3: Sign up a new user account.
  // Sends the signup details including chosen avatar theme class to the authentication API.
  const register = async (username, password, displayName, avatarColor) => {
    await api.post('/auth/register', { username, password, displayName, avatarColor });
  };

  // Method 4: Log out the active user session.
  // Wipes local storage tokens and resets the global user context state.
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// Export hook to allow child components to easily read and write user contexts.
export const useAuth = () => useContext(AuthContext);
