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
    
    const primaryImage = product.images.find(img => img.is_primary);
    if (primaryImage) {
      return primaryImage.image_url;
    }
    
    return product.images[0]?.image_url || "https://via.placeholder.com/300x300?text=No+Image";
  }

  /**
   * Format price to Vietnamese currency
   * @param price - Price string from API
   */
  formatPrice(price: string): string {
    const numPrice = parseFloat(price);
    return `${numPrice.toLocaleString("vi-VN")}₫`;
  }
}

export default new ProductService();
