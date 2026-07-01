import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import ChatRoom from './components/ChatRoom';

function AppContent() {
  const { user, loading, login, register } = useAuth();
  const [currentView, setCurrentView] = useState('login'); // 'login' | 'register'

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium tracking-wide">Loading Chat application...</p>
      </div>
    );
  }

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

  return <ChatRoom />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
