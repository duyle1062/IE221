import React, { useState, useMemo, useEffect } from "react";
import styles from "./Cart.module.css";
import { FaPlus, FaMinus, FaTrash, FaShoppingCart } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import cartService from "../../services/cart.service";
import { Cart as CartType, CartItem } from "../../types/cart.types";
import { useAuth } from "../../context/AuthContext";

const formatCurrency = (amount: number) => {
  return (
    new Intl.NumberFormat("vi-VN", {
      style: "decimal",
    }).format(amount) + " ₫"
  );
};

const CartScreen: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [cart, setCart] = useState<CartType | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [shippingFee] = useState<number>(15000);

  // Fetch cart on component mount
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    fetchCart();
  }, [isAuthenticated]);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const cartData = await cartService.getCart();
      setCart(cartData);
    } catch (error: any) {
      console.error("Failed to fetch cart:", error);
      const errorMessage =
        error?.detail || "Không thể tải giỏ hàng. Vui lòng thử lại!";
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const subtotal = useMemo(() => {
    return cart?.total_price || 0;
  }, [cart]);

  const total = useMemo(() => {
    return subtotal + shippingFee;
  }, [subtotal, shippingFee]);

  const handleIncreaseQuantity = async (item: CartItem) => {
    setUpdating(item.id);
    try {
      const updatedCart = await cartService.increaseQuantity(
        item.id,
        item.quantity
      );
      setCart(updatedCart);
    } catch (error: any) {
      console.error("Failed to increase quantity:", error);
      alert("Không thể cập nhật số lượng. Vui lòng thử lại!");
    } finally {
      setUpdating(null);
    }
  };

  const handleDecreaseQuantity = async (item: CartItem) => {
    if (item.quantity <= 1) return;

    setUpdating(item.id);
    try {
      const updatedCart = await cartService.decreaseQuantity(
        item.id,
        item.quantity
      );
      setCart(updatedCart);
    } catch (error: any) {
      console.error("Failed to decrease quantity:", error);
      alert("Không thể cập nhật số lượng. Vui lòng thử lại!");
    } finally {
      setUpdating(null);
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    if (
      !window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?")
    ) {
      return;
    }

    setUpdating(itemId);
    try {
      await cartService.deleteCartItem(itemId);
      // Refresh cart after deletion
      await fetchCart();
    } catch (error: any) {
      console.error("Failed to remove item:", error);
      alert("Không thể xóa sản phẩm. Vui lòng thử lại!");
    } finally {
      setUpdating(null);
    }
  };

  const handleCheckout = () => {
    if (!cart || cart.items.length === 0) return;
    navigate("/checkout");
  };

  const renderEmptyCart = () => (
    <div className={styles.emptyCart}>
      <FaShoppingCart className={styles.emptyCartIcon} />
      <p className={styles.emptyCartMessage}>Giỏ hàng của bạn trống</p>
      <p className={styles.emptyCartSubMessage}>
        Hãy thêm sản phẩm từ <a href="/">thực đơn</a>!
      </p>
    </div>
  );

  if (loading) {
    return (
      <div className={styles.cartContainer}>
        <header className={styles.header}>
          <h1 className={styles.title}>Giỏ hàng của tôi</h1>
        </header>
        <div className={styles.loadingContainer}>
          <p>Đang tải giỏ hàng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.cartContainer}>
      <header className={styles.header}>
        <h1 className={styles.title}>Giỏ hàng của tôi</h1>
      </header>

      {!cart || cart.items.length === 0 ? (
        renderEmptyCart()
      ) : (
        <div className={styles.cartLayout}>
          <div className={styles.cartItemsList}>
            {cart.items.map((item) => (
              <div key={item.id} className={styles.cartItem}>
                <img
                  src="https://via.placeholder.com/100x100?text=Product"
                  alt={item.product.name}
                  className={styles.itemImage}
                />
                <div className={styles.itemDetails}>
                  <div>
                    <p className={styles.itemName}>{item.product.name}</p>
                    <p className={styles.itemPrice}>
                      {formatCurrency(item.total_item_price)}
                    </p>
                  </div>
                  <div className={styles.itemActions}>
                    <div className={styles.itemQuantityControls}>
                      <button
                        className={styles.quantityButton}
                        onClick={() => handleDecreaseQuantity(item)}
                        disabled={item.quantity <= 1 || updating === item.id}
                        style={{
                          cursor:
                            item.quantity <= 1 || updating === item.id
                              ? "not-allowed"
                              : "pointer",
                          opacity:
                            item.quantity <= 1 || updating === item.id
                              ? 0.5
                              : 1,
                        }}
                      >
                        <FaMinus />
                      </button>
                      <span className={styles.itemQuantity}>
                        {item.quantity}
                      </span>
                      <button
                        className={styles.quantityButton}
                        onClick={() => handleIncreaseQuantity(item)}
                        disabled={updating === item.id}
                      >
                        <FaPlus />
                      </button>
                    </div>
                    <button
                      className={styles.itemRemoveButton}
                      onClick={() => handleRemoveItem(item.id)}
                      title="Xóa sản phẩm"
                      disabled={updating === item.id}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <aside className={styles.summary}>
            <div className={styles.summaryBox}>
              <div className={styles.summaryLine}>
                <span>Tạm tính</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className={styles.summaryLine}>
                <span>Phí vận chuyển</span>
                <span>{formatCurrency(shippingFee)}</span>
              </div>
              <hr />
              <div className={styles.summaryTotal}>
                <span>Tổng cộng</span>
                <span>{formatCurrency(total)}</span>
              </div>
              <button
                className={styles.checkoutButton}
                onClick={handleCheckout}
                disabled={!cart || cart.items.length === 0}
              >
                Thanh toán
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

export default CartScreen;
