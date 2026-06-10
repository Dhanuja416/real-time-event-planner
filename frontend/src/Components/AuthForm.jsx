import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7072';
const API_BASE_URL = `${API_BASE}/api/Auth`;

const AuthForm = ({ onAuthSuccess }) => {
  const navigate = useNavigate();
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
        setMessage('Welcome back. Your planner has loaded.');
      } else {
        setMessage('Account registered. You may now log in instantly.');
        setEmail('');
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

  const inputClasses = "w-full p-3.5 rounded-xl glass-input placeholder-sand-light/40 text-sm tracking-wide";
  const labelClasses = "block text-xs uppercase tracking-widest font-semibold text-gold-light/85 mb-1.5 ml-1";

  return (
    <div className="flex flex-col items-center justify-center p-8 md:p-12 animate-fade-in">
      <div className="text-center mb-10">
        <span className="text-xs uppercase tracking-widest text-gold-light/75 font-semibold">REAP Collaboration</span>
        <h2 className="text-4xl font-serif font-bold text-luxury-gradient mt-2 tracking-wide">
          {isLogin ? 'Sign In' : 'Create Account'}
        </h2>
        <p className="text-xs text-sand-light/70 dark:text-sand-light/60 mt-1 max-w-xs mx-auto">
          {isLogin ? 'Enter your credentials to access your secure workspace.' : 'Register to begin collaborating in real-time.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full space-y-6">
        <div>
          <label className={labelClasses}>Email Address</label>
          <input 
            type="email" 
            placeholder="name@example.com" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            className={inputClasses} 
          />
        </div>
        
        <div>
          <label className={labelClasses}>Password</label>
          <input 
            type="password" 
            placeholder="••••••••" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            className={inputClasses} 
          />
        </div>

        {/* Status/Error Message */}
        {message && (
          <div className={`p-4 rounded-xl text-xs font-semibold tracking-wide border leading-relaxed ${
            message.startsWith('Error') 
              ? 'bg-red-950/20 border-red-500/30 text-red-400' 
              : 'bg-gold-glass border-gold-light/20 text-gold-light'
          }`}>
            {message}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-luxury-gold-button font-serif tracking-widest text-sm uppercase transition-all duration-300 disabled:opacity-50"
        >
          {loading ? 'Processing...' : isLogin ? 'Log In' : 'Register'}
        </button>
      </form>

      {/* Forgot Password Link - Only show on login */}
      {isLogin && (
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/forgot-password')}
            className="text-xs text-gold-light/80 hover:text-gold-light hover:underline transition duration-150 tracking-wider uppercase font-semibold"
            disabled={loading}
          >
            Forgot your password?
          </button>
        </div>
      )}

      {/* Switch Link */}
      <button
        onClick={() => setIsLogin(!isLogin)}
        className="mt-6 text-xs text-sand-light hover:text-gold-light transition duration-150 tracking-wider uppercase font-semibold border-t border-gold-light/10 pt-4 w-full"
        disabled={loading}
      >
        {isLogin ? "Don't have an account? Register Now" : "Already have an account? Log In"}
      </button>
    </div>
  );
};

export default AuthForm;