import axiosInstance from "./axios.instance";
import {
  PlaceOrderRequest,
  PlaceOrderResponse,
  Order,
  OrderListResponse,
} from "../types/order.types";

/**
 * Place a new order from user's cart
 * POST /api/orders/place/
 */
export const placeOrder = async (
  orderData: PlaceOrderRequest
): Promise<PlaceOrderResponse> => {
  try {
    const response = await axiosInstance.post<PlaceOrderResponse>(
      "/api/orders/place/",
      orderData
    );
    return response.data;
  } catch (error: any) {
    // Re-throw the original error to preserve response data
    throw error;
  }
};

/**
 * Get user's order history
 * GET /api/orders/
 */
export const getUserOrders = async (
  page: number = 1,
  pageSize: number = 10
): Promise<OrderListResponse> => {
  try {
    const response = await axiosInstance.get<OrderListResponse>(
      "/api/orders/",
      {
        params: {
          page,
          page_size: pageSize,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    if (error.response?.data) {
      throw new Error(error.response.data.error || "Failed to fetch orders");
    }
    throw new Error("Network error. Please try again.");
  }
};

/**
 * Get order details by ID
 * GET /api/orders/{id}/
 */
export const getOrderById = async (orderId: number): Promise<Order> => {
  try {
    const response = await axiosInstance.get<Order>(`/api/orders/${orderId}/`);
    return response.data;
  } catch (error: any) {
    if (error.response?.data) {
      throw new Error(
        error.response.data.error || "Failed to fetch order details"
      );
    }
    throw new Error("Network error. Please try again.");
  }
};

/**
 * Cancel an order
 * POST /api/orders/{id}/cancel/
 */
export const cancelOrder = async (
  orderId: number
): Promise<{ message: string; order: Order }> => {
  try {
    const response = await axiosInstance.post<{
      message: string;
      order: Order;
    }>(`/api/orders/${orderId}/cancel/`);
    return response.data;
  } catch (error: any) {
    if (error.response?.data) {
      throw new Error(error.response.data.error || "Failed to cancel order");
    }
    throw new Error("Network error. Please try again.");
  }
};
