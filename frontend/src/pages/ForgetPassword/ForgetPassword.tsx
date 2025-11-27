import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from './ForgetPassword.module.css';
import authService from '../../services/auth.service';

interface FormState {
  email: string;
}

interface Errors {
  email?: string;
}

const ForgetPassword: React.FC = () => {
  const [formState, setFormState] = useState<FormState>({ email: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate(); 

  const isFormValid = (): boolean => {
    return formState.email.trim() !== '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, email: '' }));
    setServerError('');
    setSuccessMessage('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newErrors: Errors = {};

    if (!formState.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formState.email)) {
      newErrors.email = 'Email is invalid';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setLoading(true);
      setServerError('');
      setSuccessMessage('');
      
      try {
        await authService.forgotPassword({ email: formState.email });
        setSuccessMessage('Reset password link has been sent to your email!');
        
        // Optional: Clear form after success
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (error: any) {
        console.error('Forgot password error:', error);
        
        if (error.response?.data) {
          const serverErrors = error.response.data;
          if (serverErrors.email) {
            setServerError(
              Array.isArray(serverErrors.email)
                ? serverErrors.email[0]
                : serverErrors.email
            );
          } else if (serverErrors.detail) {
            setServerError(serverErrors.detail);
          } else {
            setServerError('Failed to send reset link. Please try again.');
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
      <h1 className={styles.header}>Forgot Password</h1>
        <p className={styles.forgetText}>
          Enter your email address and we'll send you a link to reset your password.
        </p>
        {serverError && (
          <div className={styles.error}>{serverError}</div>
        )}
        {successMessage && (
          <div className={styles.success}>{successMessage}</div>
        )}
        <form action="" className={styles.forgetForm} onSubmit={handleSubmit} noValidate>
          <div className={styles.formEmail}>
            <div className={styles.inputWrapper}>
              <input
                className={styles.formEmailInput}
                type="email"
                name="email"
                placeholder="Enter your email address"
                value={formState.email}
                onChange={handleChange}
              />
            </div>
            {errors.email && <span className={styles.error}>{errors.email}</span>}
          </div>
          <button
            className={`${styles.formButton} ${isFormValid() && !loading ? styles.active : ''}`}
            type="submit"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
          <div className={styles.formNavigateLogin}>
            <label className={styles.formNavigateText}>
              Remembered your password?{' '}
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

export default ForgetPassword;