import axiosInstance from "./axios.instance";
import { API_ENDPOINTS } from "../config/api.config";

export enum UserRole {
  ADMIN = "ADMIN",
  USER = "USER",
}

export enum UserGender {
  MALE = "MALE",
  FEMALE = "FEMALE",
  OTHER = "OTHER",
}

export interface AdminUser {
  id: number;
  firstname: string;
  lastname: string;
  full_name: string;
  email: string;
  phone: string;
  gender: UserGender;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  last_login: string | null;
}

export interface UserListParams {
  role?: UserRole | "all";
  page?: number;
  page_size?: number;
}

export interface UserListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: AdminUser[];
}

class AdminUserService {
  /**
   * Get list of users with optional role filter
   * @param params - Filter parameters including role, page, page_size
   */
  async getUserList(params?: UserListParams): Promise<UserListResponse> {
    try {
      const queryParams: any = {};
      
      // Only add role to query params if it's not "all"
      if (params?.role && params.role !== "all") {
        queryParams.role = params.role;
      }
      
      if (params?.page) {
        queryParams.page = params.page;
      }
      
      if (params?.page_size) {
        queryParams.page_size = params.page_size;
      }

      const response = await axiosInstance.get(
        API_ENDPOINTS.ADMIN.USERS.LIST,
        { params: queryParams }
      );
      
      // Handle both paginated and array response formats
      const responseData = response.data;
      
      // If response is an array, convert to paginated format
      if (Array.isArray(responseData)) {
        return {
          count: responseData.length,
          next: null,
          previous: null,
          results: responseData,
        };
      }
      
      // If response is already paginated format
      return responseData as UserListResponse;
    } catch (error: any) {
      console.error("Get user list error:", error);
      throw error.response?.data || error;
    }
  }

  /**
   * Get detailed information of a specific user by ID
   * @param userId - The ID of the user to retrieve
   */
  async getUserDetail(userId: number): Promise<AdminUser> {
    try {
      const response = await axiosInstance.get<AdminUser>(
        API_ENDPOINTS.ADMIN.USERS.DETAIL(userId)
      );
      
      return response.data;
    } catch (error: any) {
      console.error("Get user detail error:", error);
      throw error.response?.data || error;
    }
  }

  /**
   * Delete a user by ID (soft delete - sets deleted_at and is_active to false)
   * @param userId - The ID of the user to delete
   */
  async deleteUser(userId: number): Promise<void> {
    try {
      await axiosInstance.delete(
        API_ENDPOINTS.ADMIN.USERS.DELETE(userId)
      );
    } catch (error: any) {
      console.error("Delete user error:", error);
      throw error.response?.data || error;
    }
  }
}

const adminUserService = new AdminUserService();
export default adminUserService;
