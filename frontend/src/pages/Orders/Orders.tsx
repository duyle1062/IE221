import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserOrders } from "../../services/order.service";
import { Order } from "../../types/order.types";
import styles from "./Orders.module.css";
import { toast, ToastContainer } from "react-toastify";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";

type OrderStatus =
  | "PENDING"
  | "PAID"
  | "CONFIRMED"
  | "PREPARING"
  | "READY"
  | "DELIVERED"
  | "CANCELLED";

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    PENDING: "Pending",
    PAID: "Paid",
    CONFIRMED: "Confirmed",
    PREPARING: "Preparing",
    READY: "Ready",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled",
  };
  return labels[status] || status;
};

const formatCurrency = (amount: string | number) => {
  return (
    new Intl.NumberFormat("vi-VN", { style: "decimal" }).format(
      Number(amount)
    ) + " ₫"
  );
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const Orders: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | "ALL">(
    "ALL"
  );
  const pageSize = 10;

  const statuses: (OrderStatus | "ALL")[] = [
    "ALL",
    "PENDING",
    "PAID",
    "CONFIRMED",
    "PREPARING",
    "READY",
    "DELIVERED",
    "CANCELLED",
  ];

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStatus]);

  useEffect(() => {
    loadOrders(currentPage);
  }, [currentPage, selectedStatus]);

  const loadOrders = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      const response = await getUserOrders(page, pageSize, selectedStatus);
      let ordersList = Array.isArray(response)
        ? response
        : response.results || [];

      const sortedOrders = ordersList.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setOrders(sortedOrders);

      // Set pagination info
      if (!Array.isArray(response)) {
        setTotalOrders(response.count || 0);
        setTotalPages(Math.ceil((response.count || 0) / pageSize));
      }
    } catch (err: any) {
      setError(err.message || "Failed to load orders");
      console.error("Error loading orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const renderOrderList = () => (
    <>
      <div className={styles.orderList}>
        {orders.map((order) => (
          <div key={order.id} className={styles.orderCard}>
            <div className={styles.orderInfo}>
              <h3>
                Order #{order.id}
                {order.is_group_order && (
                  <span className={styles.groupOrderBadge}>Group</span>
                )}
              </h3>
              <div className={styles.orderMeta}>
                <span>{formatDate(order.created_at)}</span>
                <span>•</span>
                <span>{order.items.length} items</span>
              </div>
              <span
                className={`${styles.badge} ${
                  styles[`status_${order.status.toLowerCase()}`]
                }`}
              >
                {getStatusLabel(order.status)}
              </span>
            </div>
            <div style={{ textAlign: "right" }}>
              <p className={styles.totalPrice}>{formatCurrency(order.total)}</p>
              <button
                className={styles.viewDetailButton}
                onClick={() => navigate(`/orders/${order.id}`)}
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageButton}
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>

          <div className={styles.pageInfo}>
            Page {currentPage} of {totalPages}
            <span className={styles.totalOrders}>
              ({totalOrders} total orders)
            </span>
          </div>

          <button
            className={styles.pageButton}
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages, prev + 1))
            }
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </>
  );

  const renderOrderDetail = () => {
    return null;
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className={styles.ordersLoadingContainer}>
          <div className={styles.loadingSpinnerWrapper}>
            <div className={styles.loadingSpinnerBase}></div>
            <div className={styles.loadingSpinnerTop}></div>
          </div>
          <p className={styles.loadingTextPrimary}>Fetching your orders...</p>
          <p className={styles.loadingTextSecondary}>Please wait a moment</p>
        </div>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div className={styles.container}>
          <div className={styles.errorContainer}>
            <p>{error}</p>
            <button onClick={() => loadOrders()}>Retry</button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={true}
      />
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Order History</h1>
        </header>

        <div className={styles.filterContainer}>
          <div className={styles.filterLabel}>Filter by Status:</div>
          <div className={styles.filterButtons}>
            {statuses.map((status) => (
              <button
                key={status}
                className={`${styles.filterButton} ${
                  selectedStatus === status ? styles.filterButtonActive : ""
                }`}
                onClick={() => setSelectedStatus(status)}
              >
                {getStatusLabel(status)}
              </button>
            ))}
          </div>
        </div>

        {orders.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No orders yet</p>
            <a href="/" className={styles.shopButton}>
              Start Shopping
            </a>
          </div>
        ) : (
          renderOrderList()
        )}
      </div>
      <Footer />
    </>
  );
};

export default Orders;
