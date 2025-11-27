/**
 * Validation utilities for form inputs
 * Enterprise-ready with comprehensive validation rules
 */

export const ValidationRules = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: "Please enter a valid email address",
    minLength: 5,
    maxLength: 254,
  },
  password: {
    minLength: 6,
    maxLength: 128,
    pattern: {
      weak: /^.{6,}$/, // At least 6 characters
      medium: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, // 8+ chars, uppercase, lowercase, number
      strong: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/, // 8+ chars, uppercase, lowercase, number, special char
    },
    messages: {
      minLength: "Password must be at least 6 characters",
      weak: "Password is too weak",
      medium: "Password should contain uppercase, lowercase and numbers",
      strong: "Strong password required (uppercase, lowercase, number, special character)",
    },
  },
  phone: {
    pattern: /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/,
    message: "Please enter a valid phone number",
    minLength: 10,
    maxLength: 15,
  },
  name: {
    pattern: /^[a-zA-Z\s\u00C0-\u024F\u1E00-\u1EFF]{2,}$/,
    message: "Name must contain only letters and spaces",
    minLength: 2,
    maxLength: 50,
  },
};

export const validate = {
  email: (value: string): string | null => {
    if (!value || !value.trim()) {
      return "Email is required";
    }
    if (value.length < ValidationRules.email.minLength) {
      return "Email is too short";
    }
    if (value.length > ValidationRules.email.maxLength) {
      return "Email is too long";
    }
    if (!ValidationRules.email.pattern.test(value)) {
      return ValidationRules.email.message;
    }
    return null;
  },

  password: (value: string, strength: "weak" | "medium" | "strong" = "weak"): string | null => {
    if (!value || !value.trim()) {
      return "Password is required";
    }
    if (value.length < ValidationRules.password.minLength) {
      return ValidationRules.password.messages.minLength;
    }
    if (value.length > ValidationRules.password.maxLength) {
      return "Password is too long";
    }
    if (!ValidationRules.password.pattern[strength].test(value)) {
      return ValidationRules.password.messages[strength];
    }
    return null;
  },

  confirmPassword: (password: string, confirmPassword: string): string | null => {
    if (!confirmPassword || !confirmPassword.trim()) {
      return "Please confirm your password";
    }
    if (password !== confirmPassword) {
      return "Passwords do not match";
    }
    return null;
  },

  phone: (value: string): string | null => {
    if (!value || !value.trim()) {
      return "Phone number is required";
    }
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length < ValidationRules.phone.minLength) {
      return "Phone number is too short";
    }
    if (cleaned.length > ValidationRules.phone.maxLength) {
      return "Phone number is too long";
    }
    if (!ValidationRules.phone.pattern.test(value)) {
      return ValidationRules.phone.message;
    }
    return null;
  },

  name: (value: string, fieldName: string = "Name"): string | null => {
    if (!value || !value.trim()) {
      return `${fieldName} is required`;
    }
    if (value.length < ValidationRules.name.minLength) {
      return `${fieldName} must be at least ${ValidationRules.name.minLength} characters`;
    }
    if (value.length > ValidationRules.name.maxLength) {
      return `${fieldName} must not exceed ${ValidationRules.name.maxLength} characters`;
    }
    if (!ValidationRules.name.pattern.test(value)) {
      return ValidationRules.name.message;
    }
    return null;
  },

  required: (value: any, fieldName: string = "This field"): string | null => {
    if (value === null || value === undefined || value === "") {
      return `${fieldName} is required`;
    }
    if (typeof value === "string" && !value.trim()) {
      return `${fieldName} is required`;
    }
    return null;
  },

  minLength: (value: string, min: number, fieldName: string = "This field"): string | null => {
    if (value && value.length < min) {
      return `${fieldName} must be at least ${min} characters`;
    }
    return null;
  },

  maxLength: (value: string, max: number, fieldName: string = "This field"): string | null => {
    if (value && value.length > max) {
      return `${fieldName} must not exceed ${max} characters`;
    }
    return null;
  },

  pattern: (value: string, pattern: RegExp, message: string): string | null => {
    if (value && !pattern.test(value)) {
      return message;
    }
    return null;
  },
};

// Sanitize inputs
export const sanitize = {
  email: (value: string): string => {
    return value.toLowerCase().trim();
  },

  name: (value: string): string => {
    return value.trim().replace(/\s+/g, " ");
  },

  phone: (value: string): string => {
    return value.replace(/[^\d+\-\s()]/g, "");
  },

  removeHtml: (value: string): string => {
    return value.replace(/<[^>]*>/g, "");
  },

  removeSpecialChars: (value: string): string => {
    return value.replace(/[^a-zA-Z0-9\s]/g, "");
  },
};

// Check password strength
export const getPasswordStrength = (
  password: string
): { score: number; label: string; color: string } => {
  let score = 0;

  if (!password) {
    return { score: 0, label: "None", color: "#ccc" };
  }

  // Length
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;

  // Character types
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[@$!%*?&]/.test(password)) score++;

  // Return strength
  if (score <= 2) return { score, label: "Weak", color: "#ff4444" };
  if (score <= 4) return { score, label: "Medium", color: "#ffa500" };
  return { score, label: "Strong", color: "#00c851" };
};
