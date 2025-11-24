import React, { useState } from "react";
import styles from "./Register.module.css";
import { Link, useNavigate } from "react-router-dom";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import authService, { Gender } from "../../services/auth.service";
import logoImage from "../../assets/images/Logo_FastFood.png";

interface Errors {
  firstName?: string;
  lastName?: string;
  gender?: string;
  phone?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
  server?: string;
}

const RegisterForm: React.FC = () => {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [gender, setGender] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);
  const [acceptedTerms, setAcceptedTerms] = useState<boolean>(false);
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState<boolean>(false);

  const isFormValid = (): boolean => {
    return (
      firstName.trim() !== "" &&
      lastName.trim() !== "" &&
      gender !== "" &&
      phone.trim() !== "" &&
      email.trim() !== "" &&
      password.trim() !== "" &&
      confirmPassword.trim() !== "" &&
      acceptedTerms
    );
  };

  const validateForm = (): Errors => {
    const newErrors: Errors = {};

    if (!firstName.trim()) newErrors.firstName = "First name is required";
    if (!lastName.trim()) newErrors.lastName = "Last name is required";
    if (!gender) newErrors.gender = "Please select your gender";
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
    }
    if (!phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10,}$/.test(phone.replace(/\D/g, ""))) {
      newErrors.phone = "Phone number must be at least 10 digits";
    }
    if (!password.trim()) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    if (!acceptedTerms) {
      newErrors.terms = "You must accept the terms and conditions";
    }

    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newErrors = validateForm();

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setLoading(true);
      try {
        // Map gender to backend format
        const genderMap: { [key: string]: Gender } = {
          male: Gender.MALE,
          female: Gender.FEMALE,
          other: Gender.OTHER,
        };

        const selectedGender = genderMap[gender];
        if (!selectedGender) {
          throw new Error("Invalid gender selection");
        }

        await authService.register({
          email,
          firstname: firstName,
          lastname: lastName,
          phone,
          gender: selectedGender,
          password,
          re_password: confirmPassword,
        });

        // Navigate to verify email page with email
        navigate("/verify-email", { state: { email } });
      } catch (error: any) {
        console.error("Registration error:", error);

        if (error.response?.data) {
          const serverErrors = error.response.data;

          if (serverErrors.detail) {
            setErrors({ server: serverErrors.detail });
          } else if (serverErrors.email) {
            setErrors({
              email: Array.isArray(serverErrors.email)
                ? serverErrors.email[0]
                : serverErrors.email,
            });
          } else if (serverErrors.phone) {
            setErrors({
              phone: Array.isArray(serverErrors.phone)
                ? serverErrors.phone[0]
                : serverErrors.phone,
            });
          } else if (serverErrors.password) {
            setErrors({
              password: Array.isArray(serverErrors.password)
                ? serverErrors.password[0]
                : serverErrors.password,
            });
          } else {
            setErrors({ server: "Registration failed. Please try again." });
          }
        } else {
          setErrors({ server: "Network error. Please try again later." });
        }
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <>
      <Header />
      <div className={styles.container}>
        {/* Left Side - Branding */}
        <div className={styles.brandSection}>
          <div className={styles.brandContent}>
            <h1 className={styles.brandTitle}>
              EASY TO ORDER
              <br />
              FAST DELIVERY
            </h1>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className={styles.formSection}>
          <form className={styles.wrapper} onSubmit={handleSubmit} noValidate>
            {/* Header */}
            <h1 className={styles.header}>CREATE ACCOUNT</h1>

            {/* First Name */}
            <div className={styles.formGroup}>
              <label htmlFor="firstName" className={styles.label}>
                First name *
              </label>
              <input
                id="firstName"
                className={styles.input}
                type="text"
                placeholder="Enter your first name"
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  if (e.target.value.trim()) {
                    setErrors((prev) => ({ ...prev, firstName: "" }));
                  }
                }}
              />
              {errors.firstName && (
                <span className={styles.error}>{errors.firstName}</span>
              )}
            </div>

            {/* Last Name */}
            <div className={styles.formGroup}>
              <label htmlFor="lastName" className={styles.label}>
                Last name *
              </label>
              <input
                id="lastName"
                className={styles.input}
                type="text"
                placeholder="Enter your last name"
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

            {/* Gender */}
            <div className={styles.formGroup}>
              <label htmlFor="gender" className={styles.label}>
                Gender *
              </label>
              <select
                id="gender"
                className={styles.input}
                value={gender}
                onChange={(e) => {
                  setGender(e.target.value);
                  if (e.target.value) {
                    setErrors((prev) => ({ ...prev, gender: "" }));
                  }
                }}
              >
                <option value="">Select your gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              {errors.gender && (
                <span className={styles.error}>{errors.gender}</span>
              )}
            </div>

            {/* Phone */}
            <div className={styles.formGroup}>
              <label htmlFor="phone" className={styles.label}>
                Phone number *
              </label>
              <input
                id="phone"
                className={styles.input}
                type="tel"
                placeholder="Enter your phone number"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (e.target.value.trim()) {
                    setErrors((prev) => ({ ...prev, phone: "" }));
                  }
                }}
              />
              {errors.phone && (
                <span className={styles.error}>{errors.phone}</span>
              )}
            </div>

            {/* Email */}
            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>
                Email address *
              </label>
              <input
                id="email"
                className={styles.input}
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (e.target.value.trim()) {
                    setErrors((prev) => ({ ...prev, email: "" }));
                  }
                }}
              />
              {errors.email && (
                <span className={styles.error}>{errors.email}</span>
              )}
            </div>

            {/* Password */}
            <div className={styles.formGroup}>
              <label htmlFor="password" className={styles.label}>
                Password *
              </label>
              <div className={styles.passwordWrapper}>
                <input
                  id="password"
                  className={styles.input}
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (e.target.value.trim()) {
                      setErrors((prev) => ({ ...prev, password: "" }));
                    }
                  }}
                />
                <span
                  className={styles.toggleEye}
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
            <div className={styles.formGroup}>
              <label htmlFor="confirmPassword" className={styles.label}>
                Confirm password *
              </label>
              <div className={styles.passwordWrapper}>
                <input
                  id="confirmPassword"
                  className={styles.input}
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (e.target.value.trim()) {
                      setErrors((prev) => ({ ...prev, confirmPassword: "" }));
                    }
                  }}
                />
                <span
                  className={styles.toggleEye}
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                >
                  {showConfirmPassword ? <FaRegEyeSlash /> : <FaRegEye />}
                </span>
              </div>
              {errors.confirmPassword && (
                <span className={styles.error}>{errors.confirmPassword}</span>
              )}
            </div>

            {/* Terms and Conditions */}
            <div className={styles.termsGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => {
                    setAcceptedTerms(e.target.checked);
                    if (e.target.checked) {
                      setErrors((prev) => ({ ...prev, terms: "" }));
                    }
                  }}
                  className={styles.checkbox}
                />
                <span>
                  I have read and agree to the{" "}
                  <Link to="/terms" className={styles.link}>
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link to="/privacy" className={styles.link}>
                    Privacy Policy
                  </Link>
                </span>
              </label>
              {errors.terms && (
                <span className={styles.error}>{errors.terms}</span>
              )}
            </div>

            {/* Server Error */}
            {errors.server && (
              <div className={styles.serverError}>{errors.server}</div>
            )}

            {/* Submit Button */}
            <button
              className={`${styles.submitButton} ${
                isFormValid() && !loading ? styles.active : ""
              }`}
              type="submit"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>

            {/* Login Link */}
            <div className={styles.loginLink}>
              Already have an account?{" "}
              <Link to="/login" className={styles.link}>
                Sign in
              </Link>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default RegisterForm;
