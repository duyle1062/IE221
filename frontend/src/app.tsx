import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RegisterForm from "./pages/RegisterForm/Register";
import VerifyEmail from "./pages/VerifyEmail/VerifyEmail";
import ForgetPassword from "./pages/ForgetPassword/ForgetPassword";
import ResetPassword from "./pages/ResetPassword/ResetPassword";
import LoginForm from "./pages/LoginForm/Login";
import HomePage from "./pages/HomePage/HomePage";

import Category from "./pages/Category/Category";
import ProductPage from "./pages/ProductDetailPage/ProductDetailPage";
import UserProfile from "./pages/UserProfile/UserProfile";
import Cart from "./pages/Cart/Cart";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import Checkout from "./pages/Checkout/Checkout";
import OrderTracking from "./pages/OrderTracking/OrderTracking";

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
          <Route path="/product/:id" element={<HomePage />} />
          <Route path="/category/:slug" element={<Category />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<OrderTracking />} />

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
