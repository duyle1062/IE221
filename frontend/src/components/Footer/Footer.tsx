import React from "react";
import styles from "./Footer.module.css";

const Footer: React.FC = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContainer}>
        <div className={styles.footerSection}>
          <h3 className={styles.footerTitle}>Contact Us</h3>
          <p>Email: support@example.com</p>
          <p>Phone: +84 123 456 789</p>
          <p>Address: 123 Hanoi Street, Vietnam</p>
        </div>
        <div className={styles.footerSection}>
          <h3 className={styles.footerTitle}>Quick Links</h3>
          <ul className={styles.footerList}>
            <li>
              <a href="/about">About Us</a>
            </li>
            <li>
              <a href="/services">Services</a>
            </li>
            <li>
              <a href="/contact">Contact</a>
            </li>
            <li>
              <a href="/privacy">Privacy Policy</a>
            </li>
          </ul>
        </div>
        <div className={styles.footerSection}>
          <h3 className={styles.footerTitle}>Follow Us</h3>
          <ul className={styles.footerList}>
            <li>
              <a href="https://facebook.com">Facebook</a>
            </li>
            <li>
              <a href="https://twitter.com">Twitter</a>
            </li>
            <li>
              <a href="https://instagram.com">Instagram</a>
            </li>
          </ul>
        </div>
      </div>
      <div className={styles.footerBottom}>
        <p>
          &copy; {new Date().getFullYear()} Your Company. All rights reserved
        </p>
      </div>
    </footer>
  );
};

export default Footer;
