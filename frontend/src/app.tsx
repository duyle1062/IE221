import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RegisterForm from "./pages/RegisterForm/Register";
import VerifyEmail from "./pages/VerifyEmail/VerifyEmail";
import ForgetPassword from "./pages/ForgetPassword/ForgetPassword";
import ResetPassword from "./pages/ResetPassword/ResetPassword";
import LoginForm from "./pages/LoginForm/Login";
import HomePage from "./pages/HomePage/HomePage";

import Category from "./pages/Category/Category";
import ProductDetailPage from "./pages/ProductDetail/ProductDetail";
import UserProfile from "./pages/UserProfile/UserProfile";
import Cart from "./pages/Cart/Cart";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import Checkout from "./pages/Checkout/Checkout";
import OrderHistory from "./pages/OrderHistory/OrderTracking";
import GroupOrder from "./pages/GroupOrder/GroupOrder";
import PaymentResult from "./pages/PaymentResult/PaymentResult";
import Orders from "./pages/Orders/Orders";

import LayoutAdmin from "./components/LayoutAdmin/LayoutAdmin";
import Dashboard from "./pages/Admin/Dashboard/Dashboard";
import OrderManagement from "./pages/Admin/OrderManagement/OrderManagement";
import ProductManagement from "./pages/Admin/ProductManagement/ProductManagement";
import UserManagement from "./pages/Admin/UserManagement/UserManagement";
import Reports from "./pages/Admin/Reports/Reports";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forget-password" element={<ForgetPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/" element={<HomePage />} />
          <Route
            path="/product/:categorySlug/:productSlug"
            element={<ProductDetailPage />}
          />
          <Route path="/category/:slug" element={<Category />} />
          <Route path="/group-order" element={<GroupOrder />} />
          <Route path="/payment/result" element={<PaymentResult />} />

          {/* Tui chưa hiểu đoạn phân quyền dưới á nên để tạm đường dẫn trang của Admin ở đây nha */}
          <Route element={<LayoutAdmin />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/orders-admin" element={<OrderManagement />} />
            <Route path="/products-admin" element={<ProductManagement />} />
            <Route path="/users-admin" element={<UserManagement />} />
            <Route path="/reports" element={<Reports />} />
          </Route>

          {/* Protected Routes - Require Authentication */}
          <Route
            path="/userprofile"
            element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <Cart />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/order-history"
            element={
              <ProtectedRoute>
                <OrderHistory />
              </ProtectedRoute>
            }
          />

          {/* Admin Only Routes - Require Admin Role */}
          {/* Example: Uncomment and add admin routes as needed */}
          {/* <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute adminOnly>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          /> */}
        </Routes>
      </Router>
    </AuthProvider>
  );
}
