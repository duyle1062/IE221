import React, { useState } from "react";
import {
  Grid,
  Paper,
  Typography,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Avatar,
} from "@mui/material";
import {
  CalendarOutlined,
  TeamOutlined,
  UserOutlined,
  RiseOutlined,
} from "@ant-design/icons";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import styles from "./Reports.module.css";

// Mock data theo đúng cấu trúc backend
const revenueDataDaily = [
  { date: "01/11", revenue: 48500000, order_count: 142 },
  { date: "02/11", revenue: 52100000, order_count: 158 },
  { date: "03/11", revenue: 59800000, order_count: 171 },
  { date: "04/11", revenue: 61200000, order_count: 165 },
  { date: "05/11", revenue: 67800000, order_count: 189 },
  { date: "06/11", revenue: 74300000, order_count: 201 },
  { date: "07/11", revenue: 82100000, order_count: 223 },
  { date: "08/11", revenue: 79500000, order_count: 218 },
  { date: "09/11", revenue: 88200000, order_count: 241 },
  { date: "10/11", revenue: 91600000, order_count: 256 },
  { date: "11/11", revenue: 97300000, order_count: 272 },
  { date: "12/11", revenue: 104200000, order_count: 289 },
  { date: "13/11", revenue: 98700000, order_count: 275 },
  { date: "14/11", revenue: 112300000, order_count: 301 },
  { date: "15/11", revenue: 108900000, order_count: 294 },
];

const revenueDataMonthly = [
  { date: "06/2025", revenue: 2450000000, order_count: 3214 },
  { date: "07/2025", revenue: 2890000000, order_count: 3789 },
  { date: "08/2025", revenue: 3120000000, order_count: 4102 },
  { date: "09/2025", revenue: 3560000000, order_count: 4567 },
  { date: "10/2025", revenue: 4210000000, order_count: 5231 },
  { date: "11/2025", revenue: 1892400000, order_count: 2478 },
];

const orderRatioData = {
  individual_orders_count: 892,
  individual_orders_revenue: 1425000000,
  individual_orders_percentage: 71.61,
  group_orders_count: 355,
  group_orders_revenue: 467400000,
  group_orders_percentage: 28.39,
  total_orders_count: 1247,
  total_revenue: 1892400000,
};

const topProducts = [
  {
    product_id: 12,
    product_name: "Margherita Pizza",
    quantity_sold: 892,
    revenue: 321120000,
    image:
      "https://images.unsplash.com/photo-1593253784644-2e108b3e6f9f?w=400&h=300&fit=crop",
  },
  {
    product_id: 15,
    product_name: "Pepperoni Pizza",
    quantity_sold: 745,
    revenue: 283100000,
    image:
      "https://images.unsplash.com/photo-1625398112201-58d5a5f8c6f7?w=400&h=300&fit=crop",
  },
  {
    product_id: 18,
    product_name: "BBQ Chicken Pizza",
    quantity_sold: 612,
    revenue: 257040000,
    image:
      "https://images.unsplash.com/photo-1626646736310-8e1e3e3d8f8e?w=400&h=300&fit=crop",
  },
  {
    product_id: 21,
    product_name: "Four Cheese Pizza",
    quantity_sold: 489,
    revenue: 224940000,
    image:
      "https://images.unsplash.com/photo-1559058775-530e32471d8a?w=400&h=300&fit=crop",
  },
  {
    product_id: 25,
    product_name: "Spicy Seafood Pizza",
    quantity_sold: 378,
    revenue: 189000000,
    image:
      "https://images.unsplash.com/photo-1571068969003-0a88d6d574d8?w=400&h=300&fit=crop",
  },
  // Add 5 more items for top 10
  ...Array(5)
    .fill(null)
    .map((_, i) => ({
      product_id: 30 + i,
      product_name: `Special Dish #${i + 1}`, // Dịch "Món ngon đặc biệt"
      quantity_sold: 300 - i * 40,
      revenue: (300 - i * 40) * 420000,
      image:
        "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=300&fit=crop",
    })),
];

const pieData = [
  {
    name: "Individual Orders",
    value: orderRatioData.individual_orders_count,
    revenue: orderRatioData.individual_orders_revenue,
  },
  {
    name: "Group Orders",
    value: orderRatioData.group_orders_count,
    revenue: orderRatioData.group_orders_revenue,
  },
];

const COLORS = ["#1976d2", "#ff6b6b"];

const formatCurrency = (value: number): string => {
  return value.toLocaleString("vi-VN") + "đ";
};

const Reports: React.FC = () => {
  const [period, setPeriod] = useState<"day" | "month">("day");
  const revenueData = period === "day" ? revenueDataDaily : revenueDataMonthly;

  return (
    <Box className={styles.container}>
      <Typography variant="h4" className={styles.pageTitle}>
        Reports & Statistics
      </Typography>

      {/* 1. Doanh thu theo ngày/tháng -> 1. Revenue by Day/Month */}
      <Grid container spacing={4} className={styles.section}>
        <Grid size={{ xs: 12 }}>
          <Paper className={styles.chartCard}>
            <Box className={styles.headerWithSelect}>
              <Box display="flex" alignItems="center" gap={2}>
                <CalendarOutlined style={{ fontSize: 28, color: "#1976d2" }} />
                <Typography variant="h6" className={styles.sectionTitle}>
                  Revenue by {period === "day" ? "Day" : "Month"}
                </Typography>
              </Box>

              <FormControl size="small" className={styles.periodSelect}>
                <InputLabel>Period</InputLabel>
                <Select
                  value={period}
                  label="Period"
                  onChange={(e) => setPeriod(e.target.value as "day" | "month")}
                >
                  <MenuItem value="day">By Day</MenuItem>
                  <MenuItem value="month">By Month</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <ResponsiveContainer width="100%" height={420}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="4 4" stroke="#e0e0e0" />
                <XAxis dataKey="date" />
                <YAxis
                  tickFormatter={(v) =>
                    period === "day"
                      ? `${(v / 1000000).toFixed(0)}M`
                      : `${(v / 1000000000).toFixed(1)}B`
                  }
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    borderRadius: 12,
                    border: "none",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                  }}
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
      </Grid>

      {/* 2. Tỷ lệ đơn cá nhân vs nhóm + Top 10 -> 2. Individual vs Group Order Ratio + Top 10 */}
      <Grid container spacing={4} className={styles.section}>
        {/* Tỷ lệ đơn -> Order Ratio */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper className={styles.ratioCard}>
            <Box display="flex" alignItems="center" gap={2} mb={3}>
              <TeamOutlined style={{ fontSize: 28, color: "#ff6b6b" }} />
              <Typography variant="h6" className={styles.sectionTitle}>
                Individual vs Group Order Ratio
              </Typography>
            </Box>

            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value} orders`} />
              </PieChart>
            </ResponsiveContainer>

            <Box className={styles.legend}>
              {pieData.map((entry, index) => (
                <Box key={index} className={styles.legendItem}>
                  {index === 0 ? (
                    <UserOutlined
                      style={{ fontSize: 20, color: COLORS[index] }}
                    />
                  ) : (
                    <TeamOutlined
                      style={{ fontSize: 20, color: COLORS[index] }}
                    />
                  )}
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {entry.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {entry.value.toLocaleString()} orders (
                      {(
                        (entry.value / orderRatioData.total_orders_count) *
                        100
                      ).toFixed(1)}
                      %)
                      <br />
                      {formatCurrency(entry.revenue)}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>

            <Box className={styles.totalBox}>
              <Typography variant="h5" fontWeight="bold" color="primary">
                Total: {orderRatioData.total_orders_count.toLocaleString()}{" "}
                orders • {formatCurrency(orderRatioData.total_revenue)}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Top 10 sản phẩm -> Top 10 Products */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper className={styles.topProductsCard}>
            <Box display="flex" alignItems="center" gap={2} mb={3}>
              <RiseOutlined style={{ fontSize: 28, color: "#4caf50" }} />
              <Typography variant="h6" className={styles.sectionTitle}>
                Top 10 Bestselling Items (This Month)
              </Typography>
            </Box>

            <Box className={styles.topList}>
              {topProducts.slice(0, 10).map((item, index) => (
                <Box key={item.product_id} className={styles.topItem}>
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
                    alt={item.product_name}
                    className={styles.productImage}
                  />

                  <Box className={styles.productInfo}>
                    <Typography
                      variant="subtitle1"
                      fontWeight="bold"
                      className={styles.productName}
                    >
                      {item.product_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.quantity_sold.toLocaleString()} items •{" "}
                      {formatCurrency(item.revenue)}
                    </Typography>
                  </Box>

                  <Box className={styles.revenueHighlight}>
                    <RiseOutlined style={{ color: "#4caf50" }} />
                    <Typography
                      variant="subtitle2"
                      fontWeight="bold"
                      color="#4caf50"
                    >
                      {(item.revenue / 1000000).toFixed(1)}tr
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

export default Reports;
