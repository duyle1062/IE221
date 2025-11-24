/**
 * Recommendation Service - Handles all recommendation-related API operations
 * Based on IE221 Recommendation System Documentation
 */
import axiosInstance from "./axios.instance";
import { Product } from "../types/product.types";

interface RecommendationResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Product[];
}

interface TrackInteractionRequest {
  product_id: number;
}

interface TrackInteractionResponse {
  message: string;
  interaction_id: number;
}

interface PopularProductsParams {
  limit?: number;
}

interface SimilarProductsParams {
  limit?: number;
}

class RecommendationService {
  /**
   * Get personalized recommendations for authenticated user
   * GET /api/recommendations/?limit=10
   * Requires authentication
   * @param limit - Number of recommendations to fetch (default: 10)
   */
  async getRecommendations(limit: number = 10): Promise<Product[]> {
    try {
      const response = await axiosInstance.get<RecommendationResponse>(
        `/api/recommendations/`,
        {
          params: { limit },
        }
      );
      return response.data.results;
    } catch (error: any) {
      console.error("[Recommendation] Failed to fetch recommendations:", error);
      throw error;
    }
  }

  /**
   * Get popular products (for non-authenticated users or fallback)
   * GET /api/products/popular/?limit=8
   * Public endpoint
   * @param limit - Number of popular products to fetch (default: 8)
   */
  async getPopularProducts(params?: PopularProductsParams): Promise<Product[]> {
    try {
      const response = await axiosInstance.get<RecommendationResponse>(
        `/api/products/popular/`,
        {
          params: { limit: params?.limit || 8 },
        }
      );
      return response.data.results;
    } catch (error: any) {
      console.error(
        "[Recommendation] Failed to fetch popular products:",
        error
      );
      throw error;
    }
  }

  /**
   * Get best selling products based on order data
   * GET /api/products/best-sellers/?limit=8
   * Public endpoint
   * @param params - Optional parameters (limit, days)
   */
  async getBestSellers(params?: { limit?: number; days?: number }): Promise<Product[]> {
    try {
      const response = await axiosInstance.get<RecommendationResponse>(
        `/api/products/best-sellers/`,
        {
          params: {
            limit: params?.limit || 8,
            ...(params?.days && { days: params.days }),
          },
        }
      );
      return response.data.results;
    } catch (error: any) {
      console.error(
        "[Recommendation] Failed to fetch best sellers:",
        error
      );
      throw error;
    }
  }

  /**
   * Get similar products based on a specific product
   * GET /api/recommendations/similar/{product_id}/?limit=6
   * Public endpoint
   * @param productId - ID of the product to find similar items for
   * @param params - Optional parameters (limit)
   */
  async getSimilarProducts(
    productId: number,
    params?: SimilarProductsParams
  ): Promise<Product[]> {
    try {
      const response = await axiosInstance.get<RecommendationResponse>(
        `/api/recommendations/similar/${productId}/`,
        {
          params: { limit: params?.limit || 6 },
        }
      );
      return response.data.results;
    } catch (error: any) {
      console.error(
        `[Recommendation] Failed to fetch similar products for product ${productId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Track user interaction with a product (click, view)
   * POST /api/recommendations/track_interaction/
   * Requires authentication
   * @param productId - ID of the product being interacted with
   */
  async trackInteraction(productId: number): Promise<void> {
    try {
      const payload: TrackInteractionRequest = {
        product_id: productId,
      };

      await axiosInstance.post<TrackInteractionResponse>(
        `/api/recommendations/track_interaction/`,
        payload
      );
    } catch (error: any) {
      // Don't throw error for tracking failures - fail silently
      console.warn(
        `[Recommendation] Failed to track interaction for product ${productId}:`,
        error.response?.data || error.message
      );
    }
  }

  /**
   * Helper method to get primary image or first image
   * @param product - Product object with images array
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
  formatPrice(price: string | number): string {
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    return `${numPrice.toLocaleString("vi-VN")}₫`;
  }
}

export default new RecommendationService();
