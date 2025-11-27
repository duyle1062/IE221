import React from "react";
import styles from "./StarRating.module.css";

interface StarRatingProps {
  rating: number | null;
  maxStars?: number;
  showText?: boolean;
  size?: "small" | "medium" | "large";
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxStars = 5,
  showText = true,
  size = "medium",
  interactive = false,
  onRatingChange,
}) => {
  const displayRating = rating || 0;
  const fullStars = Math.floor(displayRating);
  const hasHalfStar = displayRating % 1 >= 0.5;

  const handleStarClick = (starIndex: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(starIndex + 1);
    }
  };

  return (
    <div className={`${styles.starRating} ${styles[size]}`}>
      <div className={styles.stars}>
        {[...Array(maxStars)].map((_, index) => {
          let starClass = styles.starEmpty;
          
          if (index < fullStars) {
            starClass = styles.starFilled;
          } else if (index === fullStars && hasHalfStar) {
            starClass = styles.starHalf;
          }

          return (
            <span
              key={index}
              className={`${starClass} ${interactive ? styles.interactive : ""}`}
              onClick={() => handleStarClick(index)}
              style={{ cursor: interactive ? "pointer" : "default" }}
            >
              ★
            </span>
          );
        })}
      </div>
      {showText && (
        <span className={styles.ratingText}>
          {displayRating > 0 ? displayRating.toFixed(1) : "No reviews yet"}
        </span>
      )}
    </div>
  );
};

export default StarRating;
