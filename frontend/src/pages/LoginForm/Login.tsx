import React, { useState } from "react";
import styles from "./Login.module.css";
import { Link, useNavigate } from "react-router-dom";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import { FaApple, FaGoogle } from "react-icons/fa";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import { useAuth } from "../../context/AuthContext";
import authService, { UserRole } from "../../services/auth.service";
import logoImage from "../../assets/images/Logo_FastFood.png";

interface Errors {
  email?: string;
  password?: string;
  server?: string;
}

const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState<boolean>(false);

  const isFormValid = (): boolean => {
    return email.trim() !== "" && password.trim() !== "";
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newErrors: Errors = {};

    if (!email.trim()) newErrors.email = "Required";
    if (!password.trim()) newErrors.password = "Required";

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setLoading(true);
      try {
        await login(email, password);

        // Get user data from auth service after login
        const userData = await authService.getCurrentUser();

        // Redirect based on user role
        if (userData.role === UserRole.ADMIN) {
          navigate("/dashboard");
        } else {
          navigate("/");
        }
      } catch (error: any) {
        console.error("Login error:", error);

        if (error.response?.data) {
          const serverErrors = error.response.data;

          if (serverErrors.detail) {
            setErrors({ server: serverErrors.detail });
          } else if (serverErrors.non_field_errors) {
            setErrors({
              server: Array.isArray(serverErrors.non_field_errors)
                ? serverErrors.non_field_errors[0]
                : serverErrors.non_field_errors,
            });
          } else {
            setErrors({ server: "Invalid email or password" });
          }
        } else {
          setErrors({
            server: "Your account does not exist. Please try again later!",
          });
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSocialLogin = (provider: string) => {
    // TODO: Implement OAuth login
    console.log(`Login with ${provider}`);
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
            <h1 className={styles.header}>SIGN IN</h1>

            {/* Email */}
            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>
                Your email address *
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

            {/* Forgot Password */}
            <div className={styles.forgotPassword}>
              <Link to="/forget-password">Forgot password?</Link>
            </div>

            {/* Server Error */}
            {errors.server && (
              <div className={styles.serverError}>{errors.server}</div>
            )}

            {/* Sign In Button */}
            <button
              className={`${styles.submitButton} ${
                isFormValid() && !loading ? styles.active : ""
              }`}
              type="submit"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>

            {/* Divider */}
            <div className={styles.divider}>
              <span>Or continue with</span>
            </div>

            {/* Social Login Buttons */}
            <div className={styles.socialButtons}>
              <button
                type="button"
                className={`${styles.socialButton} ${styles.apple}`}
                onClick={() => handleSocialLogin("apple")}
              >
                <FaApple className={styles.socialIcon} />
                Sign in with Apple
              </button>
              <button
                type="button"
                className={`${styles.socialButton} ${styles.google}`}
                onClick={() => handleSocialLogin("google")}
              >
                <FaGoogle className={styles.socialIcon} />
                Sign in with Google
              </button>
            </div>

            {/* Register Navigate */}
            <div className={styles.registerLink}>
              Don't have an account?{" "}
              <Link to="/register" className={styles.link}>
                Sign up
              </Link>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default LoginForm;
