import React, { useEffect, useState } from "react";
import {
  Grid,
  Paper,
  Typography,
  Box,
  Avatar,
  CircularProgress,
} from "@mui/material";
import {
  AttachMoneyOutlined,
  TrendingUpOutlined,
  ShoppingCartOutlined,
  AccessTimeOutlined,
} from "@mui/icons-material";
import styles from "./Dashboard.module.css";
import adminService, { TopProduct } from "../../../services/admin.service";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [monthRevenue, setMonthRevenue] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [topSellingProducts, setTopSellingProducts] = useState<TopProduct[]>(
    []
  );

  useEffect(() => {
    let isMounted = true;

    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Get today's date
        const today = new Date().toISOString().split("T")[0];
        const firstDayOfMonth = new Date(
          new Date().getFullYear(),
          new Date().getMonth(),
          1
        )
          .toISOString()
          .split("T")[0];

        console.log("Fetching dashboard data...", { today, firstDayOfMonth });

        // Fetch all data in parallel
        const [
          todayRevenueData,
          monthRevenueData,
          orderRatioData,
          pendingCount,
          topProductsData,
        ] = await Promise.all([
          // Today's revenue
          adminService.getRevenueReport({
            period: "day",
            start_date: today,
            end_date: today,
          }),
          // Month's revenue
          adminService.getRevenueReport({
            period: "day",
            start_date: firstDayOfMonth,
            end_date: today,
          }),
          // Total orders
          adminService.getOrderRatio(),
          // Pending orders
          adminService.getPendingOrdersCount(),
          // Top products
          adminService.getTopProducts({
            sort_by: "revenue",
            limit: 5,
          }),
        ]);

        if (!isMounted) return;

        console.log("API Responses:", {
          todayRevenueData,
          monthRevenueData,
          orderRatioData,
          pendingCount,
          topProductsData,
        });

        // Set today's revenue
        if (todayRevenueData.data && todayRevenueData.data.length > 0) {
          setTodayRevenue(parseFloat(todayRevenueData.data[0].revenue));
        } else {
          console.warn("No today revenue data");
        }

        // Set month's revenue (sum all days)
        if (monthRevenueData.data && monthRevenueData.data.length > 0) {
          const monthTotal = monthRevenueData.data.reduce(
            (sum: number, day: any) => sum + parseFloat(day.revenue),
            0
          );
          setMonthRevenue(monthTotal);
        } else {
          console.warn("No month revenue data");
        }

        // Set total orders
        setTotalOrders(orderRatioData.total_orders_count);

        // Set pending orders
        setPendingOrders(pendingCount);

        // Set top products
        if (topProductsData.data && topProductsData.data.length > 0) {
          setTopSellingProducts(topProductsData.data);
        } else {
          console.warn("No top products data");
        }
      } catch (error: any) {
        console.error("Error fetching dashboard data:", error);
        console.error("Error details:", {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          stack: error.stack,
        });

        if (error.response?.status === 403) {
          setError(
            "Access Denied: Admin privileges required to view dashboard data."
          );
        } else if (error.response?.status === 401) {
          setError("Please log in to access the dashboard.");
        } else if (error.message) {
          setError(`Error: ${error.message}`);
        } else {
          setError("Failed to load dashboard data. Please try again.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

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

  if (error) {
    return (
      <Box className={styles.container}>
        <Typography variant="h4" className={styles.pageTitle}>
          DASHBOARD
        </Typography>
        <Paper sx={{ p: 4, textAlign: "center", mt: 4 }}>
          <Typography variant="h6" color="error" gutterBottom>
            {error}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Please log in with an admin account to access the dashboard.
          </Typography>
        </Paper>
      </Box>
    );
  }

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
              {topSellingProducts.length > 0 ? (
                topSellingProducts.map((item, index) => (
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
                  </Box>
                ))
              ) : (
                <Box p={3} textAlign="center">
                  <Typography variant="body1" color="text.secondary">
                    No sales data available
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
