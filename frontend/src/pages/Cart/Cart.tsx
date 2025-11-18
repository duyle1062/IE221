import React, { useState, useMemo } from "react";
import styles from "./Cart.module.css";
import { FaPlus, FaMinus, FaTrash, FaShoppingCart } from "react-icons/fa";

import { useNavigate } from "react-router-dom";

interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

const mockCartItems: CartItem[] = [
  {
    id: "ci1",
    productId: "p1",
    name: "Shake Potato Cheese",
    price: 35000,
    quantity: 6,
    imageUrl: "",
  },
  {
    id: "ci2",
    productId: "p2",
    name: "Cheese Stick",
    price: 36000,
    quantity: 1,
    imageUrl: "",
  },
  {
    id: "ci3",
    productId: "p3",
    name: "Shake Chicken Cheese",
    price: 44000,
    quantity: 1,
    imageUrl: "",
  },
];

const formatCurrency = (amount: number) => {
  return (
    new Intl.NumberFormat("vi-VN", {
      style: "decimal",
    }).format(amount) + " ₫"
  );
};

const CartScreen: React.FC = () => {
  const navigate = useNavigate();

  const [cartItems, setCartItems] = useState<CartItem[]>(mockCartItems);
  const [shippingFee] = useState<number>(15000);

  const subtotal = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }, [cartItems]);

  const total = useMemo(() => {
    return subtotal + shippingFee;
  }, [subtotal, shippingFee]);

  const handleIncreaseQuantity = (itemId: string) => {
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const handleDecreaseQuantity = (itemId: string) => {
    setCartItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === itemId && item.quantity > 1) {
          return { ...item, quantity: item.quantity - 1 };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (itemId: string) => {
    if (
      window.confirm(
        "Are you sure you want to remove this item from your cart?"
      )
    ) {
      setCartItems((prevItems) =>
        prevItems.filter((item) => item.id !== itemId)
      );
    }
  };

  const handleCheckout = () => {
    navigate("/checkout");
  };

  const renderEmptyCart = () => (
    <div className={styles.emptyCart}>
      <FaShoppingCart className={styles.emptyCartIcon} />
      <p className={styles.emptyCartMessage}>Your cart is empty</p>
      <p className={styles.emptyCartSubMessage}>
        Add items from <a href="/">our menu</a>!
      </p>
    </div>
  );

  return (
    <div className={styles.cartContainer}>
      <header className={styles.header}>
        <h1 className={styles.title}>My Cart</h1>
      </header>

      {cartItems.length === 0 ? (
        renderEmptyCart()
      ) : (
        <div className={styles.cartLayout}>
          <div className={styles.cartItemsList}>
            {cartItems.map((item) => (
              <div key={item.id} className={styles.cartItem}>
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className={styles.itemImage}
                />
                <div className={styles.itemDetails}>
                  <div>
                    <p className={styles.itemName}>{item.name}</p>
                    <p className={styles.itemPrice}>
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                  <div className={styles.itemActions}>
                    <div className={styles.itemQuantityControls}>
                      <button
                        className={styles.quantityButton}
                        onClick={() => handleDecreaseQuantity(item.id)}
                        style={{
                          cursor:
                            item.quantity <= 1 ? "not-allowed" : "pointer",
                          opacity: item.quantity <= 1 ? 0.5 : 1,
                        }}
                      >
                        <FaMinus />
                      </button>
                      <span className={styles.itemQuantity}>
                        {item.quantity}
                      </span>
                      <button
                        className={styles.quantityButton}
                        onClick={() => handleIncreaseQuantity(item.id)}
                      >
                        <FaPlus />
                      </button>
                    </div>
                    <button
                      className={styles.itemRemoveButton}
                      onClick={() => handleRemoveItem(item.id)}
                      title="Remove item"
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
                <span>Shipping Fee</span>
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
                disabled={cartItems.length === 0}
              >
                Checkout
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

export default CartScreen;
