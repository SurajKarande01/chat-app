import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import ChatRoom from './components/ChatRoom';

// This is the router controller content element.
// It tracks loading status, authorization tokens, and renders the appropriate screen.
function AppContent() {
  const { user, loading, login, register } = useAuth();
  
  // Basic routing state selector to switch between signup and login cards.
  const [currentView, setCurrentView] = useState('login'); // 'login' | 'register'

  // Method 1: Render a clean loading indicator while verifying JWT session on mount.
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F0E9] flex flex-col items-center justify-center text-[#3A3A3A] font-sans">
        <div className="w-12 h-12 border-4 border-[#7D8F7C]/20 border-t-[#7D8F7C] rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold tracking-wide">Loading Chat application...</p>
      </div>
    );
  }

  // Method 2: Router selector checks if a user is logged in.
  // If not authenticated, render Login or Register components.
  if (!user) {
    if (currentView === 'login') {
      return (
        <Login 
          onLogin={login} 
          onNavigateToRegister={() => setCurrentView('register')} 
        />
      );
    } else {
      return (
        <Register 
          onRegister={register} 
          onNavigateToLogin={() => setCurrentView('login')} 
        />
      );
    }
  }

  // Method 3: If session is successfully logged in, redirect user to main ChatRoom workspace view.
  return <ChatRoom />;
}

// App wrapper setting up global context provider trees.
export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
