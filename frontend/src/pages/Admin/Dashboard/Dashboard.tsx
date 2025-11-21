import React from "react";
import { Grid, Paper, Typography, Box, Avatar } from "@mui/material";
import {
  AttachMoney,
  ShoppingCart,
  AccessTime,
  TrendingUp,
} from "@mui/icons-material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import styles from "./Dashboard.module.css";

const topSellingProducts = [
  {
    id: 1,
    name: "Margherita Pizza",
    qty: 500,
    revenue: 129000,
    image:
      "https://images.unsplash.com/photo-1593253784644-2e108b3e6f9f?w=400&h=300&fit=crop&crop=center",
  },
  {
    id: 2,
    name: "Pepperoni Pizza",
    qty: 400,
    revenue: 149000,
    image:
      "https://images.unsplash.com/photo-1625398112201-58d5a5f8c6f7?w=400&h=300&fit=crop&crop=center",
  },
  {
    id: 3,
    name: "BBQ Chicken Pizza",
    qty: 300,
    revenue: 159000,
    image:
      "https://images.unsplash.com/photo-1626646736310-8e1e3e3d8f8e?w=400&h=300&fit=crop&crop=center",
  },
  {
    id: 4,
    name: "Four Cheese Pizza",
    qty: 200,
    revenue: 169000,
    image:
      "https://images.unsplash.com/photo-1559058775-530e32471d8a?w=400&h=300&fit=crop&crop=center",
  },
  {
    id: 5,
    name: "Spicy Seafood Pizza",
    qty: 100,
    revenue: 179000,
    image:
      "https://images.unsplash.com/photo-1571068969003-0a88d6d574d8?w=400&h=300&fit=crop&crop=center",
  },
];

const todayRevenue = 6875000;
const monthRevenue = 189240000;
const totalOrders = 1247;
const pendingOrders = 42;

const revenueChartData = [
  { day: "01/11", revenue: 48500000 },
  { day: "02/11", revenue: 52100000 },
  { day: "03/11", revenue: 59800000 },
  { day: "04/11", revenue: 61200000 },
  { day: "05/11", revenue: 67800000 },
  { day: "06/11", revenue: 74300000 },
  { day: "07/11", revenue: 82100000 },
  { day: "08/11", revenue: 79500000 },
  { day: "09/11", revenue: 88200000 },
  { day: "10/11", revenue: 91600000 },
  { day: "11/11", revenue: 97300000 },
  { day: "12/11", revenue: 104200000 },
  { day: "13/11", revenue: 98700000 },
  { day: "14/11", revenue: 112300000 },
  { day: "15/11", revenue: 108900000 },
  { day: "16/11", revenue: 119800000 },
  { day: "17/11", revenue: 115400000 },
  { day: "18/11", revenue: 123700000 },
  { day: "19/11", revenue: 118200000 },
  { day: "20/11", revenue: 68750000 },
];

const formatCurrency = (value: number): string => {
  return value.toLocaleString("vi-VN") + "đ";
};

const StatCard = ({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}) => (
  <Paper className={styles.statCard}>
    <div
      className={styles.iconWrapper}
      style={{ backgroundColor: color + "22" }}
    >
      <Icon className={styles.statIcon} style={{ color }} />
    </div>
    <div>
      <Typography
        variant="body2"
        color="text.secondary"
        className={styles.statTitle}
      >
        {title}
      </Typography>
      <Typography variant="h4" className={styles.statValue} style={{ color }}>
        {value}
      </Typography>
    </div>
  </Paper>
);

const Dashboard = () => {
  return (
    <Box className={styles.container}>
      <Typography variant="h4" className={styles.pageTitle}>
        Dashboard Quản Trị
      </Typography>

      <Grid container spacing={4} className={styles.statsGrid}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="Doanh thu hôm nay"
            value={formatCurrency(todayRevenue)}
            icon={AttachMoney}
            color="#2e7d32"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="Doanh thu tháng này"
            value={formatCurrency(monthRevenue)}
            icon={TrendingUp}
            color="#ed6c02"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="Tổng đơn hàng"
            value={totalOrders.toLocaleString()}
            icon={ShoppingCart}
            color="#1976d2"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="Đơn hàng đang chờ"
            value={pendingOrders}
            icon={AccessTime}
            color="#d32f2f"
          />
        </Grid>
      </Grid>

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, xl: 8 }}>
          <Paper className={styles.chartCard}>
            <Typography variant="h6" className={styles.sectionTitle}>
              Doanh thu 20 ngày gần nhất
            </Typography>
            <ResponsiveContainer width="100%" height={380}>
              <LineChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="4 4" stroke="#e0e0e0" />
                <XAxis dataKey="day" />
                <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(0)}tr`} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "none",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#1976d2"
                  strokeWidth={4}
                  dot={{ fill: "#1976d2", r: 6 }}
                  activeDot={{ r: 9 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, xl: 4 }}>
          <Paper className={styles.topProductsCard}>
            <Typography variant="h6" className={styles.sectionTitle}>
              Top 5 món bán chạy
            </Typography>
            <Box className={styles.topList}>
              {topSellingProducts.map((item, index) => (
                <Box key={item.id} className={styles.topItemWithImage}>
                  <Box
                    className={styles.rankBadge}
                    style={{
                      color: index < 3 ? "var(--primary-color)" : "#666",
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
                      {item.qty} món • {formatCurrency(item.revenue)}
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
