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
  if (uid && token) {
    return (
      <div className={styles.container}>        
        <div className={styles.wrapperOtp}>
          <h1 className={styles.header}>{verified ? '✅ Email Verified!' : 'Verifying Email...'}</h1>
          {loading && (
            <p className={styles.otpText}>Please wait while we verify your email...</p>
          )}
          {verified && (
            <p className={styles.otpText} style={{ color: 'green' }}>
              Your email has been verified successfully! Redirecting to login...
            </p>
          )}
          {errors.server && (
            <div className={styles.error} style={{ marginTop: '1rem' }}>
              {errors.server}
              <br />
              <Link to="/register" className={styles.formNavigateLink} style={{ marginTop: '1rem', display: 'inline-block' }}>
                Back to Registration
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Manual OTP entry (fallback UI)
  return (
    <div className={styles.container}>        
      <div className={styles.wrapperOtp}>
        <h1 className={styles.header}>Verify Email</h1>
        <p className={styles.otpText}>
          Please check your email {email && <span className={styles.fontSemibold}>({email})</span>} and click the verification link.
        </p>
        {errors.otp && <span className={styles.error}>{errors.otp}</span>}
        <form action="" className={styles.otpForm} onSubmit={handleSubmit} noValidate>
          <div className={styles.formOtpText}>
            <div className={styles.inputWrapperOtp}>
              <OtpInput
                value={otpState.otp}
                onChange={handleChange}
                numInputs={6}
                renderSeparator={<span>-</span>}
                renderInput={(props) => (
                  <input
                    {...props}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    type="text"
                  />
                )}
                containerStyle={styles.otpInputContainer}
                inputStyle={styles.otpInput}
              />
            </div>
          </div>
          
          {/* Server Error */}
          {errors.server && (
            <div className={styles.error} style={{ marginTop: "1rem" }}>
              {errors.server}
            </div>
          )}

          <div className={styles.btnRow}>
            <button
              type="button"
              className={styles.clearBtn}
              onClick={handleClear}
            >
              Clear
            </button>
            <button
              type="submit"
              className={`${styles.formButton} ${isFormValid() && !loading ? styles.active : ''}`}
              disabled={loading}
            >
              {loading ? 'Verifying...' : 'Submit'}
            </button>
          </div>
          <div className={styles.formNavigateLogin}>
            <label className={styles.formNavigateText}>
              Didn't receive an OTP?{' '}
              <Link to="/signup" className={styles.formNavigateLink}>
                Resend OTP
              </Link>
            </label>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VerifyEmail;