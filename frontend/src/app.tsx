import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RegisterForm from "./pages/RegisterForm/Register";
import LoginForm from "./pages/LoginForm/Login";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/login" element={<LoginForm />} />
      </Routes>
    </Router>
  );
}
