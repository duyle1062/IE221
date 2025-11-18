import React, { useState } from "react";
import styles from "./OrderTracking.module.css";
import { FaArrowLeft, FaCheck } from "react-icons/fa";

type OrderStatus =
  | "Pending"
  | "Paid"
  | "Confirmed"
  | "Preparing"
  | "Ready"
  | "Delivered"
  | "Cancelled";

interface OrderItem {
  id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  line_total: number;
  image_url: string;
}

interface Order {
  id: number;
  created_at: string;
  status: OrderStatus;
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total: number;
  address: string;
  payment_method: string;
  items: OrderItem[];
}

const MOCK_ORDERS: Order[] = [
  {
    id: 1001,
    created_at: "2023-10-25T10:30:00Z",
    status: "Pending",
    subtotal: 150000,
    delivery_fee: 15000,
    discount: 0,
    total: 165000,
    address: "123 Đường ABC, Quận 1, TP.HCM",
    payment_method: "cash",
    items: [
      {
        id: "oi1",
        product_name: "Chicken Joy Combo",
        unit_price: 150000,
        quantity: 1,
        line_total: 150000,
        image_url: "",
      },
    ],
  },
  {
    id: 1002,
    created_at: "2023-10-24T18:15:00Z",
    status: "Preparing",
    subtotal: 200000,
    delivery_fee: 15000,
    discount: 20000,
    total: 195000,
    address: "456 Đường XYZ, Quận 3, TP.HCM",
    payment_method: "card",
    items: [
      {
        id: "oi2",
        product_name: "Spaghetti Family Pan",
        unit_price: 200000,
        quantity: 1,
        line_total: 200000,
        image_url: "",
      },
    ],
  },
  {
    id: 1003,
    created_at: "2023-10-20T12:00:00Z",
    status: "Delivered",
    subtotal: 80000,
    delivery_fee: 15000,
    discount: 0,
    total: 95000,
    address: "789 Đường LMN, Quận 7, TP.HCM",
    payment_method: "wallet",
    items: [
      {
        id: "oi3",
        product_name: "Burger Yummy",
        unit_price: 40000,
        quantity: 2,
        line_total: 80000,
        image_url: "",
      },
    ],
  },
  {
    id: 1004,
    created_at: "2023-10-19T09:00:00Z",
    status: "Cancelled",
    subtotal: 50000,
    delivery_fee: 0,
    discount: 0,
    total: 50000,
    address: "123 Đường ABC, Quận 1, TP.HCM",
    payment_method: "cash",
    items: [
      {
        id: "oi4",
        product_name: "Peach Tea",
        unit_price: 25000,
        quantity: 2,
        line_total: 50000,
        image_url: "",
      },
    ],
  },
];

const formatCurrency = (amount: number) => {
  return (
    new Intl.NumberFormat("vi-VN", { style: "decimal" }).format(amount) + " ₫"
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

const ORDER_STEPS: OrderStatus[] = [
  "Pending",
  "Paid",
  "Confirmed",
  "Preparing",
  "Ready",
  "Delivered",
];

const getStepIndex = (status: OrderStatus) => {
  return ORDER_STEPS.indexOf(status);
};

const OrderTracking: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const handleCancelOrder = (orderId: number) => {
    if (window.confirm("Are you sure you want to cancel this order?")) {
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, status: "Cancelled" } : order
        )
      );

      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: "Cancelled" });
      }
    }
  };

  const renderOrderList = () => (
    <div className={styles.orderList}>
      {orders.map((order) => (
        <div key={order.id} className={styles.orderCard}>
          <div className={styles.orderInfo}>
            <h3>Order #{order.id}</h3>
            <div className={styles.orderMeta}>
              <span>{formatDate(order.created_at)}</span>
              <span>•</span>
              <span>{order.items.length} items</span>
            </div>
            <span
              className={`${styles.badge} ${styles[`status_${order.status}`]}`}
            >
              {order.status}
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

    const currentStepIndex = getStepIndex(selectedOrder.status);
    const isCancelled = selectedOrder.status === "Cancelled";

    const progressPercent = isCancelled
      ? 0
      : (currentStepIndex / (ORDER_STEPS.length - 1)) * 100;

    return (
      <div className={styles.detailContainer}>
        <div className={styles.detailHeader}>
          <div className={styles.detailHeaderInfo}>
            <h2>Order #{selectedOrder.id}</h2>
            <p>Placed on {formatDate(selectedOrder.created_at)}</p>
            <p>Payment: {selectedOrder.payment_method.toUpperCase()}</p>
          </div>
          <span
            className={`${styles.badge} ${
              styles[`status_${selectedOrder.status}`]
            }`}
          >
            {selectedOrder.status.toUpperCase()}
          </span>
        </div>

        {isCancelled ? (
          <div className={styles.cancelledState}>
            <p>This order has been cancelled</p>
          </div>
        ) : (
          <div className={styles.trackingContainer}>
            <div className={styles.progressBar}>
              <div
                className={styles.progressLineFill}
                style={{ width: `${progressPercent}%` }}
              ></div>

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
                    <span className={styles.stepLabel}>{step}</span>
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
            {selectedOrder.items.map((item) => (
              <tr key={item.id}>
                <td
                  style={{ display: "flex", alignItems: "center", gap: "1rem" }}
                >
                  <img
                    src={item.image_url}
                    alt={item.product_name}
                    className={styles.itemImage}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
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
            <div className={styles.summaryRow}>
              <span>Discount</span>
              <span>
                {selectedOrder.discount > 0
                  ? `-${formatCurrency(selectedOrder.discount)}`
                  : formatCurrency(selectedOrder.discount)}
              </span>
            </div>
            <div className={`${styles.summaryRow} ${styles.total}`}>
              <span>Total</span>
              <span>{formatCurrency(selectedOrder.total)}</span>
            </div>

            {selectedOrder.status === "Pending" && (
              <button
                className={styles.cancelButton}
                onClick={() => handleCancelOrder(selectedOrder.id)}
              >
                Cancel Order
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
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

      {selectedOrder ? renderOrderDetail() : renderOrderList()}
    </div>
  );
};

export default OrderTracking;
