import React, { useEffect, useState } from "react";
import { getUserOrders, cancelOrder } from "../../services/order.service";
import { Order } from "../../types/order.types";
import styles from "./Orders.module.css";
import { FaArrowLeft, FaCheck } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";

type OrderStatus =
  | "PENDING"
  | "PAID"
  | "CONFIRMED"
  | "PREPARING"
  | "READY"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED";

const ORDER_STEPS: OrderStatus[] = [
  "PENDING",
  "PAID",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "DELIVERED",
  "COMPLETED",
];

const getStepIndex = (status: OrderStatus) => {
  const index = ORDER_STEPS.indexOf(status);
  return index >= 0 ? index : 0;
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    PENDING: "Pending",
    PAID: "Paid",
    CONFIRMED: "Confirmed",
    PREPARING: "Preparing",
    READY: "Ready",
    DELIVERED: "Delivered",
    COMPLETED: "Completed",
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
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<number | null>(
    null
  );

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getUserOrders(1, 100);
      const ordersList = Array.isArray(response)
        ? response
        : response.results || [];
      const sortedOrders = ordersList.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setOrders(sortedOrders);
    } catch (err: any) {
      setError(err.message || "Failed to load orders");
      console.error("Error loading orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    if (window.confirm("Are you sure you want to cancel this order?")) {
      try {
        setCancellingOrderId(orderId);
        await cancelOrder(orderId);
        await loadOrders();
        toast.success("Order cancelled successfully");
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(null);
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to cancel order");
      } finally {
        setCancellingOrderId(null);
      }
    }
  };

  const renderOrderList = () => (
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
              onClick={() => setSelectedOrder(order)}
            >
              View Details
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderOrderDetail = () => {
    if (!selectedOrder) return null;

    const currentStepIndex = getStepIndex(selectedOrder.status as OrderStatus);
    const isCancelled = selectedOrder.status === "CANCELLED";

    // With justify-content: space-between, first circle is at 0% and last at 100%
    // Each step occupies equal spacing: 100% / (totalSteps - 1)
    // For PAID (index 1) with 7 steps: (1 / 6) * 100 = 16.67%
    const totalSteps = ORDER_STEPS.length;
    const progressPercent = isCancelled
      ? 0
      : totalSteps > 1
      ? (currentStepIndex / (totalSteps - 1)) * 100
      : 0;

    console.log(
      "Order Status:",
      selectedOrder.status,
      "Step Index:",
      currentStepIndex,
      "Progress:",
      progressPercent
    );

    return (
      <div className={styles.detailContainer}>
        <div className={styles.detailHeader}>
          <div className={styles.detailHeaderInfo}>
            <h2>
              Order #{selectedOrder.id}
              {selectedOrder.is_group_order && (
                <span className={styles.groupOrderBadge}>Group Order</span>
              )}
            </h2>
            <p>Placed on {formatDate(selectedOrder.created_at)}</p>
            <p>Payment: {selectedOrder.payment_method.toUpperCase()}</p>
            <p>
              Type: {selectedOrder.type === "DELIVERY" ? "Delivery" : "Pickup"}
            </p>
          </div>
          <span
            className={`${styles.badge} ${
              styles[`status_${selectedOrder.status.toLowerCase()}`]
            }`}
          >
            {getStatusLabel(selectedOrder.status)}
          </span>
        </div>

        {selectedOrder.address && (
          <div className={styles.addressSection}>
            <strong>Delivery Address:</strong>
            <p>
              {selectedOrder.address.street}, {selectedOrder.address.ward},{" "}
              {selectedOrder.address.province}
            </p>
            <p>Phone: {selectedOrder.address.phone}</p>
          </div>
        )}

        {isCancelled ? (
          <div className={styles.cancelledState}>
            <p>This order has been cancelled</p>
          </div>
        ) : (
          <div className={styles.trackingContainer}>
            <div className={styles.progressBar}>
              {ORDER_STEPS.map((step, index) => {
                const isActive = index <= currentStepIndex;
                const isLastStep = index === ORDER_STEPS.length - 1;
                const isLineActive = index < currentStepIndex;

                return (
                  <React.Fragment key={step}>
                    <div
                      className={`${styles.stepItem} ${
                        isActive ? styles.active : ""
                      }`}
                    >
                      <div className={styles.stepCircle}>
                        {isActive ? <FaCheck size={12} /> : index + 1}
                      </div>
                      <span className={styles.stepLabel}>
                        {getStatusLabel(step)}
                      </span>
                    </div>
                    {!isLastStep && (
                      <div
                        className={`${styles.progressLine} ${
                          isLineActive ? styles.activeProgressLine : ""
                        }`}
                      ></div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        <h3>Items</h3>
        <table className={styles.itemsTable}>
          <thead>
            <tr>
              <th>Product</th>
              <th>Price</th>
              <th>Qty</th>
              <th style={{ textAlign: "right" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {selectedOrder.items.map((item) => (
              <tr key={item.id}>
                <td
                  style={{ display: "flex", alignItems: "center", gap: "1rem" }}
                >
                  {item.product.image_url && (
                    <img
                      src={item.product.image_url}
                      alt={item.product_name}
                      className={styles.itemImage}
                    />
                  )}
                  <span>{item.product_name}</span>
                </td>
                <td>{formatCurrency(item.unit_price)}</td>
                <td>x{item.quantity}</td>
                <td style={{ textAlign: "right" }}>
                  {formatCurrency(item.line_total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className={styles.summarySection}>
          <div className={styles.summaryBox}>
            <div className={styles.summaryRow}>
              <span>Subtotal</span>
              <span>{formatCurrency(selectedOrder.subtotal)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Delivery Fee</span>
              <span>{formatCurrency(selectedOrder.delivery_fee)}</span>
            </div>
            {Number(selectedOrder.discount) > 0 && (
              <div className={styles.summaryRow}>
                <span>Discount</span>
                <span>-{formatCurrency(selectedOrder.discount)}</span>
              </div>
            )}
            <div className={`${styles.summaryRow} ${styles.total}`}>
              <span>Total</span>
              <span>{formatCurrency(selectedOrder.total)}</span>
            </div>

            {selectedOrder.status === "PAID" && (
              <button
                className={styles.cancelButton}
                onClick={() => handleCancelOrder(selectedOrder.id)}
                disabled={cancellingOrderId === selectedOrder.id}
              >
                {cancellingOrderId === selectedOrder.id
                  ? "Cancelling..."
                  : "Cancel Order"}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <p>{error}</p>
          <button onClick={loadOrders}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
      />

      <header className={styles.header}>
        {selectedOrder ? (
          <button
            className={styles.backButton}
            onClick={() => setSelectedOrder(null)}
          >
            <FaArrowLeft /> Back to Orders
          </button>
        ) : (
          <h1 className={styles.title}>Order History</h1>
        )}
      </header>

      {!selectedOrder && orders.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No orders yet</p>
          <a href="/" className={styles.shopButton}>
            Start Shopping
          </a>
        </div>
      ) : selectedOrder ? (
        renderOrderDetail()
      ) : (
        renderOrderList()
      )}
    </div>
  );
};

export default Orders;
