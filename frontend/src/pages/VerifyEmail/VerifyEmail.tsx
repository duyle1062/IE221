import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import OtpInput from 'react-otp-input';
import styles from './VerifyEmail.module.css';

interface OtpState {
  otp: string;
}

interface Errors {
  otp?: string;
}

const VerifyEmail: React.FC = () => {
  const [otpState, setOtpState] = useState<OtpState>({ otp: '' });
  const [errors, setErrors] = useState<Errors>({});
  const location = useLocation();
  const navigate = useNavigate();

  // Lấy email từ state
  const email = location.state?.email || '';

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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newErrors: Errors = {};

    if (!otpState.otp.trim()) {
      newErrors.otp = 'OTP is required';
    } else if (otpState.otp.length !== 6) {
      newErrors.otp = 'OTP must be 6 digits';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      // Giả lập hành động submit thành công
      alert('OTP verified successfully!');
      navigate('/login');
    }
  };

  return (
    <div className={styles.container}>        
      <h1 className={styles.header}>Confirm OTP</h1>
      <div className={styles.wrapperOtp}>
        <p className={styles.otpText}>
          Please enter the OTP code sent to your email <span className={styles.fontSemibold}>{email}</span>
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
              className={`${styles.formButton} ${isFormValid() ? styles.active : ''}`}
            >
              Submit
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