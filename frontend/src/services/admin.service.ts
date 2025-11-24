import axiosInstance from "./axios.instance";

export interface RevenueData {
  date: string;
  revenue: number;
  order_count: number;
  payment_method?: string;
}

export interface TopProduct {
  product_id: number;
  product_name: string;
  quantity_sold: number;
  revenue: number;
}

export interface OrderRatioData {
  individual_orders_count: number;
  individual_orders_revenue: number;
  group_orders_count: number;
  group_orders_revenue: number;
  total_orders_count: number;
  total_revenue: number;
  individual_orders_percentage: number;
  group_orders_percentage: number;
  individual_revenue_percentage: number;
  group_revenue_percentage: number;
}

export interface AdminOrder {
  id: number;
  user?: {
    id: number;
    email: string;
    full_name: string;
  } | null;
  type: "DELIVERY" | "PICKUP";
  status: string;
  payment_method: string;
  payment_status: string;
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total: number;
  created_at: string;
  updated_at: string;
  group_order_id: number | null;
  is_group_order: boolean;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

const adminService = {
  // Revenue Report
  getRevenueReport: async (params?: {
    period?: "day" | "month";
    start_date?: string;
    end_date?: string;
    payment_method?: string;
  }) => {
    const response = await axiosInstance.get("/api/admin/reports/revenue/", {
      params,
    });
    return response.data;
  },

  // Top Products Report
  getTopProducts: async (params?: {
    sort_by?: "quantity" | "revenue";
    start_date?: string;
    end_date?: string;
    limit?: number;
  }) => {
    const response = await axiosInstance.get(
      "/api/admin/reports/top-products/",
      {
        params,
      }
    );
    return response.data;
  },

  // Order Ratio Report
  getOrderRatio: async () => {
    const response = await axiosInstance.get("/api/admin/reports/order-ratio/");
    return response.data as OrderRatioData;
  },

  // Get All Orders (Admin)
  getOrders: async (params?: {
    status?: string;
    payment_status?: string;
    payment_method?: string;
    type?: string;
    ordering?: string;
    page?: number;
    page_size?: number;
  }) => {
    const response = await axiosInstance.get<PaginatedResponse<AdminOrder>>(
      "/api/admin/orders/",
      {
        params,
      }
    );
    return response.data;
  },

  // Update Order Status (Admin)
  updateOrderStatus: async (orderId: number, status: string) => {
    const response = await axiosInstance.patch(
      `/api/admin/orders/${orderId}/update-status/`,
      { status }
    );
    return response.data;
  },

  // Get pending orders count
  getPendingOrdersCount: async () => {
    // Django Filter doesn't accept comma-separated values by default
    // So we'll make parallel requests for each status and sum the counts
    const pendingStatuses = ["PAID", "CONFIRMED", "PREPARING", "READY"];

    const countPromises = pendingStatuses.map(async (status) => {
      const response = await axiosInstance.get<PaginatedResponse<AdminOrder>>(
        "/api/admin/orders/",
        {
          params: {
            status,
            page_size: 1, // We only need the count
          },
        }
      );
      return response.data.count;
    });

    const counts = await Promise.all(countPromises);
    return counts.reduce((total, count) => total + count, 0);
  },
};

export default adminService;
