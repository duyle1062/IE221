import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import styles from "./GroupOrder.module.css";
import {
  FaUsers,
  FaUserPlus,
  FaArrowRight,
  FaShoppingBag,
  FaTrash,
  FaMinus,
  FaPlus,
  FaChevronDown,
  FaChevronUp,
  FaMoneyBill,
  FaCreditCard,
  FaWallet,
  FaMapMarkerAlt,
} from "react-icons/fa";
import {
  createGroupOrder,
  joinGroupOrder,
  getGroupOrderDetail,
  updateGroupOrderItem,
  removeGroupOrderItem,
  placeGroupOrder,
  leaveGroupOrder,
  removeMember,
} from "../../services/groupOrder.service";
import { GroupOrder as GroupOrderData } from "../../types/groupOrder.types";
import { useAuth } from "../../context/AuthContext";
import addressService, { Address } from "../../services/address.service";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";

const GroupOrder: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [viewMode, setViewMode] = useState<"selection" | "active">("selection");
  const [joinCode, setJoinCode] = useState("");
  const [groupData, setGroupData] = useState<GroupOrderData | null>(null);
  const [loading, setLoading] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [joiningOrder, setJoiningOrder] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(
    {}
  );
  const [paymentMethod, setPaymentMethod] = useState<
    "CASH" | "CARD" | "WALLET" | "THIRD_PARTY"
  >("CASH");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
    null
  );
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);

  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const confirmAction = (
    title: string,
    message: string,
    action: () => void
  ) => {
    setConfirmationModal({
      isOpen: true,
      title,
      message,
      onConfirm: action,
    });
  };

  const closeConfirmModal = () => {
    setConfirmationModal((prev) => ({ ...prev, isOpen: false }));
  };

  // Load group order and addresses from localStorage on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const storedGroupOrderId = localStorage.getItem("activeGroupOrderId");
        if (storedGroupOrderId && !groupData) {
          await loadGroupOrder(parseInt(storedGroupOrderId));
        }

        // Load addresses
        const addressData = await addressService.getAddresses();
        setAddresses(addressData);
        const defaultAddress =
          addressData.find((a) => a.is_default) || addressData[0];
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
        }
      } catch (error: any) {
        console.error("Failed to load initial data:", error);
      }
    };
    loadInitialData();
  }, []);

  // Poll for updates when in active mode
  useEffect(() => {
    if (viewMode === "active" && groupData) {
      const interval = setInterval(() => {
        loadGroupOrder(groupData.id, true);
      }, 5000); // Poll every 5 seconds
      return () => clearInterval(interval);
    }
  }, [viewMode, groupData?.id]);

  const loadGroupOrder = async (groupOrderId: number, silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await getGroupOrderDetail(groupOrderId);

      // Check if group order is still active (PENDING)
      if (data.status !== "PENDING") {
        // Always redirect and clear, even in silent mode
        localStorage.removeItem("activeGroupOrderId");
        setGroupData(null);
        setViewMode("selection");

        // Show toast message based on status
        if (data.status === "PAID") {
          toast.success("Group order has been finalized and paid!");
        } else if (data.status === "CANCELLED") {
          toast.warning("This group order has been cancelled");
        } else {
          toast.info("This group order has been completed");
        }
        return;
      }

      setGroupData(data);
      setViewMode("active");
      localStorage.setItem("activeGroupOrderId", groupOrderId.toString());
    } catch (error: any) {
      if (!silent) {
        toast.error(error.message || "Failed to load group order");
        localStorage.removeItem("activeGroupOrderId");
        setGroupData(null);
        setViewMode("selection");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return (
      new Intl.NumberFormat("vi-VN", { style: "decimal" }).format(amount) + " ₫"
    );
  };

  const toggleExpand = (productName: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [productName]: !prev[productName],
    }));
  };

  const handleCreateGroup = async () => {
    try {
      setCreatingOrder(true);
      const newGroup = await createGroupOrder();
      setGroupData(newGroup);
      setViewMode("active");
      localStorage.setItem("activeGroupOrderId", newGroup.id.toString());
      toast.success(`Group created! Code: ${newGroup.code}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to create group order");
    } finally {
      setCreatingOrder(false);
    }
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) {
      toast.error("Please enter a code");
      return;
    }
    try {
      setJoiningOrder(true);
      const response = await joinGroupOrder({ code: joinCode.toUpperCase() });
      setGroupData(response.group_order);
      setViewMode("active");
      localStorage.setItem(
        "activeGroupOrderId",
        response.group_order.id.toString()
      );
      toast.success(response.message || "Successfully joined group order!");
    } catch (error: any) {
      toast.error(error.message || "Failed to join group order");
    } finally {
      setJoiningOrder(false);
    }
  };

  const handleRemoveMember = (memberId: number, memberName: string) => {
    if (!groupData) return;

    confirmAction(
      "Remove Member",
      `Remove ${memberName} from the group? Their items will be deleted`,
      async () => {
        try {
          setLoading(true);
          await removeMember(groupData.id, memberId);
          await loadGroupOrder(groupData.id, true);
          toast.success(`${memberName} removed from group`);
        } catch (error: any) {
          toast.error(error.message || "Failed to remove member");
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const handleUpdateQuantity = async (itemId: number, change: number) => {
    if (!groupData) return;

    const item = groupData.items.find((i) => i.id === itemId);
    if (!item) return;

    const newQty = item.quantity + change;
    if (newQty < 1) return;

    try {
      await updateGroupOrderItem(groupData.id, itemId, { quantity: newQty });

      await loadGroupOrder(groupData.id, true);
    } catch (error: any) {
      toast.error(error.message || "Failed to update quantity");
    }
  };

  const handleRemoveItem = (itemId: number) => {
    if (!groupData) return;

    confirmAction(
      "Remove Item",
      "Are you sure you want to remove this item?",
      async () => {
        try {
          await removeGroupOrderItem(groupData.id, itemId);
          await loadGroupOrder(groupData.id, true);
          toast.success("Item removed");
        } catch (error: any) {
          toast.error(error.message || "Failed to remove item");
        }
      }
    );
  };

  const handleFinalizeOrder = async () => {
    if (!groupData) return;

    if (!selectedAddressId) {
      toast.error("Please select a delivery address");
      return;
    }

    try {
      setLoading(true);

      const orderData = {
        address_id: selectedAddressId,
        payment_method: paymentMethod,
        type: "DELIVERY" as const,
        delivery_fee: 20000,
        discount: 0,
      };

      const response = await placeGroupOrder(groupData.id, orderData);

      // Clear localStorage before any redirect/navigation
      localStorage.removeItem("activeGroupOrderId");

      // If CARD payment, redirect to VNPAY
      if (paymentMethod === "CARD" && response.payment?.payment_url) {
        window.location.href = response.payment.payment_url;
      } else {
        toast.success(response.message || "Group order placed successfully!");
        setTimeout(() => {
          navigate("/orders");
        }, 1500);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveGroup = () => {
    if (!groupData) return;

    const isCreator = groupData.creator_id === user?.id;
    const message = isCreator
      ? "As creator, leaving will cancel the group order for everyone. Continue?"
      : "Are you sure you want to leave this group?";

    confirmAction(
      isCreator ? "Cancel Group Order" : "Leave Group",
      message,
      async () => {
        try {
          setLoading(true);
          const response = await leaveGroupOrder(groupData.id);

          localStorage.removeItem("activeGroupOrderId");
          setGroupData(null);
          setViewMode("selection");

          if (response.cancelled) {
            toast.success("Group order cancelled");
          } else {
            toast.success(response.message || "Left group order");
          }
        } catch (error: any) {
          toast.error(error.message || "Failed to leave group order");
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const totalAmount =
    groupData?.items
      ?.filter((item) => item.is_active)
      .reduce((acc, item) => acc + (Number(item.line_total) || 0), 0) || 0;
  const isCreator = groupData?.creator_id === user?.id;

  const renderSelection = () => (
    <div className={styles.selectionContainer}>
      <div
        className={styles.selectionCard}
        onClick={!creatingOrder ? handleCreateGroup : undefined}
      >
        <div className={styles.iconWrapper}>
          <FaUserPlus />
        </div>
        <h3 className={styles.cardTitle}>Create Group Order</h3>
        <p className={styles.cardDesc}>
          Host a party! Get a code and share it with your friends
        </p>
        <button
          className={styles.btnPrimary}
          disabled={creatingOrder || joiningOrder}
        >
          {creatingOrder ? "Creating..." : "Create Now"}
        </button>
      </div>
      <div className={styles.selectionCard}>
        <div className={styles.iconWrapper}>
          <FaUsers />
        </div>
        <h3 className={styles.cardTitle}>Join Group Order</h3>
        <p className={styles.cardDesc}>
          Enter code below to join an existing group order
        </p>
        <form onSubmit={handleJoinGroup} className={styles.joinForm}>
          <input
            className={styles.inputCode}
            placeholder="ENTER CODE"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            disabled={joiningOrder || creatingOrder}
          />
          <button
            type="submit"
            className={styles.btnPrimary}
            disabled={joiningOrder || creatingOrder}
          >
            <div className={styles.buttonContent}>
              {joiningOrder ? "Joining..." : "Join"} <FaArrowRight />
            </div>
          </button>
        </form>
      </div>
    </div>
  );

  const renderDashboard = () => {
    if (!groupData) return null;

    const activeItems = groupData.items?.filter((item) => item.is_active) || [];
    const userItemsMap: Record<number, typeof activeItems> = {};

    // Map items by user_id (not member.id)
    activeItems.forEach((item) => {
      if (!userItemsMap[item.user_id]) userItemsMap[item.user_id] = [];
      userItemsMap[item.user_id]?.push(item);
    });

    // Create user lookup map from members for easy access
    const userLookup: Record<number, any> = {};
    groupData.members.forEach((member) => {
      // Find the corresponding user_id by matching email
      const matchingItem = activeItems.find(
        (item) => item.user_email === member.user_email
      );
      if (matchingItem) {
        userLookup[matchingItem.user_id] = member;
      }
    });

    return (
      <div className={styles.dashboard}>
        <div className={styles.leftCol}>
          <div className={styles.infoCard}>
            <h4>Group Code</h4>
            <span className={styles.groupCode}>{groupData.code}</span>
            <div className={styles.qrBox}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${groupData.code}`}
                alt="QR"
              />
            </div>
            <p className={styles.infoText}>Share this code to invite others</p>
          </div>
          <div className={styles.memberList}>
            <h4>Members ({groupData.members.length})</h4>
            {groupData.members.map((m) => (
              <div key={m.id} className={styles.memberItem}>
                <div className={styles.avatar}>{m.user_name.charAt(0)}</div>
                <div className={styles.memberInfo}>
                  <span className={styles.memberName}>
                    {m.user_name} {m.user_email === user?.email && "(You)"}
                  </span>
                  {m.is_creator && (
                    <span className={styles.hostBadge}>HOST</span>
                  )}
                </div>
                {isCreator && !m.is_creator && m.user_email !== user?.email && (
                  <button
                    className={styles.iconBtnDelete}
                    onClick={() => handleRemoveMember(m.id, m.user_name)}
                    title="Remove Member"
                    disabled={loading}
                  >
                    <FaTrash />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className={styles.itemsContainer}>
          <div className={styles.sectionTitle}>
            <span>Group Items ({activeItems.length})</span>
            <button
              className={styles.addItemBtn}
              onClick={() => navigate("/category/pizza")}
            >
              + Add Item
            </button>
          </div>
          {Object.entries(userItemsMap).map(([userId, items]) => {
            const userIdNum = parseInt(userId);
            const firstItem = items[0];
            if (!firstItem) return null;

            const userName = firstItem.user_name;
            const userEmail = firstItem.user_email;
            const userTotal = items.reduce(
              (sum, i) => sum + (Number(i.line_total) || 0),
              0
            );
            const isExpanded = expandedItems[`user_${userId}`];

            return (
              <div key={userId} className={styles.userGroupCard}>
                <div
                  className={styles.userGroupHeader}
                  onClick={() => toggleExpand(`user_${userId}`)}
                >
                  <div className={styles.userGroupMainInfo}>
                    <div className={styles.avatar}>
                      {userName?.charAt(0) || "?"}
                    </div>
                    <span className={styles.userGroupName}>
                      {userName} {userEmail === user?.email && "(You)"}
                    </span>
                  </div>
                  <div className={styles.userGroupMeta}>
                    <span className={styles.groupPrice}>
                      {formatCurrency(userTotal)}
                    </span>
                    <button className={styles.expandBtn}>
                      {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                    </button>
                  </div>
                </div>
                {isExpanded && (
                  <div className={styles.userGroupDetails}>
                    {items.length === 0 ? (
                      <p className={styles.emptyStateText}>No items</p>
                    ) : (
                      items.map((item) => (
                        <div key={item.id} className={styles.detailRow}>
                          <div className={styles.detailProduct}>
                            <span>{item.product_name}</span>
                          </div>
                          <div className={styles.detailControls}>
                            <div className={styles.qtyControl}>
                              {item.user_email === user?.email || isCreator ? (
                                <>
                                  <button
                                    onClick={() =>
                                      handleUpdateQuantity(item.id, -1)
                                    }
                                    disabled={loading}
                                  >
                                    <FaMinus />
                                  </button>
                                  <span>{item.quantity}</span>
                                  <button
                                    onClick={() =>
                                      handleUpdateQuantity(item.id, 1)
                                    }
                                    disabled={loading}
                                  >
                                    <FaPlus />
                                  </button>
                                </>
                              ) : (
                                <span>{item.quantity}</span>
                              )}
                            </div>
                            <div className={styles.priceTag}>
                              {formatCurrency(item.line_total)}
                            </div>
                            {(item.user_email === user?.email || isCreator) && (
                              <button
                                className={styles.itemDeleteBtn}
                                onClick={() => handleRemoveItem(item.id)}
                                disabled={loading}
                              >
                                <FaTrash />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className={styles.summaryCard}>
          <h3>Group Summary</h3>
          <div className={styles.summaryRow}>
            <span>Total Members</span>
            <span>{groupData.members.length}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>Total Items</span>
            <span>{activeItems.reduce((sum, i) => sum + i.quantity, 0)}</span>
          </div>
          <div className={styles.summaryTotal}>
            <span>Total</span>
            <span style={{ color: "var(--primary-color)" }}>
              {formatCurrency(totalAmount)}
            </span>
          </div>
          {isCreator ? (
            <>
              {/* Delivery Address Selection */}
              <div className={styles.checkoutSection}>
                <div className={styles.sectionHeader}>
                  <FaMapMarkerAlt />
                  <span>Delivery Address</span>
                </div>
                {addresses.length > 0 ? (
                  <select
                    className={styles.selectInput}
                    value={selectedAddressId || ""}
                    onChange={(e) =>
                      setSelectedAddressId(Number(e.target.value))
                    }
                  >
                    {addresses.map((addr) => (
                      <option key={addr.id} value={addr.id}>
                        {addr.street}, {addr.ward}, {addr.province}
                        {addr.is_default && " (Default)"}
                      </option>
                    ))}
                  </select>
                ) : (
                  <button
                    className={styles.addAddressBtn}
                    onClick={() => navigate("/userprofile")}
                  >
                    + Add Address
                  </button>
                )}
              </div>

              {/* Payment Method Selection */}
              <div className={styles.checkoutSection}>
                <div className={styles.sectionHeader}>
                  <FaMoneyBill />
                  <span>Payment Method</span>
                </div>
                <div className={styles.paymentOptions}>
                  <label className={styles.paymentOption}>
                    <input
                      type="radio"
                      name="payment"
                      value="CASH"
                      checked={paymentMethod === "CASH"}
                      onChange={() => setPaymentMethod("CASH")}
                    />
                    <span>
                      <FaMoneyBill /> Cash on Delivery
                    </span>
                  </label>
                  <label className={styles.paymentOption}>
                    <input
                      type="radio"
                      name="payment"
                      value="CARD"
                      checked={paymentMethod === "CARD"}
                      onChange={() => setPaymentMethod("CARD")}
                    />
                    <span>
                      <FaCreditCard /> Card (VNPAY)
                    </span>
                  </label>
                  <label className={styles.paymentOption}>
                    <input
                      type="radio"
                      name="payment"
                      value="WALLET"
                      checked={paymentMethod === "WALLET"}
                      onChange={() => setPaymentMethod("WALLET")}
                    />
                    <span>
                      <FaWallet /> E-Wallet
                    </span>
                  </label>
                </div>
              </div>

              <button
                className={styles.finalizeBtn}
                onClick={handleFinalizeOrder}
                disabled={loading || activeItems.length === 0}
              >
                <div className={styles.buttonContent}>
                  <FaShoppingBag />{" "}
                  {loading ? "Processing..." : "Finalize Order"}
                </div>
              </button>
            </>
          ) : (
            <div className={styles.waitingText}>
              Waiting for host to finalize...
            </div>
          )}
          <button className={styles.leaveGroupBtn} onClick={handleLeaveGroup}>
            Leave Group
          </button>
        </div>
      </div>
    );
  };

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
          <h1 className={styles.title}>Group Order</h1>
          <p className={styles.subtitle}>
            Eat together, pay together (or split later!)
          </p>
          {viewMode === "active" && (
            <button
              className={styles.newGroupBtn}
              onClick={() => {
                confirmAction(
                  "Start New Group",
                  "Start a new group order? You will leave the current group",
                  () => {
                    localStorage.removeItem("activeGroupOrderId");
                    setGroupData(null);
                    setViewMode("selection");
                  }
                );
              }}
            >
              + Start New Group Order
            </button>
          )}
        </header>
        {viewMode === "selection" ? renderSelection() : renderDashboard()}
      </div>

      {confirmationModal.isOpen && (
        <div className={styles.modalOverlay} onClick={closeConfirmModal}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>{confirmationModal.title}</h3>
            <p className={styles.modalText}>{confirmationModal.message}</p>
            <div className={styles.modalActions}>
              <button
                className={`${styles.modalBtn} ${styles.btnCancel}`}
                onClick={closeConfirmModal}
              >
                Cancel
              </button>
              <button
                className={`${styles.modalBtn} ${styles.btnConfirm}`}
                onClick={() => {
                  confirmationModal.onConfirm();
                  closeConfirmModal();
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

export default GroupOrder;
