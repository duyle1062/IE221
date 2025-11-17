// API Configuration
export const API_CONFIG = {
  BASE_URL: (globalThis as any).process?.env?.REACT_APP_API_URL || "http://localhost:8000",
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: "access_token",
  REFRESH_TOKEN: "refresh_token",
  USER: "user",
} as const;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: "/auth/users/",
    VERIFY_EMAIL: "/auth/users/activation/",
    LOGIN: "/auth/login/jwt/create/",
    REFRESH_TOKEN: "/auth/login/jwt/refresh/",
    FORGOT_PASSWORD: "/auth/users/reset_password/",
    RESET_PASSWORD_CONFIRM: "/auth/users/reset_password_confirm/",
    GET_USER: "/auth/users/me/",
  },
  USERS: {
    PROFILE: "/api/users/profile",
    CHANGE_PASSWORD: "/api/users/change-password",
  },
  ADDRESSES: {
    LIST: "/api/addresses/",
    DETAIL: (id: number) => `/api/addresses/${id}/`,
    SET_DEFAULT: (id: number) => `/api/addresses/${id}/set-default/`,
  },
};
