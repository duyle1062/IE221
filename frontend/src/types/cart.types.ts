// Cart related types

export interface CartProduct {
  id: number;
  name: string;
  price: string | number; // Backend sends as string, convert as needed
  image_url: string; // Now required - backend always provides a value
}

export interface CartItem {
  id: number;
  product: CartProduct;
  quantity: number;
  total_item_price: number;
}

export interface Cart {
  id: number;
  items: CartItem[];
  total_price: number;
  total_items: number;
  updated_at: string;
}

export interface AddToCartData {
  product_id: number;
  quantity: number;
}

export interface UpdateCartItemData {
  quantity: number;
}

export interface CartResponse {
  id: number;
  items: CartItem[];
  total_price: number;
  total_items: number;
  updated_at: string;
}
