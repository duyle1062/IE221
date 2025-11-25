import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Card.module.css";
import { Product } from "../../types/product.types";
import recommendationService from "../../services/recommendation.service";
import { useAuth } from "../../context/AuthContext";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

interface CardProps {
  products: Product[];
  title?: string;
  onProductClick?: (product: Product) => void;
}

const Card: React.FC<CardProps> = ({ products, title, onProductClick }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - containerRef.current.offsetLeft);
    setScrollLeft(containerRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    containerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const handleScroll = (direction: "left" | "right") => {
    if (containerRef.current) {
      const scrollAmount = 400;
      const currentScroll = containerRef.current.scrollLeft;
      const targetScroll =
        direction === "left"
          ? currentScroll - scrollAmount
          : currentScroll + scrollAmount;

      containerRef.current.scrollTo({
        left: targetScroll,
        behavior: "smooth",
      });
    }
  };

  const handleCardClick = async (product: Product) => {
    if (isAuthenticated) {
      try {
        await recommendationService.trackInteraction(product.id);
      } catch (error) {
        console.warn("Failed to track interaction:", error);
      }
    }
    if (onProductClick) {
      onProductClick(product);
    }
    navigate(`/product/${product.category.slug_name}/${product.slug}`);
  };

  const formatPrice = (price: string): string => {
    return recommendationService.formatPrice(price);
  };

  const getPrimaryImage = (product: Product): string => {
    return recommendationService.getPrimaryImage(product);
  };

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div className={styles.sectionContainer}>
      {title && <h2 className={styles.sectionTitle}>{title}</h2>}

      <div className={styles.sliderWrapper}>
        <button
          className={`${styles.arrow} ${styles.left}`}
          onClick={() => handleScroll("left")}
          aria-label="Previous products"
        >
          <FaChevronLeft />
        </button>

        <div
          className={styles.cardsContainer}
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          style={{ cursor: isDragging ? "grabbing" : "grab" }}
        >
          {products.map((product) => (
            <div
              key={product.id}
              className={styles.card}
              onClick={() => handleCardClick(product)}
              style={{ cursor: "pointer" }}
            >
              <div className={styles.imageContainer}>
                <img
                  src={getPrimaryImage(product)}
                  alt={product.name}
                  className={styles.cardImage}
                />
              </div>
              <div className={styles.cardContent}>
                <h3 className={styles.cardTitle}>{product.name}</h3>
                <p className={styles.cardDescription}>
                  {product.description.length > 60
                    ? product.description.substring(0, 60) + "..."
                    : product.description}
                </p>
                <div className={styles.priceContainer}>
                  <span className={styles.price}>
                    {formatPrice(product.price)}
                  </span>
                  {product.average_rating && (
                    <span
                      style={{
                        fontSize: "14px",
                        color: "#f39c12",
                        fontWeight: "bold",
                      }}
                    >
                      ⭐ {product.average_rating.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          className={`${styles.arrow} ${styles.right}`}
          onClick={() => handleScroll("right")}
          aria-label="Next products"
        >
          <FaChevronRight />
        </button>
      </div>
    </div>
  );
};

export default Card;
