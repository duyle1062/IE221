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
import { Menu, Button } from "antd";
import {
  DashboardOutlined,
  ShoppingCartOutlined,
  AppstoreOutlined,
  TeamOutlined,
  BarChartOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";

import styles from "./LayoutAdmin.module.css";

const drawerWidth = 250;
const collapsedWidth = 85;

const LayoutAdmin: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Dữ liệu tạm (sau này thay bằng AuthContext)
  const userName = "Admin User";
  const logout = () => {
    alert("Đã đăng xuất (tạm thời)");
    // navigate('/login');
  };

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget as HTMLElement);
  };

  const handleClose = () => setAnchorEl(null);
  const handleLogout = () => {
    logout();
    handleClose();
  };

  const toggleCollapsed = () => setCollapsed(!collapsed);

  // Tự động highlight menu dựa trên URL
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
      {/* Sidebar */}
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

      {/* Main Content */}
      <Box className={styles.mainContent}>
        {/* AppBar */}
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
              <MenuItem onClick={handleClose}>Tài khoản</MenuItem>
              <MenuItem onClick={handleLogout}>Đăng xuất</MenuItem>
            </Popover>
          </Toolbar>
        </AppBar>

        {/* Nội dung trang */}
        <Box className={styles.content}>
          <Outlet />
        </Box>
      </Box>

      {/* Nút toggle sidebar */}
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
