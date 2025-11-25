import React, { useState, useMemo, useEffect } from "react";
import styles from "./Cart.module.css";
import {
  FaPlus,
  FaMinus,
  FaTrash,
  FaShoppingCart,
  FaArrowLeft,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import cartService from "../../services/cart.service";
import { Cart as CartType, CartItem } from "../../types/cart.types";
import { useAuth } from "../../context/AuthContext";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";

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
        error?.detail || "Unable to load the cart. Please try again!";
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
      alert("Unable to update quantity. Please try again!");
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
      alert("Unable to update quantity. Please try again!");
    } finally {
      setUpdating(null);
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    if (
      !window.confirm(
        "Are you sure you want to remove this item from your cart?"
      )
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
      alert("Unable to remove the item. Please try again!");
    } finally {
      setUpdating(null);
    }
  };

  const handleCheckout = () => {
    if (!cart || cart.items.length === 0) return;
    navigate("/checkout");
  };

  const handleBack = () => {
    navigate(-1);
  };

  const renderEmptyCart = () => (
    <div className={styles.emptyCart}>
      <FaShoppingCart className={styles.emptyCartIcon} />
      <p className={styles.emptyCartMessage}>Your cart is empty</p>
      <p className={styles.emptyCartSubMessage}>
        Add some items from the <a href="/">menu</a>!
      </p>
    </div>
  );

  if (loading) {
    return (
      <>
        <Header />
        <div className={styles.cartContainer}>
          <header className={styles.header}>
            <h1 className={styles.title}>My Cart</h1>
          </header>
          <div className={styles.loadingContainer}>
            <p>Loading cart...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className={styles.cartContainer}>
        <header className={styles.header}>
          <button onClick={handleBack} className={styles.backButton}>
            <FaArrowLeft /> Back
          </button>
          <h1 className={styles.title}>My Cart</h1>
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
                        title="Remove item"
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
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className={styles.summaryLine}>
                  <span>Shipping fee</span>
                  <span>{formatCurrency(shippingFee)}</span>
                </div>
                <hr />
                <div className={styles.summaryTotal}>
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
                <button
                  className={styles.checkoutButton}
                  onClick={handleCheckout}
                  disabled={!cart || cart.items.length === 0}
                >
                  Checkout
                </button>
              </div>
            </aside>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default CartScreen;
