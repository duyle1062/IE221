import React, { useState } from "react";
import { useLocation, useNavigate, Outlet } from "react-router-dom";
import {
  Box,
  AppBar,
  Toolbar,
  Avatar,
  Popover,
  MenuItem,
  Typography,
} from "@mui/material";
import { Menu, Button, message } from "antd";
import {
  DashboardOutlined,
  ShoppingCartOutlined,
  AppstoreOutlined,
  TeamOutlined,
  BarChartOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../context/AuthContext";

import styles from "./LayoutAdmin.module.css";

const drawerWidth = 250;
const collapsedWidth = 85;

const LayoutAdmin: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const userName = user ? `${user.firstname} ${user.lastname}` : "Admin User";

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget as HTMLElement);
  };

  const handleClose = () => setAnchorEl(null);
  
  const handleLogout = async () => {
    try {
      await logout();
      message.success("Logged out successfully!");
      navigate("/login");
    } catch (error) {
      message.error("Failed to logout. Please try again.");
    }
    handleClose();
  };

  const toggleCollapsed = () => setCollapsed(!collapsed);

  const getCurrentKey = () => {
    const path = location.pathname;
    if (path.includes("/orders-admin")) return "orders";
    if (path.includes("/products-admin")) return "products";
    if (path.includes("/users-admin")) return "users";
    if (path.includes("/reports")) return "reports";
    return "dashboard";
  };

  const menuItems = [
    {
      key: "dashboard",
      icon: <DashboardOutlined />,
      label: "Dashboard",
      onClick: () => navigate("/dashboard"),
    },
    {
      key: "orders",
      icon: <ShoppingCartOutlined />,
      label: "Order Management",
      onClick: () => navigate("/orders-admin"),
    },
    {
      key: "products",
      icon: <AppstoreOutlined />,
      label: "Product Management",
      onClick: () => navigate("/products-admin"),
    },
    {
      key: "users",
      icon: <TeamOutlined />,
      label: "User Management",
      onClick: () => navigate("/users-admin"),
    },
    {
      key: "reports",
      icon: <BarChartOutlined />,
      label: "Reports",
      onClick: () => navigate("/reports"),
    },
  ];

  return (
    <Box sx={{ display: "flex", height: "100vh" }}>
      <Box className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[getCurrentKey()]}
          defaultSelectedKeys={["dashboard"]}
          items={menuItems}
          inlineCollapsed={collapsed}
          className={styles.antMenu}
        />
      </Box>

      <Box
        className={`${styles.mainContent} ${
          collapsed ? styles.mainContentCollapsed : ""
        }`}
      >
        <AppBar className={styles.appBar}>
          <Toolbar className={styles.toolbar}>
            <Box className={styles.userProfile} onClick={handleMenuClick}>
              <Avatar src="/avatar.jpg" alt="Admin" />
              <Box sx={{ ml: 1 }}>
                <Typography variant="subtitle1">{userName}</Typography>
                <Typography variant="body2" color="textSecondary">
                  Admin
                </Typography>
              </Box>
            </Box>

            <Popover
              open={Boolean(anchorEl)}
              anchorEl={anchorEl}
              onClose={handleClose}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
            >
              <MenuItem onClick={handleClose}>Account</MenuItem>
              <MenuItem onClick={handleLogout}>Log out</MenuItem>
            </Popover>
          </Toolbar>
        </AppBar>

        <Box className={styles.content}>
          <Outlet />
        </Box>
      </Box>

      <Button
        type="text"
        onClick={toggleCollapsed}
        className={styles.toggleButton}
        style={{
          left: collapsed ? `${collapsedWidth}px` : `${drawerWidth + 5}px`,
        }}
      >
        {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
      </Button>
    </Box>
  );
};

export default LayoutAdmin;
