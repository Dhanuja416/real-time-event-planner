import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7072';
const API_BASE_URL = `${API_BASE}/api/Auth`;

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error'
  const [message, setMessage] = useState('Verifying your credentials...');

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      const email = searchParams.get('email');

      if (!token || !email) {
        setStatus('error');
        setMessage('Invalid verification link. Please request a new verification email.');
        return;
      }

      try {
        const response = await axios.post(`${API_BASE_URL}/verify-email`, {
          email,
          token
        });

        setStatus('success');
        setMessage(response.data.message || 'Email verified successfully! Opening your secure workspace...');
        
        setTimeout(() => {
          navigate('/');
        }, 3000);

      } catch (error) {
        console.error('Verification error:', error);
        setStatus('error');
        setMessage(
          error.response?.data?.message || 
          error.response?.data?.Message ||
          'Verification token is invalid or has expired.'
        );
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center relative p-4">
      <div className="bg-drift"></div>
      
      <div className="max-w-md w-full glass-panel p-8 md:p-12 rounded-2xl shadow-3xl text-center animate-fade-in">
        <span className="text-[10px] uppercase tracking-widest text-gold-light/70 font-semibold block mb-4">
          REAP Secure Verification
        </span>

        {/* Icon */}
        <div className="flex justify-center mb-6">
          {status === 'verifying' && (
            <div className="p-4 rounded-full bg-gold-glass border border-gold-light/25 animate-pulse">
              <Loader className="w-10 h-10 text-gold-light animate-spin" />
            </div>
          )}
          {status === 'success' && (
            <div className="p-4 rounded-full bg-gold-glass border border-gold-light/40">
              <CheckCircle className="w-10 h-10 text-gold-light" />
            </div>
          )}
          {status === 'error' && (
            <div className="p-4 rounded-full bg-red-950/20 border border-red-500/30">
              <XCircle className="w-10 h-10 text-red-400" />
            </div>
          )}
        </div>

        {/* Title */}
        <h2 className="text-3xl font-serif font-bold text-luxury-gradient mb-3">
          {status === 'verifying' && 'Verifying Email'}
          {status === 'success' && 'Verification Complete'}
          {status === 'error' && 'Verification Failed'}
        </h2>

        {/* Message */}
        <p className={`text-sm mb-8 leading-relaxed font-medium ${
          status === 'success' ? 'text-gold-light/90' :
          status === 'error' ? 'text-red-400/95' :
          'text-sand-light/85'
        }`}>
          {message}
        </p>

        {/* Action Buttons */}
        {status === 'success' && (
          <p className="text-xs text-sand-light/60 tracking-wider uppercase font-semibold animate-pulse">
            Redirecting to dashboard...
          </p>
        )}

        {status === 'error' && (
          <button
            onClick={() => navigate('/')}
            className="w-full py-3.5 rounded-xl bg-luxury-gold-button font-serif tracking-widest text-sm uppercase transition-all duration-300"
          >
            Back to Login
          </button>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
