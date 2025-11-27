import React, { useState, useEffect } from "react";
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
  CircularProgress,
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
import adminService, {
  RevenueData,
  TopProduct,
  OrderRatioData,
} from "../../../services/admin.service";

const COLORS = ["#1976d2", "#ff6b6b"];

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("en-US").format(Math.round(value)) + " VND";
};

const Reports: React.FC = () => {
  const [period, setPeriod] = useState<"day" | "month">("day");
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [orderRatioData, setOrderRatioData] = useState<OrderRatioData | null>(
    null
  );
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);

  useEffect(() => {
    const fetchReportsData = async () => {
      try {
        setLoading(true);
        // Clear previous data first to avoid showing stale data
        setRevenueData([]);

        // Calculate date range based on period
        const endDate = new Date().toISOString().split("T")[0];
        let startDate: string;

        if (period === "day") {
          // Last 30 days
          const start = new Date();
          start.setDate(start.getDate() - 30);
          startDate = start.toISOString().split("T")[0];
        } else {
          // Last 12 months
          const start = new Date();
          start.setMonth(start.getMonth() - 12);
          start.setDate(1); // Set to first day of that month
          startDate = start.toISOString().split("T")[0];
        }

        console.log(`Fetching ${period} data from ${startDate} to ${endDate}`);

        // Fetch all data in parallel
        const [revenueResponse, ratioResponse, productsResponse] =
          await Promise.all([
            adminService.getRevenueReport({
              period: period,
              start_date: startDate,
              end_date: endDate,
            }),
            adminService.getOrderRatio(),
            adminService.getTopProducts({
              sort_by: "revenue",
              limit: 10,
            }),
          ]);

        console.log(`Revenue data (${period}):`, revenueResponse.data);
        setRevenueData(revenueResponse.data || []);
        setOrderRatioData(ratioResponse);
        setTopProducts(productsResponse.data || []);
      } catch (error) {
        console.error("Error fetching reports data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReportsData();
  }, [period]);

  const pieData = orderRatioData
    ? [
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
      ]
    : [];

  if (loading) {
    return (
      <Box
        className={styles.container}
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

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
              <LineChart
                data={revenueData.map((item) => ({
                  ...item,
                  date:
                    period === "day"
                      ? new Date(item.date).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "2-digit",
                        })
                      : new Date(item.date).toLocaleDateString("en-US", {
                          month: "short",
                          year: "numeric",
                        }),
                }))}
              >
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
                      {orderRatioData &&
                        (
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
                Total: {orderRatioData?.total_orders_count.toLocaleString()}{" "}
                orders •{" "}
                {orderRatioData && formatCurrency(orderRatioData.total_revenue)}
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
                    alt={item.product_name}
                    className={styles.productImage}
                  >
                    {item.product_name.charAt(0)}
                  </Avatar>

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
                      {(item.revenue / 1000000).toFixed(1)}M
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
