import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Mail, ArrowLeft } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7072';
const API_BASE_URL = `${API_BASE}/api/Auth`;

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await axios.post(`${API_BASE_URL}/forgot-password`, { email });
      setSent(true);
      setLoading(false);
    } catch (err) {
      console.error('Forgot password error:', err);
      setError(err.response?.data?.message || 'Failed to send reset email. Please try again.');
      setLoading(false);
    }
  };

  const inputClasses = "w-full p-3.5 rounded-xl glass-input placeholder-sand-light/40 text-sm tracking-wide";
  const labelClasses = "block text-xs uppercase tracking-widest font-semibold text-gold-light/85 mb-1.5 ml-1";

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center relative p-4">
        <div className="bg-drift"></div>
        <div className="max-w-md w-full glass-panel p-8 md:p-12 rounded-2xl shadow-3xl text-center animate-fade-in">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-full bg-gold-glass border border-gold-light/25">
              <Mail className="w-10 h-10 text-gold-light" />
            </div>
          </div>
          
          <h2 className="text-3xl font-serif font-bold text-luxury-gradient mb-4">Check Your Email</h2>
          
          <p className="text-sm text-sand-light/90 leading-relaxed mb-6">
            If an account exists for <strong>{email}</strong>, you will receive password reset instructions shortly.
          </p>

          <p className="text-xs text-sand-light/50 mb-8 leading-relaxed">
            Please check your spam folder if you do not see the email in your inbox within a few minutes.
          </p>

          <div className="space-y-3">
            <button
              onClick={() => setSent(false)}
              className="w-full py-3.5 rounded-xl bg-luxury-gold-button font-serif tracking-widest text-sm uppercase transition-all duration-300"
            >
              Try Another Email
            </button>
            
            <button
              onClick={() => navigate('/')}
              className="w-full py-3.5 rounded-xl border border-gold-light/20 text-gold-light hover:bg-gold-glass/10 transition-all duration-150 text-xs font-semibold uppercase tracking-wider"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative p-4">
      <div className="bg-drift"></div>
      
      <div className="max-w-md w-full glass-panel p-8 md:p-12 rounded-2xl shadow-3xl animate-fade-in">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-xs text-sand-light hover:text-gold-light mb-8 transition duration-150 uppercase tracking-wider font-semibold"
        >
          <ArrowLeft size={14} className="mr-2" />
          Back to Login
        </button>

        {/* Header */}
        <h2 className="text-3xl font-serif font-bold text-luxury-gradient mb-2">Forgot Password?</h2>
        <p className="text-xs text-sand-light/70 leading-relaxed mb-8">
          Enter your email address and we'll send you instructions to securely reset your credentials.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className={labelClasses}>Email Address</label>
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className={inputClasses}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-xl text-xs font-semibold tracking-wide border leading-relaxed bg-red-950/20 border-red-500/30 text-red-400">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !email}
            className="w-full py-3.5 rounded-xl bg-luxury-gold-button font-serif tracking-widest text-sm uppercase transition-all duration-300 disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        {/* Info */}
        <p className="mt-8 text-center text-xs text-sand-light border-t border-gold-light/10 pt-4 w-full">
          Remember your password?{' '}
          <button
            onClick={() => navigate('/')}
            className="text-gold-light hover:underline font-semibold ml-1"
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
