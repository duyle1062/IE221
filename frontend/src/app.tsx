import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RegisterForm from "./pages/RegisterForm/Register";
import VerifyEmail from "./pages/VerifyEmail/VerifyEmail";
import ForgetPassword from "./pages/ForgetPassword/ForgetPassword";
import ResetPassword from "./pages/ResetPassword/ResetPassword";
import LoginForm from "./pages/LoginForm/Login";
import HomePage from "./pages/HomePage/HomePage";

import PizzaPage from "./pages/Category/PizzaPage";
import ChickenPage from "./pages/Category/ChickenPage";
import SaladPage from "./pages/Category/SaladPage";
import DrinkPage from "./pages/Category/DrinkPage";
import VegetarianPage from "./pages/Category/VegetarianPage";
import ComboPage from "./pages/Category/ComboPage";
import ProductPage from "./pages/ProductDetailPage/ProductDetailPage";
import UserProfile from "./pages/UserProfile/UserProfile";
import Cart from "./pages/Cart/Cart";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import CheckoutScreen from "./pages/Checkout/Checkout";

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
          <Route path="/category/pizza" element={<PizzaPage />} />
          <Route path="/category/chicken" element={<ChickenPage />} />
          <Route path="/category/salad" element={<SaladPage />} />
          <Route path="/category/drink" element={<DrinkPage />} />
          <Route path="/category/vegetarian" element={<VegetarianPage />} />
          <Route path="/category/combo" element={<ComboPage />} />
          <Route path="/checkout" element={<CheckoutScreen />} />

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
