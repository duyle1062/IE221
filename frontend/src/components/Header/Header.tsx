import { useState, useRef, useEffect } from "react";
import styles from "./Header.module.css";
import { FaShoppingCart, FaUser, FaUsers } from "react-icons/fa";
import { IoIosMenu } from "react-icons/io";
import { GoSearch } from "react-icons/go";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Header() {
  const [activeLink, setActiveLink] = useState("Home");
  const [openMenu, setOpenMenu] = useState<boolean>(false);
  const avatarRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();

  const navItems = ["Home", "Menu", "Offers", "Service", "About us"];

  const handleLogout = async () => {
    try {
      await logout();
      setOpenMenu(false);
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      // Still navigate to login even if logout API fails
      setOpenMenu(false);
      navigate("/login");
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setOpenMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={styles.container}>
      {/* Logo */}
      <div className={styles.logo}>
        <p>Logo</p>
      </div>

      {/* Search Bar */}
      <div className={styles["search-bar"]}>
        <GoSearch className={styles["search-icon"]} />
        <input
          type="text"
          placeholder="Search"
          className={styles["search-input"]}
        />
      </div>

      {/* Navigation */}
      <div className={styles.nav}>
        <ul>
          {navItems.map((item) => (
            <li key={item}>
              <a
                href="#"
                className={activeLink === item ? styles.active : ""}
                onClick={() => setActiveLink(item)}
              >
                {item}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* Action */}
      <div className={styles.actions}>
        {/* Cart - Only show when logged in */}
        {isAuthenticated && (
          <>
            <div className={styles.cart}>
              <Link to="/cart">
                <FaShoppingCart className={styles["cart-icon"]} />
              </Link>
            </div>
          </>
        )}

        {/* Avatar */}
        <div
          ref={avatarRef}
          className={styles.avatar}
          onClick={() => setOpenMenu((prev) => !prev)}
        >
          <IoIosMenu className={styles["menu-icon"]} />
          <FaUser className={styles["user-icon"]} />

          {openMenu && (
            <div className={styles.dropdown}>
              {!isAuthenticated ? (
                // Menu for guests
                <>
                  <Link to="/login" onClick={() => setOpenMenu(false)}>
                    <p>Sign In</p>
                  </Link>
                  <Link to="/register" onClick={() => setOpenMenu(false)}>
                    <p>Register</p>
                  </Link>
                </>
              ) : (
                // Menu for logged in users
                <>
                  <Link to="/userprofile" onClick={() => setOpenMenu(false)}>
                    <p>User Profile</p>
                  </Link>
                  <Link to="/orders" onClick={() => setOpenMenu(false)}>
                    <p>Order Tracking</p>
                  </Link>
                  <Link to="/group-order" onClick={() => setOpenMenu(false)}>
                    <p>View Group Order</p>
                  </Link>
                  <Link
                    to="/forget-password"
                    onClick={() => setOpenMenu(false)}
                  >
                    <p>Forgot Password</p>
                  </Link>
                  <p onClick={handleLogout} style={{ cursor: "pointer" }}>
                    Log out
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
