import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7072';
const API_BASE_URL = `${API_BASE}/api/Auth`;

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [passwordStrength, setPasswordStrength] = useState('');

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    const emailParam = searchParams.get('email');

    if (!tokenParam || !emailParam) {
      setError('Invalid reset link. Please request a new password reset.');
      return;
    }

    setToken(tokenParam);
    setEmail(emailParam);
  }, [searchParams]);

  useEffect(() => {
    // Password strength checker
    if (!newPassword) {
      setPasswordStrength('');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordStrength('weak');
    } else if (newPassword.length < 10) {
      setPasswordStrength('medium');
    } else {
      setPasswordStrength('strong');
    }
  }, [newPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await axios.post(`${API_BASE_URL}/reset-password`, {
        email,
        token,
        newPassword
      });

      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/');
      }, 3000);

    } catch (err) {
      console.error('Reset password error:', err);
      setError(
        err.response?.data?.message || 
        err.response?.data?.Message ||
        err.response?.data?.errors?.NewPassword?.[0] ||
        'Failed to reset password. The link may be expired.'
      );
      setLoading(false);
    }
  };

  const inputClasses = "w-full p-3.5 rounded-xl glass-input placeholder-sand-light/40 text-sm tracking-wide";
  const labelClasses = "block text-xs uppercase tracking-widest font-semibold text-gold-light/85 mb-1.5 ml-1";

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center relative p-4">
        <div className="bg-drift"></div>
        <div className="max-w-md w-full glass-panel p-8 md:p-12 rounded-2xl shadow-3xl text-center animate-fade-in">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-full bg-gold-glass border border-gold-light/40">
              <CheckCircle className="w-10 h-10 text-gold-light" />
            </div>
          </div>
          
          <h2 className="text-3xl font-serif font-bold text-luxury-gradient mb-4">Reset Complete</h2>
          
          <p className="text-sm text-sand-light/90 leading-relaxed mb-6">
            Your password has been successfully reset. You can now log in with your new credentials.
          </p>

          <p className="text-xs text-sand-light/50 animate-pulse">
            Redirecting to login page...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative p-4">
      <div className="bg-drift"></div>
      
      <div className="max-w-md w-full glass-panel p-8 md:p-12 rounded-2xl shadow-3xl animate-fade-in">
        {/* Header */}
        <div className="flex justify-center mb-4">
          <div className="p-3.5 rounded-full bg-gold-glass border border-gold-light/25">
            <Lock className="w-8 h-8 text-gold-light" />
          </div>
        </div>
        
        <h2 className="text-3xl font-serif font-bold text-luxury-gradient text-center mb-1">Reset Password</h2>
        <p className="text-xs text-sand-light/70 text-center mb-8">
          Establish your new secure credentials below.
        </p>

        {/* Email Display */}
        <div className="mb-6 p-4 rounded-xl bg-cocoa-darkest/45 border border-gold-light/10">
          <span className="text-[10px] uppercase tracking-widest text-sand-light/60 font-semibold block mb-0.5">
            Resetting password for:
          </span>
          <span className="text-sm font-semibold text-gold-light">{email}</span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* New Password */}
          <div>
            <label className={labelClasses}>New Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={loading}
                className={inputClasses}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-sand-light/75 hover:text-gold-light transition"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            
            {/* Password Strength Indicator */}
            {passwordStrength && (
              <div className="mt-2.5">
                <div className="flex items-center space-x-2.5">
                  <div className="flex-1 h-1.5 bg-cocoa-darkest/45 border border-gold-light/10 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        passwordStrength === 'weak' ? 'w-1/3 bg-red-500' :
                        passwordStrength === 'medium' ? 'w-2/3 bg-yellow-600' :
                        'w-full bg-gold-medium'
                      }`}
                    ></div>
                  </div>
                  <span className={`text-[10px] uppercase tracking-widest font-bold ${
                    passwordStrength === 'weak' ? 'text-red-400' :
                    passwordStrength === 'medium' ? 'text-yellow-600' :
                    'text-gold-light'
                  }`}>
                    {passwordStrength}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className={labelClasses}>Confirm Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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

          {/* Password Requirements */}
          <div className="text-[10px] text-sand-light/60 font-semibold space-y-1 border-t border-gold-light/10 pt-4">
            <p className="uppercase tracking-widest text-gold-light/70 mb-1.5">Password Requirements:</p>
            <ul className="space-y-1 ml-1.5">
              <li className={`flex items-center gap-1.5 ${newPassword.length >= 6 ? 'text-gold-light' : ''}`}>
                <span className="w-1 h-1 rounded-full bg-current"></span>
                <span>At least 6 characters long</span>
              </li>
              <li className={`flex items-center gap-1.5 ${newPassword === confirmPassword && newPassword ? 'text-gold-light' : ''}`}>
                <span className="w-1 h-1 rounded-full bg-current"></span>
                <span>Passwords match in both fields</span>
              </li>
            </ul>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !newPassword || !confirmPassword || !token}
            className="w-full py-3.5 rounded-xl bg-luxury-gold-button font-serif tracking-widest text-sm uppercase transition-all duration-300 disabled:opacity-50"
          >
            {loading ? 'Resetting Password...' : 'Reset Password'}
          </button>
        </form>

        {/* Back to Login */}
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

export default ResetPassword;
