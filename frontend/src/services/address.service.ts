import axiosInstance from "./axios.instance";
import { API_ENDPOINTS } from "../config/api.config";

// Types
export interface Address {
  id: number;
  street: string;
  ward: string;
  province: string;
  phone: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
}

export interface CreateAddressData {
  street: string;
  ward: string;
  province: string;
  phone: string;
  is_default?: boolean;
}

export interface UpdateAddressData {
  street?: string;
  ward?: string;
  province?: string;
  phone?: string;
  is_default?: boolean;
}

export interface AddressResponse {
  success: boolean;
  message?: string;
  data?: Address;
  errors?: any;
}

export interface AddressListResponse {
  success: boolean;
  data: Address[];
  count: number;
}

// Address Service
class AddressService {
  /**
   * Get all addresses for the authenticated user
   */
  async getAddresses(): Promise<Address[]> {
    try {
      const response = await axiosInstance.get<AddressListResponse>(
        API_ENDPOINTS.ADDRESSES.LIST
      );
      
      if (response.data.success) {
        return response.data.data;
      }
      
      throw new Error("Failed to fetch addresses");
    } catch (error: any) {
      console.error("Get addresses error:", error);
      throw error.response?.data || error;
    }
  }

  /**
   * Get a single address by ID
   */
  async getAddress(id: number): Promise<Address> {
    try {
      const response = await axiosInstance.get<AddressResponse>(
        API_ENDPOINTS.ADDRESSES.DETAIL(id)
      );
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      throw new Error("Failed to fetch address");
    } catch (error: any) {
      console.error("Get address error:", error);
      throw error.response?.data || error;
    }
  }

  /**
   * Create a new address
   */
  async createAddress(data: CreateAddressData): Promise<Address> {
    try {
      const response = await axiosInstance.post<AddressResponse>(
        API_ENDPOINTS.ADDRESSES.LIST,
        data
      );
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      throw new Error("Failed to create address");
    } catch (error: any) {
      console.error("Create address error:", error);
      throw error.response?.data || error;
    }
  }

  /**
   * Update an existing address (partial update)
   */
  async updateAddress(id: number, data: UpdateAddressData): Promise<Address> {
    try {
      const response = await axiosInstance.patch<AddressResponse>(
        API_ENDPOINTS.ADDRESSES.DETAIL(id),
        data
      );
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      throw new Error("Failed to update address");
    } catch (error: any) {
      console.error("Update address error:", error);
      throw error.response?.data || error;
    }
  }

  /**
   * Delete an address (soft delete)
   */
  async deleteAddress(id: number): Promise<void> {
    try {
      const response = await axiosInstance.delete<AddressResponse>(
        API_ENDPOINTS.ADDRESSES.DETAIL(id)
      );
      
      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to delete address");
      }
    } catch (error: any) {
      console.error("Delete address error:", error);
      throw error.response?.data || error;
    }
  }

  /**
   * Set an address as default
   */
  async setDefaultAddress(id: number): Promise<Address> {
    try {
      const response = await axiosInstance.post<AddressResponse>(
        API_ENDPOINTS.ADDRESSES.SET_DEFAULT(id)
      );
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      throw new Error("Failed to set default address");
    } catch (error: any) {
      console.error("Set default address error:", error);
      throw error.response?.data || error;
    }
  }
}

export default new AddressService();
