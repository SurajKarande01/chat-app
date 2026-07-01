import React, { useState } from 'react';
import { UserPlus, User, Lock, MessageSquareCode, Palette } from 'lucide-react';

const AVATAR_COLORS = [
  { name: 'Indigo', class: 'indigo-500', hex: '#6366f1' },
  { name: 'Pink', class: 'pink-500', hex: '#ec4899' },
  { name: 'Emerald', class: 'emerald-500', hex: '#10b981' },
  { name: 'Amber', class: 'amber-500', hex: '#f59e0b' },
  { name: 'Cyan', class: 'cyan-500', hex: '#06b6d4' },
  { name: 'Violet', class: 'violet-500', hex: '#8b5cf6' },
  { name: 'Rose', class: 'rose-500', hex: '#f43f5e' },
  { name: 'Teal', class: 'teal-500', hex: '#14b8a6' },
];

export default function Register({ onRegister, onNavigateToLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedColor, setSelectedColor] = useState('indigo-500');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password || !displayName) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await onRegister(username, password, displayName, selectedColor);
      setSuccess('Account created successfully! Redirecting...');
      setTimeout(() => {
        onNavigateToLogin();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-900/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-900/20 rounded-full blur-3xl" />

      <div className="w-full max-w-md bg-slate-900/70 border border-slate-800 backdrop-blur-xl rounded-2xl p-8 shadow-2xl relative z-10">
        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-4 animate-pulse">
            <MessageSquareCode className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-200 via-slate-100 to-purple-200 bg-clip-text text-transparent">
            Create Account
          </h2>
          <p className="text-slate-400 mt-2 text-sm text-center">
            Sign up to start your real-time chat experience.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-4 bg-red-950/50 border border-red-500/30 text-red-200 text-sm rounded-xl flex items-center">
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="mb-4 p-4 bg-emerald-950/50 border border-emerald-500/30 text-emerald-200 text-sm rounded-xl flex items-center">
            <span>{success}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1 font-semibold">Display Name</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <User className="h-5 w-5" />
              </span>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="John Doe"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-slate-100 placeholder-slate-600 outline-none transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1 font-semibold">Username</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <User className="h-5 w-5" />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="john_doe"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-slate-100 placeholder-slate-600 outline-none transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1 font-semibold">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Lock className="h-5 w-5" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-slate-100 placeholder-slate-600 outline-none transition-all"
                required
              />
            </div>
          </div>

          {/* Theme / Avatar Color Picker */}
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2 flex items-center space-x-1 font-semibold">
              <Palette className="w-4 h-4 text-indigo-400" />
              <span>Avatar Theme Color</span>
            </label>
            <div className="grid grid-cols-8 gap-2 bg-slate-950/40 border border-slate-800/80 rounded-xl p-3">
              {AVATAR_COLORS.map((color) => (
                <button
                  key={color.class}
                  type="button"
                  onClick={() => setSelectedColor(color.class)}
                  style={{ backgroundColor: color.hex }}
                  className={`w-7 h-7 rounded-full transition-all focus:outline-none cursor-pointer hover:scale-110 relative ${
                    selectedColor === color.class ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-105' : 'opacity-70 hover:opacity-100'
                  }`}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium rounded-xl shadow-lg shadow-indigo-650/20 hover:shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all disabled:opacity-50 cursor-pointer mt-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <UserPlus className="h-5 w-5" />
                <span>Create Account</span>
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <button
            onClick={onNavigateToLogin}
            className="text-indigo-400 hover:text-indigo-300 font-semibold transition-all focus:outline-none cursor-pointer"
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}
