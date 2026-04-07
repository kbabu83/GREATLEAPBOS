import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState('email'); // email -> otp -> password -> success
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expiryMinutes, setExpiryMinutes] = useState(15);
  const [attemptsRemaining, setAttemptsRemaining] = useState(3);

  const requestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/password/request-otp', { email });
      setSuccess(response.data.message);
      setExpiryMinutes(response.data.expires_in_minutes);
      setStep('otp');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/auth/password/verify-otp', { email, otp });
      setSuccess('OTP verified successfully!');
      setStep('password');
    } catch (err) {
      const message = err.response?.data?.message || 'Invalid OTP. Please try again.';
      setError(message);

      // Extract attempts remaining from error message if available
      const match = message.match(/(\d+)\s*attempts remaining/);
      if (match) {
        setAttemptsRemaining(parseInt(match[1]));
      }
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (password !== passwordConfirm) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/auth/password/reset-with-otp', {
        email,
        otp,
        password,
        password_confirmation: passwordConfirm,
      });
      setSuccess(response.data.message);
      setStep('success');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/password/resend-otp', { email });
      setSuccess(response.data.message);
      setExpiryMinutes(response.data.expires_in_minutes);
      setOtp('');
      setAttemptsRemaining(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-block w-12 h-12 rounded-lg bg-green-500 text-white flex items-center justify-center text-xl font-bold mb-4">
              🚀
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Great Leap App</h1>
            <p className="text-gray-600 text-sm mt-1">Reset Your Password</p>
          </div>

          {/* Progress Indicator */}
          <div className="flex justify-between items-center mb-8">
            <div className={`flex-1 h-2 mx-1 rounded-full transition-colors ${
              step === 'email' || step === 'otp' || step === 'password' || step === 'success'
                ? 'bg-blue-600'
                : 'bg-gray-300'
            }`} />
            <div className={`flex-1 h-2 mx-1 rounded-full transition-colors ${
              step === 'otp' || step === 'password' || step === 'success'
                ? 'bg-blue-600'
                : 'bg-gray-300'
            }`} />
            <div className={`flex-1 h-2 mx-1 rounded-full transition-colors ${
              step === 'password' || step === 'success'
                ? 'bg-blue-600'
                : 'bg-gray-300'
            }`} />
            <div className={`flex-1 h-2 mx-1 rounded-full transition-colors ${
              step === 'success'
                ? 'bg-blue-600'
                : 'bg-gray-300'
            }`} />
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 text-sm font-medium">✓ {success}</p>
            </div>
          )}

          {/* Step 1: Email */}
          {step === 'email' && (
            <form onSubmit={requestOtp} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                {loading ? 'Sending...' : 'Send OTP'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Back to Login
                </button>
              </div>
            </form>
          )}

          {/* Step 2: OTP Verification */}
          {step === 'otp' && (
            <form onSubmit={verifyOtp} className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  ✉️ OTP sent to <strong>{email}</strong>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter 6-Digit OTP
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength="6"
                  required
                  className="w-full px-4 py-3 text-center text-lg tracking-widest border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition font-mono"
                />
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">⏱️ Expires in {expiryMinutes} minutes</span>
                {attemptsRemaining <= 1 && (
                  <span className="text-red-600 font-medium">{attemptsRemaining} attempt remaining</span>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>

              <button
                type="button"
                onClick={resendOtp}
                disabled={loading}
                className="w-full text-blue-600 hover:text-blue-700 text-sm font-medium py-2"
              >
                Didn't receive? Resend OTP
              </button>
            </form>
          )}

          {/* Step 3: Password Reset */}
          {step === 'password' && (
            <form onSubmit={resetPassword} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Min 8 chars, uppercase, lowercase, number, symbol
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !password || password !== passwordConfirm}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}

          {/* Step 4: Success */}
          {step === 'success' && (
            <div className="text-center space-y-6">
              <div className="text-6xl">✅</div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Reset Successful!</h2>
                <p className="text-gray-600">Your password has been updated. You can now login with your new password.</p>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Go to Login
              </button>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-600">
            <p>Questions? <a href="mailto:support@greatleap.com" className="text-blue-600 hover:text-blue-700">Contact Support</a></p>
          </div>
        </div>
      </div>
    </div>
  );
}
