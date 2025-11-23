export interface GroupOrderMember {
  id: number;
  user_email: string;
  user_name: string;
  is_creator: boolean;
  joined_at: string;
}

export interface GroupOrderItem {
  id: number;
  user_id: number;
  user_email: string;
  user_name: string;
  product_id: number;
  product_name: string;
  unit_price: number;
  quantity: number;
  line_total: number;
  is_active: boolean;
  created_at: string;
}

export interface GroupOrder {
  id: number;
  creator_id: number;
  creator_email: string;
  restaurant_id: number;
  code: string;
  status: "PENDING" | "PAID" | "CANCELLED";
  members: GroupOrderMember[];
  items: GroupOrderItem[];
  total_items: number;
  created_at: string;
  updated_at: string;
}

export interface CreateGroupOrderResponse {
  id: number;
  creator_id: number;
  creator_email: string;
  restaurant_id: number;
  code: string;
  status: string;
  members: GroupOrderMember[];
  items: GroupOrderItem[];
  total_items: number;
  created_at: string;
  updated_at: string;
}

export interface JoinGroupOrderRequest {
  code: string;
}

export interface JoinGroupOrderResponse {
  message: string;
  group_order: GroupOrder;
}

export interface AddGroupOrderItemRequest {
  product_id: number;
  quantity: number;
}

export interface UpdateGroupOrderItemRequest {
  quantity: number;
}

export interface PlaceGroupOrderRequest {
  address_id: number;
  payment_method: "CARD" | "CASH" | "WALLET" | "THIRD_PARTY";
  type?: "DELIVERY" | "PICKUP";
  delivery_fee?: number;
  discount?: number;
}

export interface PlaceGroupOrderResponse {
  message: string;
  order: {
    id: number;
    user_email: string;
    restaurant_id: number;
    type: string;
    subtotal: string;
    delivery_fee: string;
    discount: string;
    total: string;
    status: string;
    payment_method: string;
    payment_status: string;
    created_at: string;
  };
  payment?: {
    id: number;
    status: string;
    payment_url: string;
  };
}
