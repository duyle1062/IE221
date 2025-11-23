export interface OrderItem {
  id: number;
  product: {
    id: number;
    name: string;
    price: number;
    image_url?: string;
  };
  product_name: string;
  unit_price: number;
  quantity: number;
  line_total: number;
  created_at: string;
}

export interface OrderAddress {
  id: number;
  street: string;
  ward: string;
  province: string;
  phone: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
}

export interface Order {
  id: number;
  user_email: string;
  restaurant_id: number;
  address: OrderAddress | null;
  type: "DELIVERY" | "PICKUP";
  subtotal: string;
  delivery_fee: string;
  discount: string;
  total: string;
  status: string;
  payment_method: "CARD" | "CASH" | "WALLET" | "THIRD_PARTY";
  payment_status: string;
  items: OrderItem[];
  group_order_id?: number | null;
  is_group_order?: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlaceOrderRequest {
  address_id: number;
  payment_method: "CARD" | "CASH" | "WALLET" | "THIRD_PARTY";
  type?: "DELIVERY" | "PICKUP";
  delivery_fee?: number;
  discount?: number;
}

export interface PlaceOrderResponse {
  message: string;
  order?: Order;
  payment?: {
    id: number;
    status: string;
    payment_url: string;
  };
}

export interface OrderListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Order[];
}
