import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import OtpInput from 'react-otp-input';
import './VerifyEmail.css';

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
    <div className="container">
      <div className="wrapper-otp">
        <h1 className="header">Confirm OTP</h1>
        <p className="otp-text">
          Please enter the OTP code sent to your email <span className="font-semibold">{email}</span>
        </p>
        {errors.otp && <span className="error text-center">{errors.otp}</span>}
        <form action="" className="otp-form" onSubmit={handleSubmit} noValidate>
          <div className="form-otp-text">
            <div className="input-wrapper-OTP">
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
                containerStyle="otp-input-container"
                inputStyle="otp-input"
              />
            </div>
          </div>
          <div className="btn-row">
            <button
              type="button"
              className="clear-btn"
              onClick={handleClear}
            >
              Clear
            </button>
            <button
              type="submit"
              className={`form-button ${isFormValid() ? 'active' : ''}`}
            >
              Submit
            </button>
          </div>
          <div className="form-navigate-login">
            <label className="form-navigate-text">
              Didn't receive an OTP?{' '}
              <Link to="/signup" className="form-navigate-link">
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