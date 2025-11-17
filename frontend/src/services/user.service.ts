import axiosInstance from "./axios.instance";
import { API_ENDPOINTS } from "../config/api.config";
import { UserData, Gender } from "./auth.service";

// Types
export interface UpdateProfileData {
  firstname?: string;
  lastname?: string;
  gender?: Gender;
  phone?: string;
}

export interface ChangePasswordData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface UserProfileResponse {
  success: boolean;
  message?: string;
  data?: UserData;
  errors?: any;
}

// User Service
class UserService {
  /**
   * Get current user profile
   */
  async getProfile(): Promise<UserData> {
    try {
      const response = await axiosInstance.get<UserProfileResponse>(
        API_ENDPOINTS.USERS.PROFILE
      );
      
      if (response.data.success && response.data.data) {
        // Update localStorage with latest user data
        localStorage.setItem("user", JSON.stringify(response.data.data));
        return response.data.data;
      }
      
      throw new Error("Failed to fetch profile");
    } catch (error: any) {
      console.error("Get profile error:", error);
      throw error.response?.data || error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(data: UpdateProfileData): Promise<UserData> {
    try {
      const response = await axiosInstance.patch<UserProfileResponse>(
        API_ENDPOINTS.USERS.PROFILE,
        data
      );
      
      if (response.data.success && response.data.data) {
        // Update localStorage with updated user data
        localStorage.setItem("user", JSON.stringify(response.data.data));
        return response.data.data;
      }
      
      throw new Error("Failed to update profile");
    } catch (error: any) {
      console.error("Update profile error:", error);
      throw error.response?.data || error;
    }
  }

  /**
   * Change user password
   */
  async changePassword(data: ChangePasswordData): Promise<void> {
    try {
      const response = await axiosInstance.post<{
        success: boolean;
        message: string;
        errors?: any;
      }>(API_ENDPOINTS.USERS.CHANGE_PASSWORD, data);
      
      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to change password");
      }
    } catch (error: any) {
      console.error("Change password error:", error);
      throw error.response?.data || error;
    }
  }
}

export default new UserService();
