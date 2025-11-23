import React, {
  useState,
  useMemo,
  FormEvent,
  ChangeEvent,
  useEffect,
} from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Checkout.module.css";
import {
  FaTruck,
  FaStore,
  FaMoneyBill,
  FaCreditCard,
  FaWallet,
  FaPencilAlt,
  FaTrash,
} from "react-icons/fa";

import { ToastContainer, toast } from "react-toastify";
import cartService from "../../services/cart.service";
import addressService, {
  Address as APIAddress,
} from "../../services/address.service";
import { placeOrder } from "../../services/order.service";
import { Cart } from "../../types/cart.types";

interface Address extends Omit<APIAddress, "id"> {
  id: number;
}

type OrderType = "DELIVERY" | "PICKUP";
type PaymentMethod = "CASH" | "CARD" | "WALLET" | "THIRD_PARTY";

const formatCurrency = (amount: number) => {
  return (
    new Intl.NumberFormat("vi-VN", {
      style: "decimal",
    }).format(amount) + " ₫"
  );
};

interface AddressModalProps {
  addressToEdit: Address | null;
  onClose: () => void;
  onSave: (addressData: Partial<Address>) => void;
}

const AddressModal: React.FC<AddressModalProps> = ({
  addressToEdit,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    street: addressToEdit?.street || "",
    ward: addressToEdit?.ward || "",
    province: addressToEdit?.province || "",
    phone: addressToEdit?.phone || "",
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (addressToEdit) {
      onSave({ ...addressToEdit, ...formData });
    } else {
      onSave(formData);
    }
  };

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modalContent}>
        <h2>{addressToEdit ? "Update Address" : "Add New Address"}</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="street">Street</label>
            <input
              id="street"
              name="street"
              value={formData.street}
              onChange={handleChange}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="ward">Ward</label>
            <input
              id="ward"
              name="ward"
              value={formData.ward}
              onChange={handleChange}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="province">Province/City</label>
            <input
              id="province"
              name="province"
              value={formData.province}
              onChange={handleChange}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="phone">Phone</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>
          <div className={styles.modalActions}>
            <button
              type="button"
              className={styles.modalButtonSecondary}
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className={styles.modalButtonPrimary}>
              Save Address
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface ConfirmDeleteModalProps {
  onClose: () => void;
  onConfirm: () => void;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  onClose,
  onConfirm,
}) => {
  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.confirmModalContent}>
        <h2>Remove Address</h2>
        <p>Are you sure you want to remove this address?</p>
        <div className={styles.confirmModalButtons}>
          <button
            type="button"
            className={styles.modalButtonSecondary}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.modalButtonDanger}
            onClick={onConfirm}
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
};

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState<Cart | null>(null);
  const [userAddresses, setUserAddresses] = useState<Address[]>([]);
  const [shippingFee] = useState<number>(15000);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const [orderType, setOrderType] = useState<OrderType>("DELIVERY");
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
    null
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(
    null
  );

  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [addressToEdit, setAddressToEdit] = useState<Address | null>(null);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<number | null>(null);

  // Fetch cart and addresses on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [cartData, addressesData] = await Promise.all([
          cartService.getCart(),
          addressService.getAddresses(),
        ]);

        setCart(cartData);
        setUserAddresses(addressesData as Address[]);

        // Set default address if exists
        const defaultAddress = addressesData.find((addr) => addr.is_default);
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
        }

        // Check if cart is empty
        if (!cartData.items || cartData.items.length === 0) {
          toast.error("Your cart is empty!");
          navigate("/cart");
        }
      } catch (error: any) {
        toast.error(error.message || "Failed to load checkout data");
        console.error("Checkout data fetch error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const cartItems = cart?.items || [];

  const subtotal = useMemo(() => parseFloat(cart?.total_price || "0"), [cart]);

  const finalShippingFee = useMemo(
    () => (orderType === "PICKUP" ? 0 : shippingFee),
    [orderType, shippingFee]
  );

  const total = useMemo(
    () => subtotal + finalShippingFee,
    [subtotal, finalShippingFee]
  );

  const handlePlaceOrder = async () => {
    if (orderType === "DELIVERY" && !selectedAddressId) {
      toast.error("Please select a delivery address.");
      return;
    }
    if (!paymentMethod) {
      toast.error("Please select a payment method.");
      return;
    }

    try {
      setIsPlacingOrder(true);

      const orderData = {
        address_id:
          orderType === "DELIVERY"
            ? selectedAddressId!
            : userAddresses[0]?.id || 1,
        payment_method: paymentMethod,
        type: orderType,
        delivery_fee: finalShippingFee,
        discount: 0,
      };

      console.log("Sending order data:", orderData);
      const response = await placeOrder(orderData);
      console.log("Order response:", response);

      // If CARD payment, redirect to VNPAY
      if (paymentMethod === "CARD" && response.payment?.payment_url) {
        window.location.href = response.payment.payment_url;
      } else {
        // For CASH, WALLET, THIRD_PARTY - order is completed
        toast.success(response.message || "Order placed successfully!");
        setTimeout(() => {
          navigate("/orders");
        }, 1500);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to place order");
      console.error("Place order error:", error);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleOpenAddModal = () => {
    setAddressToEdit(null);
    setIsAddressModalOpen(true);
  };

  const handleOpenEditModal = (address: Address) => {
    setAddressToEdit(address);
    setIsAddressModalOpen(true);
  };

  const handleOpenDeleteModal = (address: Address) => {
    if (address.is_default) {
      toast.error("Cannot remove the default address.");
      return;
    }
    setAddressToDelete(address.id);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = () => {
    setUserAddresses((prev) =>
      prev.filter((addr) => addr.id !== addressToDelete)
    );
    toast.success("The address has been deleted successfully.", {});
    setIsConfirmModalOpen(false);
    setAddressToDelete(null);
  };

  const handleSaveAddress = (addressData: Partial<Address>) => {
    if (addressData.id) {
      setUserAddresses((prev) =>
        prev.map((addr) =>
          addr.id === addressData.id
            ? ({ ...addr, ...addressData } as Address)
            : addr
        )
      );
      toast.success("The address has been updated successfully.");
    } else {
      const newAddress: Address = {
        ...(addressData as Omit<Address, "id" | "is_default">),
        id: Date.now(), // Temporary ID
        is_default: false,
        is_active: true,
        created_at: new Date().toISOString(),
      };
      setUserAddresses((prev) => [...prev, newAddress]);
      setSelectedAddressId(newAddress.id);
    }
    setIsAddressModalOpen(false);
    setAddressToEdit(null);
  };

  const canPlaceOrder =
    !isPlacingOrder &&
    paymentMethod &&
    (orderType === "PICKUP" || (orderType === "DELIVERY" && selectedAddressId));

  if (isLoading) {
    return (
      <div className={styles.checkoutContainer}>
        <div className={styles.loadingContainer}>
          <p>Loading checkout...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.checkoutContainer}>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
      />

      <header className={styles.header}>
        <h1 className={styles.title}>Checkout</h1>
      </header>

      <div className={styles.checkoutLayout}>
        <div className={styles.leftColumn}>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Order Type</h2>
            <div className={styles.orderTypeToggle}>
              <div className={styles.option}>
                <input
                  type="radio"
                  id="delivery"
                  name="orderType"
                  value="DELIVERY"
                  checked={orderType === "DELIVERY"}
                  onChange={() => setOrderType("DELIVERY")}
                />
                <label htmlFor="delivery">
                  <span className={styles.optionLabel}>
                    <FaTruck /> Delivery
                  </span>
                </label>
              </div>
              <div className={styles.option}>
                <input
                  type="radio"
                  id="pickup"
                  name="orderType"
                  value="PICKUP"
                  checked={orderType === "PICKUP"}
                  onChange={() => setOrderType("PICKUP")}
                />
                <label htmlFor="pickup">
                  <span className={styles.optionLabel}>
                    <FaStore /> Pickup
                  </span>
                </label>
              </div>
            </div>
          </div>

          {orderType === "DELIVERY" && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Delivery Address</h2>
              <div className={styles.optionList}>
                {userAddresses.map((addr) => (
                  <div key={addr.id} className={styles.option}>
                    <input
                      type="radio"
                      id={addr.id}
                      name="address"
                      value={addr.id}
                      checked={selectedAddressId === addr.id}
                      onChange={() => setSelectedAddressId(addr.id)}
                    />
                    <label
                      htmlFor={addr.id}
                      className={styles.addressCardWrapper}
                    >
                      <div className={styles.addressCard}>
                        <strong>
                          {addr.province}
                          {addr.is_default && (
                            <span className={styles.defaultBadge}>Default</span>
                          )}
                        </strong>
                        <p>
                          {addr.street}, {addr.ward}
                        </p>
                        <p>{addr.phone}</p>
                      </div>

                      <div className={styles.addressActions}>
                        <button
                          type="button"
                          className={styles.addressActionButton}
                          title="Edit Address"
                          onClick={(e) => {
                            e.preventDefault();
                            handleOpenEditModal(addr);
                          }}
                        >
                          <FaPencilAlt size={12} />
                        </button>
                        <button
                          type="button"
                          className={`${styles.addressActionButton} ${styles.delete}`}
                          title="Remove Address"
                          onClick={(e) => {
                            e.preventDefault();
                            handleOpenDeleteModal(addr);
                          }}
                        >
                          <FaTrash size={12} />
                        </button>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
              <button
                className={styles.addAddressButton}
                onClick={handleOpenAddModal}
              >
                + Add New Address
              </button>
            </div>
          )}

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Payment Method</h2>
            <div className={styles.optionList}>
              <div className={styles.option}>
                <input
                  type="radio"
                  id="cash"
                  name="paymentMethod"
                  value="CASH"
                  checked={paymentMethod === "CASH"}
                  onChange={() => setPaymentMethod("CASH")}
                />
                <label htmlFor="cash">
                  <span className={styles.optionLabel}>
                    <FaMoneyBill /> Cash on Delivery (COD)
                  </span>
                </label>
              </div>
              <div className={styles.option}>
                <input
                  type="radio"
                  id="card"
                  name="paymentMethod"
                  value="CARD"
                  checked={paymentMethod === "CARD"}
                  onChange={() => setPaymentMethod("CARD")}
                />
                <label htmlFor="card">
                  <span className={styles.optionLabel}>
                    <FaCreditCard /> Credit/Debit Card (VNPAY)
                  </span>
                </label>
              </div>
              <div className={styles.option}>
                <input
                  type="radio"
                  id="wallet"
                  name="paymentMethod"
                  value="WALLET"
                  checked={paymentMethod === "WALLET"}
                  onChange={() => setPaymentMethod("WALLET")}
                />
                <label htmlFor="wallet">
                  <span className={styles.optionLabel}>
                    <FaWallet /> E-Wallet
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <aside className={styles.summary}>
          <div className={styles.summaryBox}>
            <h2 className={styles.sectionTitle}>Order Summary</h2>
            <div className={styles.reviewItemsList}>
              {cartItems.map((item) => (
                <div key={item.id} className={styles.reviewItem}>
                  <img
                    src={item.product.image_url || "/placeholder.png"}
                    alt={item.product.name}
                    className={styles.reviewItemImage}
                  />
                  <div className={styles.reviewItemDetails}>
                    <p className={styles.reviewItemName}>{item.product.name}</p>
                    <p className={styles.reviewItemInfo}>
                      Qty: {item.quantity} |{" "}
                      {formatCurrency(parseFloat(item.product.price))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <hr />
            <div className={styles.summaryLine}>
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className={styles.summaryLine}>
              <span>Shipping Fee</span>
              <span>{formatCurrency(finalShippingFee)}</span>
            </div>
            <hr />
            <div className={styles.summaryTotal}>
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
            <button
              className={styles.placeOrderButton}
              onClick={handlePlaceOrder}
              disabled={!canPlaceOrder}
            >
              {isPlacingOrder ? "Processing..." : "Place Order"}
            </button>
          </div>
        </aside>
      </div>

      {isAddressModalOpen && (
        <AddressModal
          addressToEdit={addressToEdit}
          onClose={() => {
            setIsAddressModalOpen(false);
            setAddressToEdit(null);
          }}
          onSave={handleSaveAddress}
        />
      )}

      {isConfirmModalOpen && (
        <ConfirmDeleteModal
          onClose={() => setIsConfirmModalOpen(false)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
};

export default Checkout;
