import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
} from "react-icons/fa";

interface GroupOrderMember {
  id: number;
  name: string;
  joined_at: string;
  is_creator: boolean;
}

interface GroupOrderItem {
  id: number;
  user_id: number;
  user_name: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  line_total: number;
}

interface GroupOrderData {
  id: number;
  code: string;
  creator_id: number;
  status: "Pending" | "Confirmed" | "Cancelled";
  members: GroupOrderMember[];
  items: GroupOrderItem[];
}

const GroupOrder: React.FC = () => {
  useEffect(() => {
    if (!groupData) {
      const groupOrderRaw = localStorage.getItem("groupOrder");
      if (groupOrderRaw) {
        try {
          const groupOrder = JSON.parse(groupOrderRaw);
          setGroupData(groupOrder);
          setViewMode("active");
        } catch {}
      }
    }
  }, []);
  const navigate = useNavigate();

  const currentUser = { id: 1, name: "Nguyen Van A" };

  const [viewMode, setViewMode] = useState<"selection" | "active">("selection");
  const [joinCode, setJoinCode] = useState("");
  const [groupData, setGroupData] = useState<GroupOrderData | null>(null);

  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(
    {}
  );

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

  const handleCreateGroup = () => {
    const newGroup: GroupOrderData = {
      id: Math.floor(Math.random() * 10000),
      code: "JOLLI" + Math.floor(Math.random() * 1000),
      creator_id: currentUser.id,
      status: "Pending",
      members: [
        {
          id: currentUser.id,
          name: currentUser.name,
          joined_at: new Date().toISOString(),
          is_creator: true,
        },
      ],
      items: [],
    };
    setGroupData(newGroup);
    setViewMode("active");
    localStorage.setItem(
      "groupOrder",
      JSON.stringify({ ...newGroup, currentUser })
    );
  };

  const handleJoinGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) {
      alert("Please enter a code.");
      return;
    }
    const mockExistingGroup: GroupOrderData = {
      id: 999,
      code: joinCode.toUpperCase(),
      creator_id: 99,
      status: "Pending",
      members: [
        {
          id: 99,
          name: "Admin User",
          joined_at: "2023-11-01",
          is_creator: true,
        },
        {
          id: currentUser.id,
          name: currentUser.name,
          joined_at: new Date().toISOString(),
          is_creator: false,
        },
      ],
      items: [
        {
          id: 101,
          user_id: 99,
          user_name: "Admin User",
          product_name: "Chicken Bucket",
          quantity: 1,
          unit_price: 150000,
          line_total: 150000,
        },
        {
          id: 102,
          user_id: 99,
          user_name: "Admin User",
          product_name: "Spaghetti Medium",
          quantity: 1,
          unit_price: 35000,
          line_total: 35000,
        },
        {
          id: 103,
          user_id: currentUser.id,
          user_name: currentUser.name,
          product_name: "Spaghetti Medium",
          quantity: 2,
          unit_price: 35000,
          line_total: 70000,
        },
      ],
    };
    setGroupData(mockExistingGroup);
    setViewMode("active");
    localStorage.setItem(
      "groupOrder",
      JSON.stringify({ ...mockExistingGroup, currentUser })
    );
  };

  const handleRemoveMember = (memberId: number) => {
    if (!groupData) return;
    if (window.confirm("Are you sure you want to remove this member?")) {
      setGroupData((prev) => {
        if (!prev) return null;
        const updatedMembers = prev.members.filter((m) => m.id !== memberId);
        const updatedItems = prev.items.filter((i) => i.user_id !== memberId);
        return { ...prev, members: updatedMembers, items: updatedItems };
      });
    }
  };

  const handleUpdateQuantity = (itemId: number, change: number) => {
    setGroupData((prev) => {
      if (!prev) return null;
      const updatedItems = prev.items.map((item) => {
        if (item.id === itemId) {
          const newQty = item.quantity + change;
          if (newQty < 1) return item;
          return {
            ...item,
            quantity: newQty,
            line_total: newQty * item.unit_price,
          };
        }
        return item;
      });
      return { ...prev, items: updatedItems };
    });
  };

  const handleRemoveItem = (itemId: number) => {
    if (window.confirm("Remove this item?")) {
      setGroupData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          items: prev.items.filter((item) => item.id !== itemId),
        };
      });
    }
  };

  const handleFinalizeOrder = () => {
    if (!groupData) return;
    if (window.confirm(`Finalize this group order?`)) {
      console.log("Finalizing:", groupData);
      navigate("/checkout");
    }
  };

  useEffect(() => {
    if (viewMode === "active" && groupData) {
      const interval = setInterval(() => {
        if (Math.random() > 0.9) {
          setGroupData((prev) => {
            if (!prev) return null;
            const memberExists = prev.members.find((m) => m.id === 2);
            const updatedMembers = memberExists
              ? prev.members
              : [
                  ...prev.members,
                  {
                    id: 2,
                    name: "Tran Van B",
                    joined_at: new Date().toISOString(),
                    is_creator: false,
                  },
                ];
            const items = prev.items.slice();
            const existedIdx = items.findIndex(
              (item) =>
                item.user_id === 2 && item.product_name === "Spaghetti Medium"
            );
            if (existedIdx !== -1 && items[existedIdx]) {
              const existed = items[existedIdx];
              items[existedIdx] = {
                id: existed.id,
                user_id: existed.user_id,
                user_name: existed.user_name,
                product_name: existed.product_name,
                unit_price: existed.unit_price,
                quantity: existed.quantity + 1,
                line_total: (existed.quantity + 1) * existed.unit_price,
              };
            } else {
              items.push({
                id: Math.floor(Math.random() * 100000),
                user_id: 2,
                user_name: "Tran Van B",
                product_name: "Spaghetti Medium",
                quantity: 1,
                unit_price: 35000,
                line_total: 35000,
              });
            }
            return {
              ...prev,
              members: updatedMembers,
              items,
            };
          });
        }
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [groupData, viewMode]);

  const totalAmount =
    groupData?.items.reduce((acc, item) => acc + item.line_total, 0) || 0;
  const isCreator = groupData?.creator_id === currentUser.id;

  const renderSelection = () => (
    <div className={styles.selectionContainer}>
      <div className={styles.selectionCard} onClick={handleCreateGroup}>
        <div className={styles.iconWrapper}>
          <FaUserPlus />
        </div>
        <h3 className={styles.cardTitle}>Create Group Order</h3>
        <p className={styles.cardDesc}>
          Host a party! Get a code and share it with your friends.
        </p>
        <button className={styles.btnPrimary}>Create Now</button>
      </div>
      <div className={styles.selectionCard}>
        <div className={styles.iconWrapper}>
          <FaUsers />
        </div>
        <h3 className={styles.cardTitle}>Join Group Order</h3>
        <p className={styles.cardDesc}>
          Enter code below to join an existing group order.
        </p>
        <form onSubmit={handleJoinGroup} className={styles.joinForm}>
          <input
            className={styles.inputCode}
            placeholder="ENTER CODE"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
          />
          <button type="submit" className={styles.btnPrimary}>
            <div className={styles.buttonContent}>
              Join <FaArrowRight />
            </div>
          </button>
        </form>
      </div>
    </div>
  );

  const handleLeaveGroup = () => {
    const message = isCreator
      ? "Leaving will disband the group for everyone locally. Continue?"
      : "Are you sure you want to leave this group?";

    if (window.confirm(message)) {
      localStorage.removeItem("groupOrder");
      window.location.reload();
    }
  };

  const renderDashboard = () => {
    if (!groupData) return null;
    const userItemsMap: Record<number, GroupOrderItem[]> = {};
    groupData.items.forEach((item) => {
      if (!userItemsMap[item.user_id]) userItemsMap[item.user_id] = [];
      userItemsMap[item.user_id]?.push(item);
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
                <div className={styles.avatar}>{m.name.charAt(0)}</div>
                <div className={styles.memberInfo}>
                  <span className={styles.memberName}>
                    {m.name} {m.id === currentUser.id && "(You)"}
                  </span>
                  {m.is_creator && (
                    <span className={styles.hostBadge}>HOST</span>
                  )}
                </div>
                {isCreator && m.id !== currentUser.id && (
                  <button
                    className={styles.iconBtnDelete}
                    onClick={() => handleRemoveMember(m.id)}
                    title="Remove Member"
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
            <span>Group Items ({groupData.items.length})</span>
            <button
              className={styles.addItemBtn}
              onClick={() => navigate("/category/pizza")}
            >
              + Add Item
            </button>
          </div>
          {groupData.members.map((user) => {
            const userItems = userItemsMap[user.id] || [];
            const userTotal = userItems.reduce(
              (sum, i) => sum + i.line_total,
              0
            );
            const isExpanded = expandedItems[`user_${user.id}`];
            return (
              <div key={user.id} className={styles.userGroupCard}>
                <div
                  className={styles.userGroupHeader}
                  onClick={() => toggleExpand(`user_${user.id}`)}
                >
                  <div className={styles.userGroupMainInfo}>
                    <div className={styles.avatar}>{user.name.charAt(0)}</div>
                    <span className={styles.userGroupName}>{user.name}</span>
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
                    {userItems.length === 0 ? (
                      <p className={styles.emptyStateText}>No items.</p>
                    ) : (
                      userItems.map((item) => (
                        <div key={item.id} className={styles.detailRow}>
                          <div className={styles.detailProduct}>
                            <span>{item.product_name}</span>
                          </div>
                          <div className={styles.detailControls}>
                            <div className={styles.qtyControl}>
                              {item.user_id === currentUser.id ? (
                                <>
                                  <button
                                    onClick={() =>
                                      handleUpdateQuantity(item.id, -1)
                                    }
                                  >
                                    <FaMinus />
                                  </button>
                                  <span>{item.quantity}</span>
                                  <button
                                    onClick={() =>
                                      handleUpdateQuantity(item.id, 1)
                                    }
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
                            {item.user_id === currentUser.id && (
                              <button
                                className={styles.itemDeleteBtn}
                                onClick={() => handleRemoveItem(item.id)}
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
            <span>
              {groupData.items.reduce((sum, i) => sum + i.quantity, 0)}
            </span>
          </div>
          <div className={styles.summaryTotal}>
            <span>Total</span>
            <span style={{ color: "var(--primary-color)" }}>
              {formatCurrency(totalAmount)}
            </span>
          </div>
          {isCreator ? (
            <>
              <button
                className={styles.finalizeBtn}
                onClick={handleFinalizeOrder}
              >
                <div className={styles.buttonContent}>
                  <FaShoppingBag /> Finalize Order
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
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Group Order</h1>
        <p className={styles.subtitle}>
          Eat together, pay together (or split later!)
        </p>
      </header>
      {viewMode === "selection" ? renderSelection() : renderDashboard()}
    </div>
  );
};

export default GroupOrder;
