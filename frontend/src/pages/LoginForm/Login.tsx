import React, { useState } from "react";
import styles from "./Login.module.css";
import { Link } from "react-router-dom";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import Header from "../../components/Header/Header";

interface Errors {
  email?: string;
  password?: string;
}

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errors, setErrors] = useState<Errors>({});

  const isFormValid = (): boolean => {
    return email.trim() !== "" && password.trim() !== "";
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newErrors: Errors = {};

    if (!email.trim()) newErrors.email = "Required";
    if (!password.trim()) newErrors.password = "Required";

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      alert("Success");
    }
  };

  return (
    <>
      <Header />
      <div className={styles.container}>
        {/* Form */}
        <form
          action=""
          className={styles.wrapper}
          onSubmit={handleSubmit}
          noValidate
        >
          {/* Header */}
          <h1 className={styles.header}>Sign in</h1>

          {/* Email */}
          <div className={styles["form-email"]}>
            <label htmlFor="" className={styles["form-email-text"]}>
              Email
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
            {errors.email && (
              <span className={styles.error}>{errors.email}</span>
            )}
          </div>

          {/* Password */}
          <div className={styles["form-password"]}>
            <label htmlFor="" className={styles["form-password-text"]}>
              Password
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

          {/* Forgot Password */}
          <div className={styles["form-forgot-password"]}>
            <a href="#">Forgot password</a>
          </div>

          {/* Button */}
          <button
            className={`${styles["form-button"]} ${
              isFormValid() ? styles["active"] : ""
            }`}
            type="submit"
          >
            Sign in
          </button>

          {/* Register Navigate */}
          <div className={styles["form-navigate-register"]}>
            <label htmlFor="" className={styles["form-navigate-text"]}>
              Have no account?{" "}
              <Link to="/register" className={styles["form-navigate-link"]}>
                Sign up
              </Link>
            </label>
          </div>
        </form>
      </div>
    </>
  );
};

export default LoginForm;
