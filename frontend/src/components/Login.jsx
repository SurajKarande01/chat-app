import React, { useState } from 'react';

// This is a simple login component designed to capture the user's username and password.
// It displays a basic form and reports any authentication errors.
export default function Login({ onLogin, onNavigateToRegister }) {
  // We use standard React state hooks to keep track of the form inputs and state.
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // This handles the form submission when the user clicks the "Sign In" button.
  // It checks for basic validation and calls the parent's onLogin helper.
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if the user filled in all fields before sending the API request.
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }
    
    setError('');
    setLoading(true);
    
    try {
      // Call the login callback provided by the parent app.
      await onLogin(username.trim(), password);
    } catch (err) {
      // If something goes wrong, show the error message from the backend.
      setError(err.response?.data?.message || 'Invalid username or password.');
    } finally {
      // Reset the loading spinner state once done.
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F3F0E9] p-4 font-sans">
      <div className="w-full max-w-sm bg-[#FAF9F5] border border-[#E5E1D8] rounded-md p-6 shadow-sm">
        
        {/* Simple Title Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-[#3A3A3A]">Chat-App Login</h2>
          <p className="text-[#6A6A6A] text-sm mt-1">Please enter your account details to start chatting.</p>
        </div>

        {/* Basic Error Box */}
        {error && (
          <div className="mb-4 p-3 bg-[#FDF2F2] border border-[#FBD5D5] text-[#9B1C1C] text-sm rounded-md">
            {error}
          </div>
        )}

        {/* Standard Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[#4A4A4A] text-sm font-semibold mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. john_doe"
              className="w-full px-3 py-2 border border-[#E5E1D8] rounded-md text-[#3A3A3A] focus:outline-none focus:border-[#7D8F7C] focus:ring-1 focus:ring-[#7D8F7C]/20 text-sm bg-[#F3F0E9]/55"
              required
            />
          </div>

          <div>
            <label className="block text-[#4A4A4A] text-sm font-semibold mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              className="w-full px-3 py-2 border border-[#E5E1D8] rounded-md text-[#3A3A3A] focus:outline-none focus:border-[#7D8F7C] focus:ring-1 focus:ring-[#7D8F7C]/20 text-sm bg-[#F3F0E9]/55"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-[#7D8F7C] hover:bg-[#6D7F6C] text-white font-bold rounded-md text-sm transition-colors disabled:bg-[#BAC7B9] cursor-pointer"
          >
            {loading ? 'Logging in...' : 'Sign In'}
          </button>
        </form>

        {/* Link to go to the Register view */}
        <div className="mt-6 text-center text-sm text-[#6A6A6A]">
          New to Chat-App?{' '}
          <button
            onClick={onNavigateToRegister}
            className="text-[#7D8F7C] hover:underline font-semibold focus:outline-none cursor-pointer"
          >
            Register here
          </button>
        </div>

      </div>
    </div>
  );
}
