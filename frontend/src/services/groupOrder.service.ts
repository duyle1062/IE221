import axiosInstance from "./axios.instance";
import {
  GroupOrder,
  CreateGroupOrderResponse,
  JoinGroupOrderRequest,
  JoinGroupOrderResponse,
  AddGroupOrderItemRequest,
  UpdateGroupOrderItemRequest,
  PlaceGroupOrderRequest,
  PlaceGroupOrderResponse,
  GroupOrderMember,
  GroupOrderItem,
} from "../types/groupOrder.types";

/**
 * Create a new group order
 * POST /api/group-orders/
 */
export const createGroupOrder = async (): Promise<CreateGroupOrderResponse> => {
  try {
    const response = await axiosInstance.post<CreateGroupOrderResponse>(
      "/api/group-orders/"
    );
    return response.data;
  } catch (error: any) {
    if (error.response?.data) {
      throw new Error(
        error.response.data.error || "Failed to create group order"
      );
    }
    throw new Error("Network error. Please try again.");
  }
};

/**
 * Join an existing group order using code
 * POST /api/group-orders/join/
 */
export const joinGroupOrder = async (
  data: JoinGroupOrderRequest
): Promise<JoinGroupOrderResponse> => {
  try {
    const response = await axiosInstance.post<JoinGroupOrderResponse>(
      "/api/group-orders/join/",
      data
    );
    return response.data;
  } catch (error: any) {
    if (error.response?.data) {
      throw new Error(
        error.response.data.error || "Failed to join group order"
      );
    }
    throw new Error("Network error. Please try again.");
  }
};

/**
 * Get group order details
 * GET /api/group-orders/{id}/
 */
export const getGroupOrderDetail = async (
  groupOrderId: number
): Promise<GroupOrder> => {
  try {
    const response = await axiosInstance.get<GroupOrder>(
      `/api/group-orders/${groupOrderId}/`
    );
    return response.data;
  } catch (error: any) {
    if (error.response?.data) {
      throw new Error(
        error.response.data.error || "Failed to get group order details"
      );
    }
    throw new Error("Network error. Please try again.");
  }
};

/**
 * Get all members in a group order
 * GET /api/group-orders/{id}/members/
 */
export const getGroupOrderMembers = async (
  groupOrderId: number
): Promise<GroupOrderMember[]> => {
  try {
    const response = await axiosInstance.get<GroupOrderMember[]>(
      `/api/group-orders/${groupOrderId}/members/`
    );
    return response.data;
  } catch (error: any) {
    if (error.response?.data) {
      throw new Error(
        error.response.data.error || "Failed to get group order members"
      );
    }
    throw new Error("Network error. Please try again.");
  }
};

/**
 * Get all items in a group order
 * GET /api/group-orders/{id}/items/
 */
export const getGroupOrderItems = async (
  groupOrderId: number
): Promise<GroupOrderItem[]> => {
  try {
    const response = await axiosInstance.get<GroupOrderItem[]>(
      `/api/group-orders/${groupOrderId}/items/`
    );
    return response.data;
  } catch (error: any) {
    if (error.response?.data) {
      throw new Error(
        error.response.data.error || "Failed to get group order items"
      );
    }
    throw new Error("Network error. Please try again.");
  }
};

/**
 * Add an item to group order
 * POST /api/group-orders/{id}/items/
 */
export const addGroupOrderItem = async (
  groupOrderId: number,
  data: AddGroupOrderItemRequest
): Promise<GroupOrderItem> => {
  try {
    const response = await axiosInstance.post<GroupOrderItem>(
      `/api/group-orders/${groupOrderId}/items/`,
      data
    );
    return response.data;
  } catch (error: any) {
    if (error.response?.data) {
      throw new Error(error.response.data.error || "Failed to add item");
    }
    throw new Error("Network error. Please try again.");
  }
};

/**
 * Update a group order item quantity
 * PATCH /api/group-orders/{id}/items/{itemId}/
 */
export const updateGroupOrderItem = async (
  groupOrderId: number,
  itemId: number,
  data: UpdateGroupOrderItemRequest
): Promise<GroupOrderItem> => {
  try {
    const response = await axiosInstance.patch<GroupOrderItem>(
      `/api/group-orders/${groupOrderId}/items/${itemId}/`,
      data
    );
    return response.data;
  } catch (error: any) {
    if (error.response?.data) {
      throw new Error(error.response.data.error || "Failed to update item");
    }
    throw new Error("Network error. Please try again.");
  }
};

/**
 * Remove a group order item
 * DELETE /api/group-orders/{id}/items/{itemId}/
 */
export const removeGroupOrderItem = async (
  groupOrderId: number,
  itemId: number
): Promise<{ message: string }> => {
  try {
    const response = await axiosInstance.delete<{ message: string }>(
      `/api/group-orders/${groupOrderId}/items/${itemId}/`
    );
    return response.data;
  } catch (error: any) {
    if (error.response?.data) {
      throw new Error(error.response.data.error || "Failed to remove item");
    }
    throw new Error("Network error. Please try again.");
  }
};

/**
 * Place the group order (finalize and create payment)
 * POST /api/group-orders/{id}/place/
 */
export const placeGroupOrder = async (
  groupOrderId: number,
  data: PlaceGroupOrderRequest
): Promise<PlaceGroupOrderResponse> => {
  try {
    const response = await axiosInstance.post<PlaceGroupOrderResponse>(
      `/api/group-orders/${groupOrderId}/place/`,
      data
    );
    return response.data;
  } catch (error: any) {
    if (error.response?.data) {
      throw new Error(
        error.response.data.error || "Failed to place group order"
      );
    }
    throw new Error("Network error. Please try again.");
  }
};

/**
 * Leave a group order
 * POST /api/group-orders/{id}/leave/
 * If creator: cancels entire group
 * If member: removes member and their items
 */
export const leaveGroupOrder = async (
  groupOrderId: number
): Promise<{
  message: string;
  cancelled: boolean;
  deleted_items_count?: number;
}> => {
  try {
    const response = await axiosInstance.post(
      `/api/group-orders/${groupOrderId}/leave/`
    );
    return response.data;
  } catch (error: any) {
    if (error.response?.data) {
      throw new Error(
        error.response.data.error || "Failed to leave group order"
      );
    }
    throw new Error("Network error. Please try again.");
  }
};

/**
 * Remove a member from group order (creator only)
 * DELETE /api/group-orders/{id}/members/{memberId}/
 */
export const removeMember = async (
  groupOrderId: number,
  memberId: number
): Promise<{ message: string; deleted_items_count: number }> => {
  try {
    const response = await axiosInstance.delete(
      `/api/group-orders/${groupOrderId}/members/${memberId}/`
    );
    return response.data;
  } catch (error: any) {
    if (error.response?.data) {
      throw new Error(error.response.data.error || "Failed to remove member");
    }
    throw new Error("Network error. Please try again.");
  }
};

export default {
  createGroupOrder,
  joinGroupOrder,
  getGroupOrderDetail,
  getGroupOrderMembers,
  getGroupOrderItems,
  addGroupOrderItem,
  updateGroupOrderItem,
  removeGroupOrderItem,
  placeGroupOrder,
  leaveGroupOrder,
  removeMember,
};
