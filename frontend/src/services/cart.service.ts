import axiosInstance from "./axios.instance";
import { API_ENDPOINTS } from "../config/api.config";
import {
  Cart,
  AddToCartData,
  UpdateCartItemData,
  CartResponse,
} from "../types/cart.types";

/**
 * Cart Service - Handles all cart-related API operations
 * Following enterprise best practices with proper error handling and type safety
 */
class CartService {
  /**
   * Get current user's cart
   * GET /api/cart/
   */
  async getCart(): Promise<Cart> {
    try {
      const response = await axiosInstance.get<CartResponse>(
        API_ENDPOINTS.CART.GET
      );
      return response.data;
    } catch (error: any) {
      console.error("Get cart error:", error);
      throw error.response?.data || error;
    }
  }

  /**
   * Add item to cart
   * POST /api/cart/items/
   * @param data - Product ID and quantity
   */
  async addToCart(data: AddToCartData): Promise<Cart> {
    try {
      const response = await axiosInstance.post<CartResponse>(
        API_ENDPOINTS.CART.ADD_ITEM,
        data
      );
      return response.data;
    } catch (error: any) {
      console.error("Add to cart error:", error);
      throw error.response?.data || error;
    }
  }

  /**
   * Update cart item quantity
   * PATCH /api/cart/items/{id}/
   * @param itemId - Cart item ID
   * @param data - New quantity
   */
  async updateCartItem(
    itemId: number,
    data: UpdateCartItemData
  ): Promise<Cart> {
    try {
      const response = await axiosInstance.patch<CartResponse>(
        API_ENDPOINTS.CART.UPDATE_ITEM(itemId),
        data
      );
      return response.data;
    } catch (error: any) {
      console.error("Update cart item error:", error);
      throw error.response?.data || error;
    }
  }

  /**
   * Delete item from cart
   * DELETE /api/cart/items/{id}/
   * @param itemId - Cart item ID
   */
  async deleteCartItem(itemId: number): Promise<void> {
    try {
      await axiosInstance.delete(API_ENDPOINTS.CART.DELETE_ITEM(itemId));
    } catch (error: any) {
      console.error("Delete cart item error:", error);
      throw error.response?.data || error;
    }
  }

  /**
   * Helper method to increase quantity of cart item
   */
  async increaseQuantity(itemId: number, currentQuantity: number): Promise<Cart> {
    return this.updateCartItem(itemId, { quantity: currentQuantity + 1 });
  }

  /**
   * Helper method to decrease quantity of cart item
   */
  async decreaseQuantity(itemId: number, currentQuantity: number): Promise<Cart> {
    if (currentQuantity <= 1) {
      throw new Error("Quantity cannot be less than 1");
    }
    return this.updateCartItem(itemId, { quantity: currentQuantity - 1 });
  }
}

export default new CartService();
