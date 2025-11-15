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

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forget-password" element={<ForgetPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/homepage" element={<HomePage />} />
        <Route path="/product/:id" element={<ProductPage />} />

        <Route path="/category/pizza" element={<PizzaPage />} />
        <Route path="/category/chicken" element={<ChickenPage />} />
        <Route path="/category/salad" element={<SaladPage />} />
        <Route path="/category/drink" element={<DrinkPage />} />
        <Route path="/category/vegetarian" element={<VegetarianPage />} />
        <Route path="/category/combo" element={<ComboPage />} />
      </Routes>
    </Router>
  );
}
