import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, KeyRound, AlertTriangle } from 'lucide-react';
import AuthLayout from '../../layouts/AuthLayout';
import LoginForm from './LoginForm';
import Input from '../../components/Input';
import Button from '../../components/Button';
import authService from '../../services/authService';

const LoginPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // State for First-Time Password Reset Flow
  const [showResetModal, setShowResetModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const handleLoginSubmit = async ({ email, password }) => {
    setLoading(true);
    setError(null);
    try {
      // 1. Attempt login
      const data = await authService.login(email, password);
      
      // 2. Check if password is an auto-generated temporary password
      if (password.startsWith('STUD@') || password.startsWith('FAC@')) {
        setCurrentPassword(password);
        setShowResetModal(true);
        setLoading(false);
      } else {
        // 3. Normal redirect
        navigate('/dashboard');
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 
        'Invalid email or password. Please try again.'
      );
      setLoading(false);
    }
  };

  const handlePasswordResetSubmit = async (e) => {
    e.preventDefault();
    setResetError('');

    if (newPassword.length < 8) {
      setResetError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword === currentPassword) {
      setResetError('New password must be different from current password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match.');
      return;
    }

    setResetLoading(true);
    try {
      await authService.changePassword(currentPassword, newPassword);
      // Password changed successfully, proceed to dashboard
      navigate('/dashboard');
    } catch (err) {
      setResetError(
        err.response?.data?.message || 
        'Failed to update password. Please try again.'
      );
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <AuthLayout>
      {!showResetModal ? (
        <>
          {error && (
            <div className="flex gap-2.5 p-3 rounded-lg bg-status-danger/10 border border-status-danger/30 text-status-danger text-sm mb-5">
              <ShieldAlert size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <LoginForm onSubmit={handleLoginSubmit} loading={loading} />
        </>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex gap-2.5 p-3 rounded-lg bg-status-warning/10 border border-status-warning/30 text-status-warning text-sm mb-2">
            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Security Update Required</p>
              <p className="text-xs mt-0.5 opacity-90">
                You are logged in with a temporary password. Please update it before continuing.
              </p>
            </div>
          </div>

          <form onSubmit={handlePasswordResetSubmit} className="flex flex-col gap-4">
            <Input
              label="New Password"
              name="newPassword"
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              icon={KeyRound}
              error={resetError && resetError.includes('New password') ? resetError : null}
              required
            />

            <Input
              label="Confirm New Password"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              icon={KeyRound}
              error={resetError && resetError.includes('match') ? resetError : null}
              required
            />

            {resetError && !resetError.includes('password') && !resetError.includes('match') && (
              <p className="text-xs text-status-danger font-medium">{resetError}</p>
            )}

            <Button type="submit" loading={resetLoading} className="w-full mt-2">
              Update Password & Enter
            </Button>
          </form>
        </div>
      )}
    </AuthLayout>
  );
};

export default LoginPage;
