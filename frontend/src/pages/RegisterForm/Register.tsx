import React, { useState } from "react";
import "./Register.css";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import { Link } from "react-router-dom";

interface Errors {
  username?: string;
  lastName?: string;
  gender?: string;
  phone?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  agreement?: string;
}

const RegisterForm: React.FC = () => {
  const [username, setUsername] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [gender, setGender] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [agreeTerms, setAgreeTerms] = useState<boolean>(false);
  const [agreePrivacy, setAgreePrivacy] = useState<boolean>(false);
  const [errors, setErrors] = useState<Errors>({});

  const isFormValid = (): boolean => {
    return (
      username.trim() !== "" &&
      lastName.trim() !== "" &&
      gender !== "" &&
      phone.trim() !== "" &&
      email.trim() !== "" &&
      password.trim() !== "" &&
      confirmPassword.trim() !== "" &&
      password === confirmPassword &&
      agreeTerms &&
      agreePrivacy
    );
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newErrors: Errors = {};

    if (!username.trim()) newErrors.username = "Required";
    if (!lastName.trim()) newErrors.lastName = "Required";
    if (!gender) newErrors.gender = "Please select your gender";
    if (!phone.trim()) newErrors.phone = "Required";
    if (!email.trim()) newErrors.email = "Required";
    if (!password.trim()) newErrors.password = "Required";
    if (password !== confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";
    if (!agreeTerms || !agreePrivacy) {
      newErrors.agreement =
        "Please agree to Terms of Use and Privacy Policy before proceeding";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      alert("Success");
    }
  };

  return (
    <div className="container">
      {/* Header */}
      <h1 className="header">Sign up</h1>

      {/* Form */}
      <form action="" className="wrapper" onSubmit={handleSubmit} noValidate>
        {/* Name */}
        <div className="form-name">
          <label className="form-name-text">
            Fullname <span className="asterisk">*</span>
          </label>
          <div className="form-name-input">
            {/* First Name */}
            <div className="form-input-group">
              <input
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (e.target.value.trim()) {
                    setErrors((prev) => ({ ...prev, username: "" }));
                  }
                }}
                type="text"
                placeholder="First Name"
              />
              {errors.username && (
                <span className="error">{errors.username}</span>
              )}
            </div>

            <div className="form-input-group">
              <input
                type="text"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value);
                  if (e.target.value.trim()) {
                    setErrors((prev) => ({ ...prev, lastName: "" }));
                  }
                }}
              />
              {errors.lastName && (
                <span className="error">{errors.lastName}</span>
              )}
            </div>
          </div>
        </div>

        {/* Gender */}
        <div className="form-gender">
          <label className="form-gender-text">
            Gender <span className="asterisk">*</span>
          </label>
          <div className="form-gender-selection">
            <label htmlFor="male">
              <input
                type="radio"
                id="male"
                value="male"
                name="gender"
                checked={gender === "male"}
                onChange={(e) => {
                  setGender(e.target.value);
                  setErrors((prev) => ({ ...prev, gender: "" }));
                }}
              />
              Male
            </label>
            <label htmlFor="female">
              <input
                type="radio"
                id="female"
                name="gender"
                value="female"
                checked={gender === "female"}
                onChange={(e) => {
                  setGender(e.target.value);
                  setErrors((prev) => ({ ...prev, gender: "" }));
                }}
              />
              Female
            </label>
            <label htmlFor="other">
              <input
                type="radio"
                id="other"
                name="gender"
                value="other"
                checked={gender === "other"}
                onChange={(e) => {
                  setGender(e.target.value);
                  setErrors((prev) => ({ ...prev, gender: "" }));
                }}
              />
              Other
            </label>
          </div>
          {errors.gender && <span className="error">{errors.gender}</span>}
        </div>

        {/* Phone */}
        <div className="form-phone">
          <label htmlFor="" className="form-phone-text">
            Phone <span className="asterisk">*</span>
          </label>
          <div className="input-wrapper">
            <input
              className="form-phone-input"
              type="tel"
              placeholder="Input your phone number"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (e.target.value.trim()) {
                  setErrors((prev) => ({ ...prev, phone: "" }));
                }
              }}
            />
          </div>
          {errors.phone && <span className="error">{errors.phone}</span>}
        </div>

        {/* Email */}
        <div className="form-email">
          <label htmlFor="" className="form-email-text">
            Email <span className="asterisk">*</span>
          </label>
          <div className="input-wrapper">
            <input
              className="form-email-input"
              type="email"
              placeholder="Input your email address"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (e.target.value.trim()) {
                  setErrors((prev) => ({ ...prev, email: "" }));
                }
              }}
            />
          </div>
          {errors.email && <span className="error">{errors.email}</span>}
        </div>

        {/* Password */}
        <div className="form-password">
          <label htmlFor="" className="form-password-text">
            Password <span className="asterisk">*</span>
          </label>
          <div className="input-wrapper">
            <input
              className="form-password-input"
              type={showPassword ? "text" : "password"}
              placeholder="Input your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (e.target.value.trim()) {
                  setErrors((prev) => ({ ...prev, password: "" }));
                }
              }}
            />
            <span
              className="toggle-eye"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? <FaRegEyeSlash /> : <FaRegEye />}
            </span>
          </div>
          {errors.password && <span className="error">{errors.password}</span>}
        </div>

        {/* Confirm Password */}
        <div className="form-confirm-password">
          <label htmlFor="" className="form-confirm-password-text">
            Confirm Password <span className="asterisk">*</span>
          </label>
          <input
            className="form-confirm-password-input"
            type="password"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (e.target.value.trim()) {
                setErrors((prev) => ({ ...prev, confirmPassword: "" }));
              }
            }}
          />
          {errors.confirmPassword && (
            <span className="error">{errors.confirmPassword}</span>
          )}
        </div>

        {/* License */}
        <div className="license">
          <div className="form-license">
            <input
              className="form-license-input"
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => {
                setAgreeTerms(e.target.checked);
                if (e.target.checked && agreePrivacy) {
                  setErrors((prev) => ({ ...prev, agreement: "" }));
                }
              }}
            />
            <label htmlFor="" className="form-license-text">
              I agree to receive news about IE221 via email and registered phone
              number
            </label>
          </div>

          <div className="form-license">
            <input
              className="form-license-input"
              type="checkbox"
              checked={agreePrivacy}
              onChange={(e) => {
                setAgreePrivacy(e.target.checked);
                if (e.target.checked && agreeTerms) {
                  setErrors((prev) => ({ ...prev, agreement: "" }));
                }
              }}
            />
            <label htmlFor="" className="form-license-text">
              I agree to join{" "}
              <a className="form-license-text-link" href="#">
                HUT REWARDS membership
              </a>{" "}
              and accept the{" "}
              <a className="form-license-text-link" href="#">
                terms, conditions and privacy policy of IE221
              </a>
            </label>
          </div>

          {errors.agreement && (
            <span className="error">{errors.agreement}</span>
          )}
        </div>

        {/* Register Button */}
        <button
          className={`form-button ${isFormValid() ? "active" : ""}`}
          type="submit"
        >
          Register
        </button>

        {/* Login Navigate */}
        <div className="form-navigate-login">
          <label htmlFor="" className="form-navigate-text">
            Already have an account?{" "}
            <Link to="/login" className="form-navigate-link">
              Sign in
            </Link>
          </label>
        </div>
      </form>
    </div>
  );
};

export default RegisterForm;
