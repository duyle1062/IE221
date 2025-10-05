import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RegisterForm from "./pages/RegisterForm/Register";
import VerifyEmail from "./pages/VerifyEmail/VerifyEmail";
import ForgetPassword from "./pages/ForgetPassword/ForgetPassword";
import ResetPassword from "./pages/ResetPassword/ResetPassword";
import Footer from "./components/Footer/Footer";
import LoginForm from "./pages/LoginForm/Login";
import HomePage from "./pages/HomePage/HomePage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forget-password" element={<ForgetPassword />} />  
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/homepage" element={<HomePage />}></Route>
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/login" element={<LoginForm />} />
      </Routes>
      <Footer/>
    </Router>
  );
}
