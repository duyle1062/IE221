import React, { useState, useMemo, FormEvent, ChangeEvent } from "react";
import styles from "./Checkout.module.css";
import {
  FaTruck,
  FaStore,
  FaMoneyBill,
  FaCreditCard,
  FaPencilAlt,
  FaTrash,
} from "react-icons/fa";

import { ToastContainer, toast } from "react-toastify";

interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

interface Address {
  id: string;
  street: string;
  ward: string;
  province: string;
  phone: string;
  isDefault: boolean;
}

type OrderType = "delivery" | "pickup";
type PaymentMethod = "cash" | "card" | "wallet";

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
];

const mockUserAddresses: Address[] = [
  {
    id: "addr1",
    street: "123 Đường ABC",
    ward: "Phường Cống Vị",
    province: "Quận Ba Đình, Hà Nội",
    phone: "0901234567",
    isDefault: true,
  },
  {
    id: "addr2",
    street: "456 Đường XYZ",
    ward: "Phường Bến Nghé",
    province: "Quận 1, TP. Hồ Chí Minh",
    phone: "0987654321",
    isDefault: false,
  },
];

const MOCK_RESTAURANT_ID = "rest1";
const MOCK_USER_ID = "user123";

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
  const [cartItems] = useState<CartItem[]>(mockCartItems);
  const [userAddresses, setUserAddresses] =
    useState<Address[]>(mockUserAddresses);
  const [shippingFee] = useState<number>(15000);

  const [orderType, setOrderType] = useState<OrderType>("delivery");
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    () => mockUserAddresses.find((addr) => addr.isDefault)?.id || null
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(
    null
  );

  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [addressToEdit, setAddressToEdit] = useState<Address | null>(null);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<string | null>(null);

  const subtotal = useMemo(
    () => cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0),
    [cartItems]
  );
  const finalShippingFee = useMemo(
    () => (orderType === "pickup" ? 0 : shippingFee),
    [orderType, shippingFee]
  );
  const total = useMemo(
    () => subtotal + finalShippingFee,
    [subtotal, finalShippingFee]
  );

  const handlePlaceOrder = () => {
    if (orderType === "delivery" && !selectedAddressId) {
      toast.error("Please select a delivery address.");
      return;
    }
    if (!paymentMethod) {
      toast.error("Please select a payment method.");
      return;
    }

    const orderPayload = {
      user_id: MOCK_USER_ID,
      restaurant_id: MOCK_RESTAURANT_ID,
      address_id: orderType === "delivery" ? selectedAddressId : null,
      type: orderType,
      subtotal: subtotal,
      delivery_fee: finalShippingFee,
      discount: 0,
      total: total,
      payment_method: paymentMethod,
      items: cartItems.map((item) => ({
        product_id: item.productId,
        unit_price: item.price,
        quantity: item.quantity,
        line_total: item.price * item.quantity,
      })),
    };

    console.log("Placing Order:", orderPayload);
    toast.success("Order placed successfully!");
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
    if (address.isDefault) {
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
        ...(addressData as Omit<Address, "id" | "isDefault">),
        id: crypto.randomUUID(),
        isDefault: false,
      };
      setUserAddresses((prev) => [...prev, newAddress]);
      setSelectedAddressId(newAddress.id);
    }
    setIsAddressModalOpen(false);
    setAddressToEdit(null);
  };

  const canPlaceOrder =
    paymentMethod &&
    (orderType === "pickup" || (orderType === "delivery" && selectedAddressId));

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
                  value="delivery"
                  checked={orderType === "delivery"}
                  onChange={() => setOrderType("delivery")}
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
                  value="pickup"
                  checked={orderType === "pickup"}
                  onChange={() => setOrderType("pickup")}
                />
                <label htmlFor="pickup">
                  <span className={styles.optionLabel}>
                    <FaStore /> Pickup
                  </span>
                </label>
              </div>
            </div>
          </div>

          {orderType === "delivery" && (
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
                          {addr.isDefault && (
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
                  value="cash"
                  checked={paymentMethod === "cash"}
                  onChange={() => setPaymentMethod("cash")}
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
                  value="card"
                  checked={paymentMethod === "card"}
                  onChange={() => setPaymentMethod("card")}
                />
                <label htmlFor="card">
                  <span className={styles.optionLabel}>
                    <FaCreditCard /> Credit/Debit Card
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
                    src={item.imageUrl}
                    alt={item.name}
                    className={styles.reviewItemImage}
                  />
                  <div className={styles.reviewItemDetails}>
                    <p className={styles.reviewItemName}>{item.name}</p>
                    <p className={styles.reviewItemInfo}>
                      Qty: {item.quantity} | {formatCurrency(item.price)}
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
              Place Order
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
