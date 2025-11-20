import axiosInstance from "./axios.instance";
import { API_ENDPOINTS } from "../config/api.config";
import { 
  Rating, 
  RatingListResponse, 
  CreateRatingData 
} from "../types/product.types";

/**
 * Rating Service - Handles all rating-related API operations
 */
class RatingService {
  /**
   * Get ratings for a product with pagination
   * GET /api/products/{productId}/ratings/
   * @param productId - Product ID
   * @param page - Page number (default: 1)
   * @param pageSize - Number of items per page (default: 10)
   * @param signal - AbortSignal to cancel request
   */
  async getRatings(
    productId: number,
    page: number = 1,
    pageSize: number = 10,
    signal?: AbortSignal
  ): Promise<RatingListResponse> {
    try {
      const config = signal ? { signal } : {};
      const response = await axiosInstance.get<RatingListResponse>(
        API_ENDPOINTS.RATINGS.LIST(productId),
        {
          ...config,
          params: {
            page,
            page_size: pageSize,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      console.error("Get ratings error:", error);
      throw {
        ...error,
        response: error.response,
        detail: error.response?.data?.detail || error.message,
      };
    }
  }

  /**
   * Create a new rating for a product
   * POST /api/products/{productId}/ratings/
   * Requires authentication
   * @param productId - Product ID
   * @param data - Rating data (rating: 1-5, comment)
   */
  async createRating(
    productId: number,
    data: CreateRatingData
  ): Promise<Rating> {
    try {
      const response = await axiosInstance.post<Rating>(
        API_ENDPOINTS.RATINGS.CREATE(productId),
        data
      );
      return response.data;
    } catch (error: any) {
      console.error("Create rating error:", error);
      console.log("Full error response:", error.response);
      
      // Let the error propagate with full context
      throw error;
    }
  }

  /**
   * Check if user has purchased the product
   * This is inferred from the create rating response
   * If the user hasn't purchased, the backend will return an error
   */
  async canUserRate(productId: number): Promise<boolean> {
    try {
      // Try to get ratings - if authenticated, backend will check purchase
      await this.getRatings(productId, 1, 1);
      return true;
    } catch (error: any) {
      // If 403 or specific error about not purchasing, return false
      if (error.response?.status === 403) {
        return false;
      }
      // For other errors, assume user can rate (will be caught on submit)
      return true;
    }
  }
}

export default new RatingService();
