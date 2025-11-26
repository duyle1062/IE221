import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Pagination,
  SelectChangeEvent,
  CircularProgress,
} from "@mui/material";
import { message } from "antd";
import styles from "./OrderManagement.module.css";
import adminService, { AdminOrder } from "../../../services/admin.service";

export enum OrderStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  CONFIRMED = "CONFIRMED",
  PREPARING = "PREPARING",
  READY = "READY",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED",
}

const statusLabels: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: "Pending Payment",
  [OrderStatus.PAID]: "Paid",
  [OrderStatus.CONFIRMED]: "Confirmed",
  [OrderStatus.PREPARING]: "Preparing",
  [OrderStatus.READY]: "Ready for Pickup",
  [OrderStatus.DELIVERED]: "Delivered",
  [OrderStatus.CANCELLED]: "Cancelled",
};

const statusColors: Record<
  OrderStatus,
  "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"
> = {
  [OrderStatus.PENDING]: "warning",
  [OrderStatus.PAID]: "success",
  [OrderStatus.CONFIRMED]: "info",
  [OrderStatus.PREPARING]: "warning",
  [OrderStatus.READY]: "success",
  [OrderStatus.DELIVERED]: "success",
  [OrderStatus.CANCELLED]: "error",
};

// Valid status transitions - Admins can change to any status except PENDING
// PENDING is only for unpaid orders and should not be manually set
// DELIVERED and CANCELLED are typically final, but admins can still modify if needed
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [
    OrderStatus.PAID,
    OrderStatus.CONFIRMED,
    OrderStatus.PREPARING,
    OrderStatus.READY,
    OrderStatus.DELIVERED,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.PAID]: [
    OrderStatus.CONFIRMED,
    OrderStatus.PREPARING,
    OrderStatus.READY,
    OrderStatus.DELIVERED,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.CONFIRMED]: [
    OrderStatus.PAID,
    OrderStatus.PREPARING,
    OrderStatus.READY,
    OrderStatus.DELIVERED,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.PREPARING]: [
    OrderStatus.PAID,
    OrderStatus.CONFIRMED,
    OrderStatus.READY,
    OrderStatus.DELIVERED,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.READY]: [
    OrderStatus.PAID,
    OrderStatus.CONFIRMED,
    OrderStatus.PREPARING,
    OrderStatus.DELIVERED,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.DELIVERED]: [
    OrderStatus.PAID,
    OrderStatus.CONFIRMED,
    OrderStatus.PREPARING,
    OrderStatus.READY,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.CANCELLED]: [
    OrderStatus.PAID,
    OrderStatus.CONFIRMED,
    OrderStatus.PREPARING,
    OrderStatus.READY,
    OrderStatus.DELIVERED,
  ],
};

const generateMockOrders = () => {
  const fixedOrders = [
    {
      id: 1024,
      user_email: "nguyen.van.a@gmail.com",
      type: "DELIVERY",
      subtotal: 285000,
      delivery_fee: 20000,
      discount: 0,
      total: 305000,
      status: OrderStatus.PAID,
      payment_method: "CARD",
      payment_status: "SUCCEEDED",
      created_at: "2025-11-20T14:32:10Z",
      group_order_id: 56,
    },
    {
      id: 1023,
      user_email: "tran.thi.b@gmail.com",
      type: "PICKUP",
      subtotal: 178000,
      delivery_fee: 0,
      discount: 15000,
      total: 163000,
      status: OrderStatus.PREPARING,
      payment_method: "CASH",
      payment_status: "PENDING",
      created_at: "2025-11-20T13:15:22Z",
      group_order_id: null,
    },
    {
      id: 1022,
      user_email: "pham.c@gmail.com",
      type: "DELIVERY",
      subtotal: 459000,
      delivery_fee: 25000,
      discount: 30000,
      total: 454000,
      status: OrderStatus.READY,
      payment_method: "WALLET",
      payment_status: "SUCCEEDED",
      created_at: "2025-11-20T12:08:45Z",
      group_order_id: null,
    },
    {
      id: 1021,
      user_email: "le.thanh.d@gmail.com",
      type: "DELIVERY",
      subtotal: 89000,
      delivery_fee: 20000,
      discount: 0,
      total: 109000,
      status: OrderStatus.DELIVERED,
      payment_method: "CARD",
      payment_status: "SUCCEEDED",
      created_at: "2025-11-19T19:55:30Z",
      group_order_id: null,
    },
    {
      id: 1020,
      user_email: "hoang.e@example.com",
      type: "DELIVERY",
      subtotal: 320000,
      delivery_fee: 20000,
      discount: 50000,
      total: 290000,
      status: OrderStatus.CANCELLED,
      payment_method: "CARD",
      payment_status: "REFUNDED",
      created_at: "2025-11-19T18:20:15Z",
      group_order_id: 55,
    },
  ];

  const statuses = [
    OrderStatus.PAID,
    OrderStatus.PREPARING,
    OrderStatus.READY,
    OrderStatus.DELIVERED,
    OrderStatus.CONFIRMED,
    OrderStatus.PENDING,
    OrderStatus.CANCELLED,
  ];

  const randomOrders = Array.from({ length: 30 }, (_, i) => {
    const subtotal = Math.floor(Math.random() * 400000) + 80000;
    const delivery_fee = Math.random() > 0.3 ? 20000 : 0;
    const discount = Math.random() > 0.7 ? 30000 : 0;
    const total = subtotal + delivery_fee - discount;

    return {
      id: 1019 - i,
      user_email: `user${i + 100}@example.com`,
      type: Math.random() > 0.3 ? "DELIVERY" : "PICKUP",
      subtotal,
      delivery_fee,
      discount,
      total,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      payment_method: ["CARD", "CASH", "WALLET"][Math.floor(Math.random() * 3)],
      payment_status: Math.random() > 0.2 ? "SUCCEEDED" : "PENDING",
      created_at: new Date(Date.now() - i * 3600000 * 2).toISOString(),
      group_order_id: Math.random() > 0.7 ? 50 + i : null,
    };
  });

  return [...fixedOrders, ...randomOrders];
};

const OrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 15;

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params: any = {
        page,
        page_size: itemsPerPage,
        ordering: "-id",
      };

      if (statusFilter !== "all") {
        params.status = statusFilter;
      }

      const response = await adminService.getOrders(params);
      setOrders(response.results);
      setTotalCount(response.count);
    } catch (error) {
      console.error("Error fetching orders:", error);
      message.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter]);

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const handleStatusChange = async (
    orderId: number,
    newStatus: OrderStatus
  ) => {
    try {
      await adminService.updateOrderStatus(orderId, newStatus);
      message.success(`Order #${orderId} → ${statusLabels[newStatus]}`);
      // Refresh orders
      fetchOrders();
    } catch (error: any) {
      console.error("Error updating order status:", error);

      // Show detailed error message from backend
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        "Failed to update order status";

      // If backend provides allowed transitions, show them
      if (error.response?.data?.allowed_transitions) {
        const allowed = error.response.data.allowed_transitions.join(", ");
        message.error(`${errorMessage}. Allowed: ${allowed}`, 5);
      } else {
        message.error(errorMessage, 5);
      }
    }
  };

  const handleFilterChange = (e: SelectChangeEvent) => {
    setStatusFilter(e.target.value);
    setPage(1); // Reset to first page when filter changes
  };

  const handlePageChange = (_: any, value: number) => {
    setPage(value);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US").format(Math.round(value)) + " VND";
  };

  const formatDate = (isoString: string) =>
    new Date(isoString).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (loading) {
    return (
      <Box
        className={styles.container}
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className={styles.container}>
      <Typography variant="h4" className={styles.pageTitle}>
        Order Management
      </Typography>

      <Paper className={styles.filterBar}>
        <Box className={styles.filterLeft}>
          <FormControl size="small" className={styles.statusFilter}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={handleFilterChange}
              style={{ width: 200 }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    borderRadius: "16px",
                    boxShadow: "0 12px 40px rgba(0,0,0,0.18)",
                    width: "260px",
                    bgcolor: "background.paper",
                    "& .MuiMenuItem-root": {
                      fontSize: "16px",
                      py: 1.2,
                    },
                  },
                },
              }}
            >
              <MenuItem value="all">All Orders</MenuItem>
              {Object.values(OrderStatus).map((s) => (
                <MenuItem key={s} value={s}>
                  {statusLabels[s]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Typography variant="body2" color="text.secondary" fontWeight="medium">
          Total: {totalCount} orders
        </Typography>
      </Paper>

      <TableContainer component={Paper} className={styles.tableContainer}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell className={styles.tableHeader}>Order ID</TableCell>
              <TableCell className={styles.tableHeader}>Customer</TableCell>
              <TableCell className={styles.tableHeader}>Type</TableCell>
              <TableCell className={styles.tableHeader}>Total</TableCell>
              <TableCell className={styles.tableHeader}>Payment</TableCell>
              <TableCell className={styles.tableHeader}>Created At</TableCell>
              <TableCell className={styles.tableHeader}>Status</TableCell>
              <TableCell className={styles.tableHeader} align="center">
                Update Status
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id} hover className={styles.tableRow}>
                <TableCell>
                  <Typography fontWeight="bold">#{order.id}</Typography>
                  {order.group_order_id && (
                    <Chip
                      label="Group"
                      size="small"
                      color="primary"
                      className={styles.groupBadge}
                    />
                  )}
                </TableCell>

                <TableCell>
                  {order.user?.email || order.user?.full_name || "N/A"}
                </TableCell>

                <TableCell>
                  <Chip
                    label={order.type === "DELIVERY" ? "Delivery" : "Pickup"}
                    size="small"
                    variant="outlined"
                    color={order.type === "DELIVERY" ? "info" : "default"}
                  />
                </TableCell>

                <TableCell>
                  <Typography fontWeight="bold" color="primary">
                    {formatCurrency(order.total)}
                  </Typography>
                </TableCell>

                <TableCell>
                  <Chip
                    label={order.payment_method}
                    size="small"
                    color={
                      order.payment_status === "SUCCEEDED"
                        ? "success"
                        : "default"
                    }
                    variant="outlined"
                  />
                </TableCell>

                <TableCell>{formatDate(order.created_at)}</TableCell>

                <TableCell>
                  <Chip
                    label={statusLabels[order.status as OrderStatus]}
                    color={statusColors[order.status as OrderStatus]}
                    size="small"
                  />
                </TableCell>

                <TableCell align="center">
                  <FormControl size="small">
                    <Select
                      value={order.status ?? ""}
                      onChange={(e) =>
                        handleStatusChange(
                          order.id,
                          e.target.value as OrderStatus
                        )
                      }
                      className={styles.statusSelect}
                      disabled={
                        VALID_TRANSITIONS[order.status as OrderStatus]
                          ?.length === 0
                      }
                      MenuProps={{
                        PaperProps: {
                          sx: {
                            borderRadius: "16px",
                            boxShadow: "0 12px 40px rgba(0,0,0,0.18)",
                            width: "260px",
                            bgcolor: "background.paper",
                            "& .MuiMenuItem-root": {
                              fontSize: "16px",
                              py: 1.2,
                            },
                          },
                        },
                      }}
                    >
                      {/* Show current status */}
                      <MenuItem value={order.status}>
                        {statusLabels[order.status as OrderStatus]}
                      </MenuItem>

                      {/* Show only valid transitions */}
                      {VALID_TRANSITIONS[order.status as OrderStatus]?.map(
                        (validStatus) => (
                          <MenuItem key={validStatus} value={validStatus}>
                            {statusLabels[validStatus]}
                          </MenuItem>
                        )
                      )}
                    </Select>
                  </FormControl>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {totalPages > 1 && (
        <Box className={styles.pagination}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            size="large"
          />
        </Box>
      )}
    </Box>
  );
};

export default OrderManagement;
