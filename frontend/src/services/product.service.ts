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
    slug: string;
    description: string;
    price: number;
    category: number;
    restaurant: number; // Changed from string to number
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
   * Get presigned URLs for multiple image uploads (batch)
   * POST /api/products/{productId}/images/presigned-url/
   */
  async getPresignedUrls(
    productId: number,
    files: Array<{ filename: string; content_type: string }>
  ): Promise<any> {
    try {
      const payload = {
        files: files,
        "content-type": files[0]?.content_type || "image/jpeg"
      };

      const response = await axiosInstance.post(
        `/api/products/${productId}/images/presigned-url/`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      return response.data;
    } catch (error: any) {
      console.error("Get presigned URLs error:", error);
      console.error("Error response:", error.response?.data);
      throw error;
    }
  }

  /**
   * Confirm image uploads (batch)
   * POST /api/products/{productId}/images/confirm-upload/
   */
  async confirmUpload(
    productId: number,
    data: {
      uploads: Array<{
        s3_key: string;
        is_primary: boolean;
        sort_order: number;
      }>;
    }
  ): Promise<any> {
    try {
      console.log(`Confirming ${data.uploads.length} uploads with productId: ${productId}`);
      console.log("Upload data:", data);
      const response = await axiosInstance.post(
        `/api/products/${productId}/images/confirm-upload/`,
        data
      );
      return response.data;
    } catch (error: any) {
      console.error("Confirm upload error:", error);
      console.error("Error response data:", error.response?.data);
      console.error("Error response status:", error.response?.status);
      console.error("Request data was:", data);
      throw error;
    }
  }

  /**
   * Delete product image
   * DELETE /api/products/{productId}/images/{imageId}/
   */
  async deleteProductImage(
    productId: number,
    imageId: number
  ): Promise<any> {
    try {
      const response = await axiosInstance.delete(
        `/api/products/${productId}/images/${imageId}/`
      );
      return response.data;
    } catch (error: any) {
      console.error("Delete image error:", error);
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
