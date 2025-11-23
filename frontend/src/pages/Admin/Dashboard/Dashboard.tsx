import React from "react";
import { Grid, Paper, Typography, Box, Avatar } from "@mui/material";
import {
  AttachMoneyOutlined,
  TrendingUpOutlined,
  ShoppingCartOutlined,
  AccessTimeOutlined,
} from "@mui/icons-material";
import styles from "./Dashboard.module.css";

// Mock data chuẩn backend
const todayRevenue = 68750000; // RevenueReportView (hôm nay)
const monthRevenue = 1892400000; // RevenueReportView (tháng này)
const totalOrders = 1247; // OrderRatioReportView
const pendingOrders = 42; // AdminOrderListView (đếm đơn chưa xong)

const topSellingProducts = [
  {
    id: 12,
    name: "Margherita Pizza",
    qty: 892,
    revenue: 321120000,
    image:
      "https://images.unsplash.com/photo-1593253784644-2e108b3e6f9f?w=400&h=300&fit=crop",
  },
  {
    id: 15,
    name: "Pepperoni Pizza",
    qty: 745,
    revenue: 283100000,
    image:
      "https://images.unsplash.com/photo-1625398112201-58d5a5f8c6f7?w=400&h=300&fit=crop",
  },
  {
    id: 18,
    name: "BBQ Chicken Pizza",
    qty: 612,
    revenue: 257040000,
    image:
      "https://images.unsplash.com/photo-1626646736310-8e1e3e3d8f8e?w=400&h=300&fit=crop",
  },
  {
    id: 21,
    name: "Four Cheese Pizza",
    qty: 489,
    revenue: 224940000,
    image:
      "https://images.unsplash.com/photo-1559058775-530e32471d8a?w=400&h=300&fit=crop",
  },
  {
    id: 25,
    name: "Spicy Seafood Pizza",
    qty: 378,
    revenue: 189000000,
    image:
      "https://images.unsplash.com/photo-1571068969003-0a88d6d574d8?w=400&h=300&fit=crop",
  },
];

const formatCurrency = (value: number): string => {
  if (value >= 1_000_000_000) {
    return (value / 1_000_000_000).toFixed(2).replace(".00", "") + " B";
  }
  if (value >= 1_000_000) {
    return (value / 1_000_000).toFixed(1) + " M";
  }
  return value.toLocaleString("vi-VN") + "đ";
};

const StatCard = ({
  title,
  value,
  icon: Icon,
  color,
  bgGradient,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  bgGradient?: string;
}) => (
  <Paper className={styles.statCard}>
    <Box
      className={styles.iconWrapper}
      style={{ background: bgGradient || color + "22" }}
    >
      <Icon className={styles.statIcon} style={{ color }} />
    </Box>
    <Box>
      <Typography className={styles.statTitle}>{title}</Typography>
      <Typography className={styles.statValue}>{value}</Typography>
    </Box>
  </Paper>
);

const Dashboard: React.FC = () => {
  return (
    <Box className={styles.container}>
      <Typography variant="h4" className={styles.pageTitle}>
        DASHBOARD
      </Typography>

      {/* 4 thẻ thống kê */}
      <Grid container spacing={4} className={styles.statsGrid}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="TODAY'S REVENUE"
            value={formatCurrency(todayRevenue)}
            icon={AttachMoneyOutlined}
            color="#1976d2"
            bgGradient="linear-gradient(135deg, #1976d222, #42a5f522)"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="MONTHLY REVENUE"
            value={formatCurrency(monthRevenue)}
            icon={TrendingUpOutlined}
            color="#4caf50"
            bgGradient="linear-gradient(135deg, #4caf5022, #81c78422)"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="TOTAL ORDERS"
            value={totalOrders.toLocaleString()}
            icon={ShoppingCartOutlined}
            color="#ff9800"
            bgGradient="linear-gradient(135deg, #ff980022, #ffb74d22)"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="PENDING ORDERS"
            value={pendingOrders}
            icon={AccessTimeOutlined}
            color="#d32f2f"
            bgGradient="linear-gradient(135deg, #d32f2f22, #ef535022)"
          />
        </Grid>
      </Grid>

      {/* Top 5 món bán chạy - chiếm full chiều rộng còn lại */}
      <Grid container spacing={4}>
        <Grid size={12}>
          <Paper className={styles.topProductsCard}>
            <Box display="flex" alignItems="center" gap={2} mb={3}>
              <TrendingUpOutlined style={{ fontSize: 28, color: "#4caf50" }} />
              <Typography variant="h6" className={styles.sectionTitle}>
                TOP 5 BESTSELLING PRODUCTS
              </Typography>
            </Box>

            <Box className={styles.topList}>
              {topSellingProducts.map((item, index) => (
                <Box key={item.id} className={styles.topItem}>
                  <Box
                    className={styles.rankBadge}
                    style={{
                      background:
                        index === 0
                          ? "linear-gradient(135deg, #ffd700, #ffb800)"
                          : index === 1
                          ? "linear-gradient(135deg, #c0c0c0, #a0a0a0)"
                          : index === 2
                          ? "linear-gradient(135deg, #cd7f32, #a0522d)"
                          : "rgba(0,0,0,0.08)",
                      color: index < 3 ? "white" : "#333",
                    }}
                  >
                    #{index + 1}
                  </Box>

                  <Avatar
                    variant="rounded"
                    src={item.image}
                    alt={item.name}
                    className={styles.productImage}
                  />

                  <Box className={styles.productInfo}>
                    <Typography
                      variant="subtitle1"
                      fontWeight="bold"
                      className={styles.productName}
                    >
                      {item.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.qty.toLocaleString()} items •{" "}
                      {formatCurrency(item.revenue)}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
