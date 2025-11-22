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
  IconButton,
} from "@mui/material";
import { Sync as SyncIcon } from "@mui/icons-material";
import { message } from "antd";
import styles from "./OrderManagement.module.css";

// ==================== ENUM ORDER STATUS ====================
export enum OrderStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  CONFIRMED = "CONFIRMED",
  PREPARING = "PREPARING",
  READY = "READY",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED",
}

// ==================== STATUS LABELS ====================
const statusLabels: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: "Chờ thanh toán",
  [OrderStatus.PAID]: "Đã thanh toán",
  [OrderStatus.CONFIRMED]: "Đã xác nhận",
  [OrderStatus.PREPARING]: "Đang chuẩn bị",
  [OrderStatus.READY]: "Sẵn sàng",
  [OrderStatus.DELIVERED]: "Đã giao",
  [OrderStatus.CANCELLED]: "Đã hủy",
};

// ==================== STATUS COLORS (MUI CHIP) ====================
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

// ==================== MOCK DATA ====================
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

// ==================== COMPONENT ====================
const OrderManagement: React.FC = () => {
  const [orders, setOrders] = useState(generateMockOrders());
  const [filteredOrders, setFilteredOrders] = useState(orders);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const itemsPerPage = 15;

  // Filter orders
  useEffect(() => {
    const filtered =
      statusFilter === "all"
        ? orders
        : orders.filter((o) => o.status === statusFilter);

    setFilteredOrders(filtered);
    setPage(1);
  }, [statusFilter, orders]);

  // Pagination
  const paginatedOrders = filteredOrders.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  // Change Status
  const handleStatusChange = (orderId: number, newStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );
    message.success(`Đơn #${orderId} → ${statusLabels[newStatus]}`);
  };

  const handleFilterChange = (e: SelectChangeEvent) => {
    setStatusFilter(e.target.value);
  };

  const handlePageChange = (_: any, value: number) => {
    setPage(value);
  };

  const formatCurrency = (value: number) => value.toLocaleString("vi-VN") + "đ";

  const formatDate = (isoString: string) =>
    new Date(isoString).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <Box className={styles.container}>
      <Typography variant="h4" className={styles.pageTitle}>
        Quản lý đơn hàng
      </Typography>

      <Paper className={styles.filterBar}>
        <Box className={styles.filterLeft}>
          <FormControl size="small" className={styles.statusFilter}>
            <InputLabel>Trạng thái</InputLabel>
            <Select
              value={statusFilter}
              label="Trạng thái"
              onChange={handleFilterChange}
            >
              <MenuItem value="all">Tất cả đơn hàng</MenuItem>
              {Object.values(OrderStatus).map((s) => (
                <MenuItem key={s} value={s}>
                  {statusLabels[s]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Typography variant="body2" color="text.secondary">
          Hiển thị {paginatedOrders.length} / {filteredOrders.length} đơn hàng
        </Typography>
      </Paper>

      <TableContainer component={Paper} className={styles.tableContainer}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell className={styles.tableHeader}>Mã đơn</TableCell>
              <TableCell className={styles.tableHeader}>Khách hàng</TableCell>
              <TableCell className={styles.tableHeader}>Loại</TableCell>
              <TableCell className={styles.tableHeader}>Tổng tiền</TableCell>
              <TableCell className={styles.tableHeader}>Thanh toán</TableCell>
              <TableCell className={styles.tableHeader}>Thời gian</TableCell>
              <TableCell className={styles.tableHeader}>Trạng thái</TableCell>
              <TableCell className={styles.tableHeader} align="center">
                Cập nhật trạng thái
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {paginatedOrders.map((order) => (
              <TableRow key={order.id} hover className={styles.tableRow}>
                <TableCell>
                  <Typography fontWeight="bold">#{order.id}</Typography>
                  {order.group_order_id && (
                    <Chip
                      label="Nhóm"
                      size="small"
                      color="primary"
                      className={styles.groupBadge}
                    />
                  )}
                </TableCell>

                <TableCell>{order.user_email}</TableCell>

                <TableCell>
                  <Chip
                    label={order.type === "DELIVERY" ? "Giao hàng" : "Tại quán"}
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
                    >
                      {Object.values(OrderStatus).map((s) => (
                        <MenuItem key={s} value={s}>
                          {statusLabels[s]}
                        </MenuItem>
                      ))}
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
