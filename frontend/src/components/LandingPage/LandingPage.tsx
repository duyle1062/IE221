import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { UserRole } from "../../services/auth.service";
import HomePage from "../../pages/HomePage/HomePage";

/**
 * Landing Page Component
 * Redirects ADMIN users to dashboard, shows HomePage for regular users
 */
export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is logged in and is ADMIN, redirect to dashboard
    if (user && user.role === UserRole.ADMIN) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  // For non-admin users (including guests), show HomePage
  return <HomePage />;
}
