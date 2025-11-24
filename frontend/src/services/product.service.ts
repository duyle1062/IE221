import axiosInstance from "./axios.instance";
import { API_ENDPOINTS } from "../config/api.config";
import { Product, ProductDetailResponse } from "../types/product.types";

/**
 * Product Service - Handles all product-related API operations
 */
class ProductService {
  /**
   * Get products by category
   * GET /api/category/{slug}/products/
   * @param categorySlug - Category slug name
   * @param signal - AbortSignal to cancel request
   */
  async getProductsByCategory(
    categorySlug: string,
    signal?: AbortSignal
  ): Promise<Product[]> {
    try {
      const config = signal ? { signal } : {};
      const response = await axiosInstance.get<Product[]>(
        `/api/category/${categorySlug}/products/`,
        config
      );
      return response.data;
    } catch (error: any) {
      console.error("Get products by category error:", error);
      // Enhance error object with more details
      throw {
        ...error,
        response: error.response,
        detail: error.response?.data?.detail || error.message,
      };
    }
  }

  /**
   * Get product detail by category slug and product slug
   * GET /api/category/{categorySlug}/products/{productSlug}/
   * @param categorySlug - Category slug name
   * @param productSlug - Product slug name
   * @param signal - AbortSignal to cancel request
   */
  async getProductDetail(
    categorySlug: string,
    productSlug: string,
    signal?: AbortSignal
  ): Promise<ProductDetailResponse> {
    try {
      const config = signal ? { signal } : {};
      const response = await axiosInstance.get<ProductDetailResponse>(
        `/api/category/${categorySlug}/products/${productSlug}/`,
        config
      );
      return response.data;
    } catch (error: any) {
      console.error("Get product detail error:", error);
      // Enhance error object with more details
      throw {
        ...error,
        response: error.response,
        detail: error.response?.data?.detail || error.message,
      };
    }
  }

  /**
   * Helper method to get primary image or first image
   * @param product - Product object with images array
   * @returns Image URL or placeholder
   */
  getPrimaryImage(product: Product): string {
    if (!product.images || product.images.length === 0) {
      return "https://via.placeholder.com/300x300?text=No+Image";
    }

    const primaryImage = product.images.find((img) => img.is_primary);
    if (primaryImage) {
      return primaryImage.image_url;
    }

    return (
      product.images[0]?.image_url ||
      "https://via.placeholder.com/300x300?text=No+Image"
    );
  }

  /**
   * Format price to Vietnamese currency
   * @param price - Price string from API
   */
  formatPrice(price: string): string {
    const numPrice = parseFloat(price);
    return `${numPrice.toLocaleString("vi-VN")}₫`;
  }

  /**
   * Get all products (Admin)
   * GET /api/products/admin/products/
   */
  async getAdminProducts(params?: {
    is_active?: boolean;
    available?: boolean;
    category?: number;
    search?: string;
    include_deleted?: boolean;
    ordering?: string;
    page?: number;
    page_size?: number;
  }): Promise<any> {
    try {
      const response = await axiosInstance.get("/api/admin/products/", {
        params,
      });
      return response.data;
    } catch (error: any) {
      console.error("Get admin products error:", error);
      throw error;
    }
  }

  /**
   * Create product (Admin)
   * POST /api/products/admin/products/
   */
  async createProduct(data: {
    name: string;
    description: string;
    price: number;
    category: number;
    restaurant: string;
    is_active?: boolean;
    available?: boolean;
  }): Promise<any> {
    try {
      const response = await axiosInstance.post("/api/admin/products/", data);
      return response.data;
    } catch (error: any) {
      console.error("Create product error:", error);
      throw error;
    }
  }

  /**
   * Update product (Admin)
   * PATCH /api/products/category/{categorySlug}/products/{productId}/
   */
  async updateProduct(
    categorySlug: string,
    productId: number | string,
    data: any
  ): Promise<any> {
    try {
      const response = await axiosInstance.patch(
        `/api/category/${categorySlug}/products/${productId}/`,
        data
      );
      return response.data;
    } catch (error: any) {
      console.error("Update product error:", error);
      throw error;
    }
  }

  /**
   * Delete product (Admin)
   * DELETE /api/products/category/{categorySlug}/products/{productId}/
   */
  async deleteProduct(
    categorySlug: string,
    productId: number | string
  ): Promise<any> {
    try {
      const response = await axiosInstance.delete(
        `/api/category/${categorySlug}/products/${productId}/`
      );
      return response.data;
    } catch (error: any) {
      console.error("Delete product error:", error);
      throw error;
    }
  }

  /**
   * Get presigned URL for image upload
   * POST /api/products/products/{productId}/images/presigned-url/
   */
  async getPresignedUrl(
    productId: number,
    fileName: string,
    fileType: string
  ): Promise<any> {
    try {
      const response = await axiosInstance.post(
        `/api/products/products/${productId}/images/presigned-url/`,
        { file_name: fileName, file_type: fileType }
      );
      return response.data;
    } catch (error: any) {
      console.error("Get presigned URL error:", error);
      throw error;
    }
  }

  /**
   * Confirm image upload
   * POST /api/products/products/{productId}/images/confirm-upload/
   */
  async confirmUpload(
    productId: number,
    data: { s3_key: string; is_primary?: boolean }
  ): Promise<any> {
    try {
      const response = await axiosInstance.post(
        `/api/products/products/${productId}/images/confirm-upload/`,
        data
      );
      return response.data;
    } catch (error: any) {
      console.error("Confirm upload error:", error);
      throw error;
    }
  }

  /**
   * Search products by name
   * GET /api/products/search/
   * @param query - Search query string
   * @param params - Additional filter parameters
   */
  async searchProducts(
    query: string,
    params?: {
      is_active?: boolean;
      category?: number;
    }
  ): Promise<Product[]> {
    try {
      const response = await axiosInstance.get("/api/products/search/", {
        params: {
          name: query,
          ...params,
        },
      });
      console.log("Search API response:", response.data);
      // Check if response is paginated (has results property) or flat array
      if (response.data && Array.isArray(response.data.results)) {
        return response.data.results;
      } else if (Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (error: any) {
      console.error("Search products error:", error);
      throw error;
    }
  }
}

export default new ProductService();
