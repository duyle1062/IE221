import React, { useState, useEffect } from "react";
import styles from "./Banner.module.css";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

// Import ảnh
import banner1 from "../../assets/images/Red-Modern-Fried-Chicken-Grand-Opening-Promotion-Banner.png";
import banner2 from "../../assets/images/Food-Web-Banner-03.jpg";
import banner3 from "../../assets/images/burger-hamburger-cheeseburger-fastfood-web-banner-with-copy-space-generative-ai-free-photo.jpg";

const banners: string[] = [banner1, banner2, banner3];

export default function Banner() {
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === banners.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? banners.length - 1 : prevIndex - 1
    );
  };

  useEffect(() => {
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.container}>
      {/* Banner */}
      <div
        className={styles.banner}
        style={{ backgroundImage: `url(${banners[currentIndex]})` }}
      ></div>

      {/* Left Arrow */}
      <button className={`${styles.arrow} ${styles.left}`} onClick={prevSlide}>
        <FaChevronLeft />
      </button>

      {/* Right Arrow */}
      <button className={`${styles.arrow} ${styles.right}`} onClick={nextSlide}>
        <FaChevronRight />
      </button>

      {/* Dots Navigate */}
      <div className={styles.dots}>
        {banners.map((_, index) => (
          <span
            key={index}
            className={`${styles.dot} ${
              currentIndex === index ? styles.active : ""
            }`}
            onClick={() => setCurrentIndex(index)}
          ></span>
        ))}
      </div>
    </div>
  );
}
