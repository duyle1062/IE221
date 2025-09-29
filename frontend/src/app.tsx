import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RegisterForm from "./pages/RegisterForm/Register";
import VerifyEmail from "./pages/VerifyEmail/VerifyEmail";
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RegisterForm />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
      </Routes>
    </Router>
  );
}
