import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams, Link } from 'react-router-dom';
import OtpInput from 'react-otp-input';
import styles from './VerifyEmail.module.css';
import authService from '../../services/auth.service';

interface OtpState {
  otp: string;
}

interface Errors {
  otp?: string;
  server?: string;
}

const VerifyEmail: React.FC = () => {
  const [otpState, setOtpState] = useState<OtpState>({ otp: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [verified, setVerified] = useState<boolean>(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Get email from state (sent from registration)
  const email = location.state?.email || '';
  
  // Get uid and token from URL params (from email link)
  const uid = searchParams.get('uid') || location.state?.uid || '';
  const token = searchParams.get('token') || location.state?.token || '';

  const isFormValid = (): boolean => {
    return otpState.otp.trim() !== '' && otpState.otp.length === 6;
  };

  const handleChange = (otpValue: string) => {
    setOtpState({ otp: otpValue });
    setErrors((prev) => ({ ...prev, otp: '' }));
  };

  const handleClear = () => {
    setOtpState({ otp: '' });
    setErrors({});
  };

  // Auto-verify when uid and token are present in URL
  useEffect(() => {
    const autoVerify = async () => {
      if (uid && token && !verifying && !verified) {
        setVerifying(true);
        setLoading(true);
        try {
          await authService.verifyEmail({ uid, token });
          setVerified(true);
          setErrors({});
          // Redirect to login after 2 seconds
          setTimeout(() => {
            navigate('/login', { 
              state: { message: 'Email verified successfully! Please login.' }
            });
          }, 2000);
        } catch (error: any) {
          console.error('Verification error:', error);
          
          if (error.response?.data) {
            const serverErrors = error.response.data;
            if (serverErrors.detail) {
              setErrors({ server: serverErrors.detail });
            } else if (serverErrors.uid || serverErrors.token) {
              setErrors({ server: 'Invalid or expired verification link. Please try registering again.' });
            } else {
              setErrors({ server: 'Verification failed. Please try again.' });
            }
          } else {
            setErrors({ server: 'Network error. Please try again later.' });
          }
        } finally {
          setLoading(false);
          setVerifying(false);
        }
      }
    };

    autoVerify();
  }, [uid, token, verifying, verified, navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newErrors: Errors = {};

    if (!otpState.otp.trim()) {
      newErrors.otp = 'OTP is required';
    } else if (otpState.otp.length !== 6) {
      newErrors.otp = 'OTP must be 6 digits';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setLoading(true);
      try {
        // Manual OTP verification (if implemented in backend)
        setErrors({ server: 'Please use the verification link sent to your email.' });
      } catch (error: any) {
        console.error('Verification error:', error);
        setErrors({ server: 'Verification failed. Please use the link in your email.' });
      } finally {
        setLoading(false);
      }
    }
  };

  // If verifying from email link
  // If verifying from email link
  if (uid && token) {
    return (
      <div className={styles.container}>        
        <div className={styles.wrapperOtp}>
          {verifying ? (
            <>
              <div className={styles.iconContainer}>
                <svg className={styles.emailIcon} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="64" height="64" rx="32" fill="var(--brand-red-primary)" opacity="0.1"/>
                  <path d="M20 24L32 32L44 24M20 24V40C20 41.1046 20.8954 42 22 42H42C43.1046 42 44 41.1046 44 40V24M20 24H44" stroke="var(--brand-red-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 className={styles.header}>Verifying Your Email</h2>
              <p className={styles.otpText}>Please wait while we verify your email address...</p>
              <div className={styles.loadingSpinner}></div>
            </>
          ) : verified ? (
            <>
              <div className={styles.iconContainer}>
                <svg className={styles.emailIcon} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="64" height="64" rx="32" fill="var(--success-color)" opacity="0.1"/>
                  <path d="M20 32L28 40L44 24" stroke="var(--success-color)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 className={styles.header}>Email Verified Successfully!</h2>
              <p className={styles.otpText}>
                Your email has been successfully verified. You will be redirected to the login page shortly.
              </p>
              <Link to="/login" className={styles.returnButton}>
                Go to Login Page
              </Link>
            </>
          ) : (
            <>
              <div className={styles.iconContainer}>
                <svg className={styles.emailIcon} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="64" height="64" rx="32" fill="var(--status-cancelled-text)" opacity="0.1"/>
                  <path d="M24 24L40 40M40 24L24 40" stroke="var(--status-cancelled-text)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 className={styles.header}>Verification Failed</h2>
              <p className={styles.otpText} style={{ color: 'var(--status-cancelled-text)' }}>
                {errors.server || 'Failed to verify your email. The verification link may have expired or is invalid.'}
              </p>
              <p className={styles.otpText}>
                Please try registering again or contact support if the problem persists.
              </p>
              <Link to="/login" className={styles.returnButton}>
                Return to Login Page
              </Link>
            </>
          )}
        </div>
      </div>
    );
  }
};

export default VerifyEmail;