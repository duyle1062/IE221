import React, { useState } from "react";
import styles from "./Register.module.css";
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
    <div className={styles.container}>
      {/* Header */}
      <h1 className={styles.header}>Sign up</h1>

      {/* Form */}
      <form
        action=""
        className={styles.wrapper}
        onSubmit={handleSubmit}
        noValidate
      >
        {/* Name */}
        <div className={styles["form-name"]}>
          <label className={styles["form-name-text"]}>
            Fullname <span className={styles.asterisk}>*</span>
          </label>
          <div className={styles["form-name-input"]}>
            {/* First Name */}
            <div className={styles["form-input-group"]}>
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
                <span className={styles.error}>{errors.username}</span>
              )}
            </div>

            {/* Last Name */}
            <div className={styles["form-input-group"]}>
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
                <span className={styles.error}>{errors.lastName}</span>
              )}
            </div>
          </div>
        </div>

        {/* Gender */}
        <div className={styles["form-gender"]}>
          <label className={styles["form-gender-text"]}>
            Gender <span className={styles.asterisk}>*</span>
          </label>
          <div className={styles["form-gender-selection"]}>
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
          {errors.gender && (
            <span className={styles.error}>{errors.gender}</span>
          )}
        </div>

        {/* Phone */}
        <div className={styles["form-phone"]}>
          <label htmlFor="" className={styles["form-phone-text"]}>
            Phone <span className={styles.asterisk}>*</span>
          </label>
          <div className={styles["input-wrapper"]}>
            <input
              className={styles["form-phone-input"]}
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
          {errors.phone && <span className={styles.error}>{errors.phone}</span>}
        </div>

        {/* Email */}
        <div className={styles["form-email"]}>
          <label htmlFor="" className={styles["form-email-text"]}>
            Email <span className={styles.asterisk}>*</span>
          </label>
          <div className={styles["input-wrapper"]}>
            <input
              className={styles["form-email-input"]}
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
          {errors.email && <span className={styles.error}>{errors.email}</span>}
        </div>

        {/* Password */}
        <div className={styles["form-password"]}>
          <label htmlFor="" className={styles["form-password-text"]}>
            Password <span className={styles.asterisk}>*</span>
          </label>
          <div className={styles["input-wrapper"]}>
            <input
              className={styles["form-password-input"]}
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
              className={styles["toggle-eye"]}
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? <FaRegEyeSlash /> : <FaRegEye />}
            </span>
          </div>
          {errors.password && (
            <span className={styles.error}>{errors.password}</span>
          )}
        </div>

        {/* Confirm Password */}
        <div className={styles["form-confirm-password"]}>
          <label htmlFor="" className={styles["form-confirm-password-text"]}>
            Confirm Password <span className={styles.asterisk}>*</span>
          </label>
          <input
            className={styles["form-confirm-password-input"]}
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
            <span className={styles.error}>{errors.confirmPassword}</span>
          )}
        </div>

        {/* License */}
        <div className={styles["license"]}>
          <div className={styles["form-license"]}>
            <input
              className={styles["form-license-input"]}
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => {
                setAgreeTerms(e.target.checked);
                if (e.target.checked && agreePrivacy) {
                  setErrors((prev) => ({ ...prev, agreement: "" }));
                }
              }}
            />
            <label htmlFor="" className={styles["form-license-text"]}>
              I agree to receive news about IE221 via email and registered phone
              number
            </label>
          </div>

          <div className={styles["form-license"]}>
            <input
              className={styles["form-license-input"]}
              type="checkbox"
              checked={agreePrivacy}
              onChange={(e) => {
                setAgreePrivacy(e.target.checked);
                if (e.target.checked && agreeTerms) {
                  setErrors((prev) => ({ ...prev, agreement: "" }));
                }
              }}
            />
            <label htmlFor="" className={styles["form-license-text"]}>
              I agree to join{" "}
              <a className={styles["form-license-text-link"]} href="#">
                HUT REWARDS membership
              </a>{" "}
              and accept the{" "}
              <a className={styles["form-license-text-link"]} href="#">
                terms, conditions and privacy policy of IE221
              </a>
            </label>
          </div>

          {errors.agreement && (
            <span className={styles.error}>{errors.agreement}</span>
          )}
        </div>

        {/* Register Button */}
        <button
          className={`${styles["form-button"]} ${
            isFormValid() ? styles["active"] : ""
          }`}
          type="submit"
        >
          Register
        </button>

        {/* Login Navigate */}
        <div className={styles["form-navigate-login"]}>
          <label htmlFor="" className={styles["form-navigate-text"]}>
            Already have an account?{" "}
            <Link to="/login" className={styles["form-navigate-link"]}>
              Sign in
            </Link>
          </label>
        </div>
      </form>
    </div>
  );
};

export default RegisterForm;
