import React, { useState } from 'react';
import { useNavigate, useLocation, Link, useSearchParams } from 'react-router-dom';
import { FaRegEye, FaRegEyeSlash } from 'react-icons/fa';
import styles from './ResetPassword.module.css';
import authService from '../../services/auth.service';

interface FormState {
  newPassword: string;
  confirmPassword: string;
}

interface Errors {
  newPassword?: string;
  confirmPassword?: string;
}

const ResetPassword: React.FC = () => {
  const [formState, setFormState] = useState<FormState>({ newPassword: '', confirmPassword: '' });
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  // Get uid and token from URL parameters (from email link)
  const uid = searchParams.get('uid') || location.state?.uid || '';
  const token = searchParams.get('token') || location.state?.token || '';
  const email = location.state?.email || '';

  const isFormValid = (): boolean => {
    return (
      formState.newPassword.trim() !== '' &&
      formState.confirmPassword.trim() !== '' &&
      formState.newPassword === formState.confirmPassword
    );
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
    setServerError('');
    setSuccessMessage('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newErrors: Errors = {};

    if (!formState.newPassword.trim()) {
      newErrors.newPassword = 'New Password is required';
    } else if (formState.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }

    if (formState.newPassword !== formState.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      if (!uid || !token) {
        setServerError('Invalid reset link. Please request a new password reset.');
        return;
      }

      setLoading(true);
      setServerError('');
      setSuccessMessage('');

      try {
        await authService.resetPassword({
          uid,
          token,
          new_password: formState.newPassword,
          re_new_password: formState.confirmPassword,
        });

        setSuccessMessage('Password reset successfully!');
        
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } catch (error: any) {
        console.error('Reset password error:', error);
        
        if (error.response?.data) {
          const serverErrors = error.response.data;
          
          if (serverErrors.new_password) {
            setServerError(
              Array.isArray(serverErrors.new_password)
                ? serverErrors.new_password[0]
                : serverErrors.new_password
            );
          } else if (serverErrors.token) {
            setServerError('Invalid or expired reset link. Please request a new one.');
          } else if (serverErrors.detail) {
            setServerError(serverErrors.detail);
          } else {
            setServerError('Failed to reset password. Please try again.');
          }
        } else {
          setServerError('Network error. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
      <h1 className={styles.header}>Reset Password</h1>
        <p className={styles.resetText}>
          Enter your new password for <span className={styles.fontSemibold}>{email}</span> ...
        </p>
        {serverError && (
          <div className={styles.error}>{serverError}</div>
        )}
        {successMessage && (
          <div className={styles.success}>{successMessage}</div>
        )}
        <form action="" className={styles.resetForm} onSubmit={handleSubmit} noValidate>
          <div className={styles.formPassword}>
            <div className={styles.inputWrapper}>
              <input
                className={styles.formPasswordInput}
                type={showNewPassword ? 'text' : 'password'}
                name="newPassword"
                placeholder="Enter new password"
                value={formState.newPassword}
                onChange={handleChange}
              />
              <span
                className={styles.toggleEye}
                onClick={() => setShowNewPassword((prev) => !prev)}
              >
                {showNewPassword ? <FaRegEyeSlash /> : <FaRegEye />}
              </span>
            </div>
            {errors.newPassword && <span className={styles.error}>{errors.newPassword}</span>}
          </div>
          <div className={styles.formConfirmPassword}>
            <div className={styles.inputWrapper}>
              <input
                className={styles.formConfirmPasswordInput}
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                placeholder="Confirm new password"
                value={formState.confirmPassword}
                onChange={handleChange}
              />
              <span
                className={styles.toggleEye}
                onClick={() => setShowConfirmPassword((prev) => !prev)}
              >
                {showConfirmPassword ? <FaRegEyeSlash /> : <FaRegEye />}
              </span>
            </div>
            {errors.confirmPassword && <span className={styles.error}>{errors.confirmPassword}</span>}
          </div>
          <button
            className={`${styles.formButton} ${isFormValid() && !loading ? styles.active : ''}`}
            type="submit"
            disabled={loading}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
          <div className={styles.formNavigateLogin}>
            <label className={styles.formNavigateText}>
              Back to{' '}
              <Link to="/login" className={styles.formNavigateLink}>
                Sign in
              </Link>
            </label>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;