import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Order } from "../../types/order.types";
import { cancelOrder } from "../../services/order.service";
import styles from "../Orders/Orders.module.css";
import { FaArrowLeft, FaCheck, FaMapPin } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import axiosInstance from "../../services/axios.instance";

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

const OrderDetail: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<number | null>(
    null
  );
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: "", message: "", onConfirm: () => {} });

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axiosInstance.get(`/api/orders/${orderId}/`);
        setOrder(response.data);
      } catch (err: any) {
        console.error("Error fetching order:", err);
        setError(err.response?.data?.message || "Failed to load order details");
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const handleCancelOrder = (orderId: number) => {
    setConfirmationModal({
      isOpen: true,
      title: "Cancel Order",
      message: "Are you sure you want to cancel this order?",
      onConfirm: async () => {
        try {
          setCancellingOrderId(orderId);
          await cancelOrder(orderId);
          toast.success("Order cancelled successfully");
          setTimeout(() => {
            navigate("/orders");
          }, 1000);
        } catch (error: any) {
          toast.error(error.message || "Failed to cancel order");
        } finally {
          setCancellingOrderId(null);
        }
      },
    });
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
          <p className={styles.loadingTextPrimary}>Loading order details...</p>
          <p className={styles.loadingTextSecondary}>Please wait a moment</p>
        </div>
        <Footer />
      </>
    );
  }

  if (error || !order) {
    return (
      <>
        <Header />
        <div className={styles.container}>
          <div className={styles.errorContainer}>
            <p>{error || "Order not found"}</p>
            <button onClick={() => navigate("/orders")}>Back to Orders</button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const currentStepIndex = getStepIndex(order.status as OrderStatus);
  const isCancelled = order.status === "CANCELLED";

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
          <button
            className={styles.backButton}
            onClick={() => navigate("/orders")}
          >
            <FaArrowLeft /> Back to Orders
          </button>
        </header>

        <div className={styles.detailContainer}>
          <div className={styles.detailHeader}>
            <div className={styles.detailHeaderInfo}>
              <h2>
                Order #{order.id}
                {order.is_group_order && (
                  <span className={styles.groupOrderBadge}>Group Order</span>
                )}
              </h2>
              <p>Placed on {formatDate(order.created_at)}</p>
              <p>Payment: {order.payment_method.toUpperCase()}</p>
              <p>Type: {order.type === "DELIVERY" ? "Delivery" : "Pickup"}</p>
            </div>
            <span
              className={`${styles.badge} ${
                styles[`status_${order.status.toLowerCase()}`]
              }`}
            >
              {getStatusLabel(order.status)}
            </span>
          </div>

          {order.address && (
            <div className={styles.addressSection}>
              <div style={{ marginTop: "0.25rem" }}>
                <FaMapPin size={20} color="var(--primary-color)" />
              </div>
              <div>
                <strong>Delivery Address:</strong>
                <p>
                  {order.address.street}, {order.address.ward},{" "}
                  {order.address.province}
                </p>
                <p>Phone: {order.address.phone}</p>
              </div>
            </div>
          )}

          {isCancelled ? (
            <div className={styles.cancelledState}>
              <p>This order has been cancelled</p>
            </div>
          ) : (
            <div className={styles.trackingContainer}>
              <div
                className={styles.progressBar}
                style={
                  {
                    "--progress-width": `${
                      (currentStepIndex / (ORDER_STEPS.length - 1)) * 100
                    }%`,
                  } as React.CSSProperties
                }
              >
                {ORDER_STEPS.map((step, index) => {
                  const isActive = index <= currentStepIndex;

                  return (
                    <div
                      key={step}
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
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                    }}
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
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Delivery Fee</span>
                <span>{formatCurrency(order.delivery_fee)}</span>
              </div>
              {Number(order.discount) > 0 && (
                <div className={styles.summaryRow}>
                  <span>Discount</span>
                  <span>-{formatCurrency(order.discount)}</span>
                </div>
              )}
              <div className={`${styles.summaryRow} ${styles.total}`}>
                <span>Total</span>
                <span>{formatCurrency(order.total)}</span>
              </div>

              {order.status === "PAID" && (
                <button
                  className={styles.cancelButton}
                  onClick={() => handleCancelOrder(order.id)}
                  disabled={cancellingOrderId === order.id}
                >
                  {cancellingOrderId === order.id
                    ? "Cancelling..."
                    : "Cancel Order"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {confirmationModal.isOpen && (
        <div
          className={styles.modalOverlay}
          onClick={() =>
            setConfirmationModal((prev) => ({ ...prev, isOpen: false }))
          }
        >
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>{confirmationModal.title}</h3>
            <p className={styles.modalText}>{confirmationModal.message}</p>
            <div className={styles.modalActions}>
              <button
                className={`${styles.modalBtn} ${styles.btnCancel}`}
                onClick={() =>
                  setConfirmationModal((prev) => ({ ...prev, isOpen: false }))
                }
              >
                Cancel
              </button>
              <button
                className={`${styles.modalBtn} ${styles.btnConfirm}`}
                onClick={() => {
                  confirmationModal.onConfirm();
                  setConfirmationModal((prev) => ({ ...prev, isOpen: false }));
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </>
  );
};

export default OrderDetail;
