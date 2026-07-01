import React, { useState } from 'react';

// A simple list of avatar colors that the user can pick from when signing up.
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

// This is the registration view where new users can sign up and choose their profile color.
export default function Register({ onRegister, onNavigateToLogin }) {
  // Define local states for form fields, alerts, and loading status.
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedColor, setSelectedColor] = useState('indigo-500');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // This handles validating the user inputs and calling the API registration method.
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check that none of the required inputs are blank.
    if (!username.trim() || !password.trim() || !displayName.trim()) {
      setError('Please fill in all the required fields.');
      return;
    }
    
    // Basic password length validation.
    if (password.length < 6) {
      setError('Password needs to be at least 6 characters long.');
      return;
    }
    
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      // Execute the parent's registration API call.
      await onRegister(username.trim(), password, displayName.trim(), selectedColor);
      setSuccess('Your account was created! Redirecting to login page...');
      
      // Navigate to the login page after a brief delay so the user can read the success message.
      setTimeout(() => {
        onNavigateToLogin();
      }, 1500);
    } catch (err) {
      // Display the server's error message.
      setError(err.response?.data?.message || 'Failed to create your account.');
    } finally {
      // Set the loading indicator back to false.
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F3F0E9] p-4 font-sans">
      <div className="w-full max-w-sm bg-[#FAF9F5] border border-[#E5E1D8] rounded-md p-6 shadow-sm">
        
        {/* Simple Header */}
        <div className="text-center mb-5">
          <h2 className="text-2xl font-bold text-[#3A3A3A]">Create Account</h2>
          <p className="text-[#6A6A6A] text-sm mt-1">Sign up to get access to real-time chat rooms.</p>
        </div>

        {/* Basic Error Alert */}
        {error && (
          <div className="mb-4 p-3 bg-[#FDF2F2] border border-[#FBD5D5] text-[#9B1C1C] text-sm rounded-md">
            {error}
          </div>
        )}

        {/* Basic Success Alert */}
        {success && (
          <div className="mb-4 p-3 bg-[#EDF4EC] border border-[#C3DCC1] text-[#2E4E2C] text-sm rounded-md">
            {success}
          </div>
        )}

        {/* Simple Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[#4A4A4A] text-sm font-semibold mb-1">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full px-3 py-2 border border-[#E5E1D8] rounded-md text-[#3A3A3A] focus:outline-none focus:border-[#7D8F7C] text-sm bg-[#F3F0E9]/55"
              required
            />
          </div>

          <div>
            <label className="block text-[#4A4A4A] text-sm font-semibold mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. john_doe"
              className="w-full px-3 py-2 border border-[#E5E1D8] rounded-md text-[#3A3A3A] focus:outline-none focus:border-[#7D8F7C] text-sm bg-[#F3F0E9]/55"
              required
            />
          </div>

          <div>
            <label className="block text-[#4A4A4A] text-sm font-semibold mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              className="w-full px-3 py-2 border border-[#E5E1D8] rounded-md text-[#3A3A3A] focus:outline-none focus:border-[#7D8F7C] text-sm bg-[#F3F0E9]/55"
              required
            />
          </div>

          {/* Simple Color Picker Grid */}
          <div>
            <label className="block text-[#4A4A4A] text-sm font-semibold mb-2">
              Select Avatar Color
            </label>
            <div className="grid grid-cols-8 gap-2 p-2 border border-[#E5E1D8] rounded-md bg-[#FAF9F5]">
              {AVATAR_COLORS.map((color) => (
                <button
                  key={color.class}
                  type="button"
                  onClick={() => setSelectedColor(color.class)}
                  style={{ backgroundColor: color.hex }}
                  className={`w-6 h-6 rounded-full cursor-pointer focus:outline-none ${
                    selectedColor === color.class ? 'border-2 border-[#3A3A3A] ring-1 ring-white' : 'opacity-80 hover:opacity-100'
                  }`}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-[#7D8F7C] hover:bg-[#6D7F6C] text-white font-bold rounded-md text-sm transition-colors disabled:bg-[#BAC7B9] cursor-pointer mt-2"
          >
            {loading ? 'Creating...' : 'Register'}
          </button>
        </form>

        {/* Back to Login link */}
        <div className="mt-5 text-center text-sm text-[#6A6A6A]">
          Already have an account?{' '}
          <button
            onClick={onNavigateToLogin}
            className="text-[#7D8F7C] hover:underline font-semibold focus:outline-none cursor-pointer"
          >
            Sign in
          </button>
        </div>

      </div>
    </div>
  );
}
