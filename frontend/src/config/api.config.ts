// API Configuration
export const API_CONFIG = {
  BASE_URL:
    (globalThis as any).process?.env?.REACT_APP_API_URL ||
    "https://api.liaman.link",
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
    REGISTER: "/api/auth/users/",
    VERIFY_EMAIL: "/api/auth/users/activation/",
    LOGIN: "/api/auth/login/jwt/create/",
    REFRESH_TOKEN: "/api/auth/login/jwt/refresh/",
    FORGOT_PASSWORD: "/api/auth/users/reset_password/",
    RESET_PASSWORD_CONFIRM: "/api/auth/users/reset_password_confirm/",
    GET_USER: "/api/auth/users/me/",
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
  CART: {
    GET: "/api/cart/",
    ADD_ITEM: "/api/cart/items/",
    UPDATE_ITEM: (id: number) => `/api/cart/items/${id}/`,
    DELETE_ITEM: (id: number) => `/api/cart/items/${id}/`,
  },
  RATINGS: {
    LIST: (productId: number) => `/api/products/${productId}/ratings/`,
    CREATE: (productId: number) => `/api/products/${productId}/ratings/`,
  },
  RECOMMENDATIONS: {
    GET_RECOMMENDATIONS: "/api/recommendations/",
    GET_POPULAR: "/api/products/popular/",
    GET_SIMILAR: (productId: number) =>
      `/api/recommendations/similar/${productId}/`,
    TRACK_INTERACTION: "/api/recommendations/track_interaction/",
    MY_INTERACTIONS: "/api/interactions/my/",
  },
  ADMIN: {
    USERS: {
      LIST: "/api/admin/users/",
      DETAIL: (id: number) => `/api/admin/users/${id}/`,
      DELETE: (id: number) => `/api/admin/users/${id}/`,
    },
  },
};
