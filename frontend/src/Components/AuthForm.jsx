import React, { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = 'https://localhost:7072/api/Auth';

const AuthForm = ({ onAuthSuccess, theme }) => { // 🎯 Receives theme
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
        const token = response.data.token;
        localStorage.setItem('jwtToken', token);
        onAuthSuccess(token);
        setMessage('Login successful! Welcome.');
      } else {
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
      setPassword(''); 
    }
  };

  const inputClasses = "w-full p-3 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300 dark:border-gray-600";
  const headerTextColor = theme === 'dark' ? 'text-gray-100' : 'text-gray-800';

  return (
    <div className="flex flex-col items-center justify-center p-8 md:p-12">
      <h2 className={`text-4xl font-extrabold mb-8 ${headerTextColor}`}>{isLogin ? 'Welcome Back' : 'Get Started'}</h2>
      <form onSubmit={handleSubmit} className="w-full space-y-5">
        
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClasses} />
        
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required className={inputClasses} />

        {/* Status/Error Message */}
        {message && (
          <div className={`p-3 rounded-lg text-sm font-medium border ${message.startsWith('Error') ? 'bg-red-50 border-red-500 text-red-700 dark:bg-red-900 dark:text-red-300 dark:border-red-700' : 'bg-green-50 border-green-500 text-green-700 dark:bg-green-900 dark:text-green-300 dark:border-green-700'}`}>
            {message}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-lg bg-blue-600 text-white font-semibold shadow-md shadow-blue-500/50 hover:bg-blue-700 transition duration-150 disabled:opacity-50 text-lg"
        >
          {loading ? 'Processing...' : isLogin ? 'Log In' : 'Register'}
        </button>
      </form>

      {/* Switch Link */}
      <button
        onClick={() => setIsLogin(!isLogin)}
        className="mt-6 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition duration-150"
        disabled={loading}
      >
        {isLogin ? "Don't have an account? Register Now" : "Already have an account? Log In"}
      </button>
    </div>
  );
};

export default AuthForm;