import axiosInstance from "./axios.instance";
import { API_ENDPOINTS, STORAGE_KEYS } from "../config/api.config";
import { AxiosError } from "axios";

// Enums
export enum UserRole {
  ADMIN = "ADMIN",
  USER = "USER",
}

export enum Gender {
  MALE = "MALE",
  FEMALE = "FEMALE",
  OTHER = "OTHER",
}

// Types
export interface RegisterData {
  email: string;
  firstname: string;
  lastname: string;
  phone: string;
  gender: Gender;
  password: string;
  re_password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
}

export interface VerifyEmailData {
  uid: string;
  token: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  uid: string;
  token: string;
  new_password: string;
  re_new_password: string;
}

export interface UserData {
  id: number;
  email: string;
  firstname: string;
  lastname: string;
  phone: string;
  gender: Gender;
  role: UserRole;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// API Error Response
export interface ApiErrorResponse {
  detail?: string;
  [key: string]: any;
}

// Auth Service
class AuthService {
  // Private helper methods
  private handleApiError(error: unknown): never {
    if (error instanceof AxiosError) {
      const errorData = error.response?.data as ApiErrorResponse;
      console.error("API Error:", {
        status: error.response?.status,
        data: errorData,
        message: error.message,
      });
    }
    throw error;
  }

  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private sanitizeUserData(data: any): UserData {
    return {
      id: data.id,
      email: data.email,
      firstname: data.firstname,
      lastname: data.lastname,
      phone: data.phone,
      gender: data.gender as Gender,
      role: data.role as UserRole,
      is_active: data.is_active,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }

  // Register new user
  async register(data: RegisterData): Promise<{ id: number; email: string }> {
    try {
      // Validate email format
      if (!this.validateEmail(data.email)) {
        throw new Error("Invalid email format");
      }

      // Validate password match
      if (data.password !== data.re_password) {
        throw new Error("Passwords do not match");
      }

      const response = await axiosInstance.post<{ id: number; email: string }>(
        API_ENDPOINTS.AUTH.REGISTER,
        data
      );
      return response.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Verify email with uid and token
  async verifyEmail(data: VerifyEmailData): Promise<void> {
    try {
      await axiosInstance.post(
        API_ENDPOINTS.AUTH.VERIFY_EMAIL,
        data
      );
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Login
  async login(data: LoginData): Promise<LoginResponse> {
    try {
      // Validate email format
      if (!this.validateEmail(data.email)) {
        throw new Error("Invalid email format");
      }

      const response = await axiosInstance.post<LoginResponse>(
        API_ENDPOINTS.AUTH.LOGIN,
        data
      );
      
      // Validate response data
      if (!response.data.access || !response.data.refresh) {
        throw new Error("Invalid login response");
      }

      // Save tokens to localStorage
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, response.data.access);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.data.refresh);
      
      return response.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Get current user info
  async getCurrentUser(): Promise<UserData> {
    try {
      const response = await axiosInstance.get<UserData>(
        API_ENDPOINTS.AUTH.GET_USER
      );
      
      // Sanitize and validate user data
      const userData = this.sanitizeUserData(response.data);
      
      // Save user data to localStorage
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
      
      return userData;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Forgot password - send reset email
  async forgotPassword(data: ForgotPasswordData): Promise<void> {
    try {
      // Validate email format
      if (!this.validateEmail(data.email)) {
        throw new Error("Invalid email format");
      }

      await axiosInstance.post(
        API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
        data
      );
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Reset password confirm with uid and token
  async resetPassword(data: ResetPasswordData): Promise<void> {
    try {
      // Validate password match
      if (data.new_password !== data.re_new_password) {
        throw new Error("Passwords do not match");
      }

      // Validate password strength (minimum 6 characters)
      if (data.new_password.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }

      await axiosInstance.post(
        API_ENDPOINTS.AUTH.RESET_PASSWORD_CONFIRM,
        data
      );
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Logout
  async logout(): Promise<void> {
    try {
      const refreshToken = this.getRefreshToken();
      
      // Call backend logout API to blacklist refresh token
      if (refreshToken) {
        try {
          await axiosInstance.post("/api/auth/logout/", {
            refresh_token: refreshToken,
          });
        } catch (error) {
          // Even if API call fails, still clear local storage
          console.error("Logout API error (continuing with local logout):", error);
        }
      }
      
      // Clear all auth data from localStorage
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
    } catch (error) {
      console.error("Error during logout:", error);
      // Always clear localStorage even if API fails
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      return !!token;
    } catch (error) {
      console.error("Error checking authentication:", error);
      return false;
    }
  }

  // Get user from localStorage
  getUser(): UserData | null {
    try {
      const userStr = localStorage.getItem(STORAGE_KEYS.USER);
      if (!userStr) return null;
      
      const userData = JSON.parse(userStr);
      return this.sanitizeUserData(userData);
    } catch (error) {
      console.error("Error getting user data:", error);
      return null;
    }
  }

  // Check if user is admin
  isAdmin(): boolean {
    const user = this.getUser();
    return user?.role === UserRole.ADMIN;
  }

  // Get user role
  getUserRole(): UserRole | null {
    const user = this.getUser();
    return user?.role || null;
  }

  // Get access token
  getAccessToken(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    } catch (error) {
      console.error("Error getting access token:", error);
      return null;
    }
  }

  // Get refresh token
  getRefreshToken(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.error("Error getting refresh token:", error);
      return null;
    }
  }
}

export default new AuthService();
