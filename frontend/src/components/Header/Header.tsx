import React, { useState, useRef, useEffect } from "react";
import styles from "./Header.module.css";
import { FaShoppingCart } from "react-icons/fa";
import { IoIosMenu } from "react-icons/io";
import { FaUser } from "react-icons/fa";
import { GoSearch } from "react-icons/go";
import { Link } from "react-router-dom";

export default function Header() {
  const [activeLink, setActiveLink] = useState("Home");
  const [openMenu, setOpenMenu] = useState<boolean>(false);
  const avatarRef = useRef<HTMLDivElement>(null);

  const navItems = ["Home", "Menu", "Offers", "Service", "About us"];

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
        {/* Cart */}
        <div className={styles.cart}>
          <a href="#">
            <FaShoppingCart className={styles["cart-icon"]} />
          </a>
        </div>

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
              <p>Đăng nhập</p>
              <p>Đăng ký</p>
              <p>Theo dõi đơn hàng</p>
              <p>Đổi điểm</p>
              <p>Hỗ trợ khách hàng</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
