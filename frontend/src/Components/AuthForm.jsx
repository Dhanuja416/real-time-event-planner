import React, { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = 'https://localhost:7072/api/Auth';

const AuthForm = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const endpoint = isLogin ? 'login' : 'register';
    const authData = { email, password };

    try {
      const response = await axios.post(`${API_BASE_URL}/${endpoint}`, authData);

      if (isLogin) {
        // SUCCESS: Store the JWT token and notify the main App component
        const token = response.data.token;
        localStorage.setItem('jwtToken', token);
        onAuthSuccess(token);
        setMessage('Login successful! Welcome.');
      } else {
        // SUCCESS: Registration is complete, switch to login view
        setMessage('Registration successful! Please log in.');
        setIsLogin(true);
      }
    } catch (error) {
      console.error('Auth Error:', error.response || error);
      const msg = error.response?.data?.Message || 'Authentication failed. Check credentials.';
      setMessage(`Error: ${msg}`);
      onAuthSuccess(null);
      localStorage.removeItem('jwtToken');
    } finally {
      setLoading(false);
      setPassword(''); // Clear password field for security
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <h2 className="text-3xl font-bold mb-6 text-gray-100">{isLogin ? 'Login' : 'Register'}</h2>
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        {/* Email Field */}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full p-3 rounded-lg bg-gray-700 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {/* Password Field */}
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full p-3 rounded-lg bg-gray-700 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Status/Error Message */}
        {message && (
          <div className={`p-3 rounded-lg text-sm font-medium ${message.startsWith('Error') ? 'bg-red-900 text-red-300' : 'bg-green-900 text-green-300'}`}>
            {message}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition duration-150 disabled:opacity-50"
        >
          {loading ? 'Processing...' : isLogin ? 'Log In' : 'Register'}
        </button>
      </form>

      {/* Switch Link */}
      <button
        onClick={() => setIsLogin(!isLogin)}
        className="mt-4 text-sm text-blue-400 hover:text-blue-300 transition duration-150"
        disabled={loading}
      >
        {isLogin ? "Need an account? Register" : "Already have an account? Log In"}
      </button>
    </div>
  );
};

export default AuthForm;