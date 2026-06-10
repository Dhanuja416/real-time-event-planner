import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7072';
const API_BASE_URL = `${API_BASE}/api/Auth`;

const VerifyEmail = ({ theme }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error'
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      const email = searchParams.get('email');

      if (!token || !email) {
        setStatus('error');
        setMessage('Invalid verification link. Please check your email and try again.');
        return;
      }

      try {
        const response = await axios.post(`${API_BASE_URL}/verify-email`, {
          email,
          token
        });

        setStatus('success');
        setMessage(response.data.message || 'Email verified successfully! You can now log in.');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/');
        }, 3000);

      } catch (error) {
        console.error('Verification error:', error);
        setStatus('error');
        setMessage(
          error.response?.data?.message || 
          error.response?.data?.Message ||
          'Email verification failed. The link may be expired or invalid.'
        );
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  const containerClasses = theme === 'dark' 
    ? 'bg-gray-800 text-gray-100' 
    : 'bg-white text-gray-800';

  return (
    <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-gray-950' : 'bg-gray-50'}`}>
      <div className={`max-w-md w-full p-8 rounded-xl shadow-2xl ${containerClasses}`}>
        <div className="text-center">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            {status === 'verifying' && (
              <Loader className="w-16 h-16 text-blue-500 animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle className="w-16 h-16 text-green-500" />
            )}
            {status === 'error' && (
              <XCircle className="w-16 h-16 text-red-500" />
            )}
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold mb-4">
            {status === 'verifying' && 'Verifying Email'}
            {status === 'success' && 'Email Verified!'}
            {status === 'error' && 'Verification Failed'}
          </h2>

          {/* Message */}
          <p className={`text-lg mb-6 ${
            status === 'success' ? 'text-green-600 dark:text-green-400' :
            status === 'error' ? 'text-red-600 dark:text-red-400' :
            'text-gray-600 dark:text-gray-400'
          }`}>
            {message}
          </p>

          {/* Action Buttons */}
          {status === 'success' && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Redirecting to login page...
            </p>
          )}

          {status === 'error' && (
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition duration-150"
            >
              Back to Login
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
