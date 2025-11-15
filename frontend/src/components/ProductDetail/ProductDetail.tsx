import React, { useState } from "react";
import styles from "./ProductDetail.module.css";

const mockProduct = {
  id: 1,
  name: "Pizza Hải Sản Xốt Pesto",
  price: 149000,
  description:
    "Pizza hảo hạng với hải sản tươi, sốt pesto thơm lừng, phô mai tan chảy. Đế bánh giòn, nhân đầy đặn.",
  image: "https://via.placeholder.com/600x500?text=Pizza+Detail",
  images: [
    "https://via.placeholder.com/600x500?text=Pizza+1",
    "https://via.placeholder.com/600x500?text=Pizza+2",
    "https://via.placeholder.com/600x500?text=Pizza+3",
  ],
};

const mockReviews = [
  {
    id: 1,
    userName: "Nguyễn Văn A",
    rating: 5,
    comment: "Pizza ngon, giao hàng nhanh, rất hài lòng!",
  },
  {
    id: 2,
    userName: "Trần Thị B",
    rating: 4,
    comment: "Ngon nhưng hơi ít topping so với giá.",
  },
  {
    id: 3,
    userName: "Lê Văn C",
    rating: 5,
    comment: "Yêu thích món này, sẽ đặt lại!",
  },
];

const ProductDetail: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState(mockProduct.images[0]);
  const [activeTab, setActiveTab] = useState<"description" | "reviews">(
    "description"
  );
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const handleAddToCart = () => {
    console.log("Added to cart:", mockProduct.name);
    alert(`${mockProduct.name} đã được thêm vào giỏ hàng!`);
  };

  const handleSubmitReview = () => {
    if (!rating || !comment.trim()) {
      alert("Vui lòng chọn đánh giá và nhập bình luận!");
      return;
    }
    console.log("New review:", { rating, comment });
    alert("Cảm ơn bạn đã đánh giá!");
    setRating(0);
    setComment("");
  };

  return (
    <div className={styles.container}>
      <div className={styles.productLayout}>
        <div className={styles.imageSection}>
          <div className={styles.mainImage}>
            <img src={selectedImage} alt={mockProduct.name} />
          </div>
          <div className={styles.thumbnailList}>
            {mockProduct.images.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={`Thumbnail ${idx + 1}`}
                className={selectedImage === img ? styles.activeThumb : ""}
                onClick={() => setSelectedImage(img)}
              />
            ))}
          </div>
        </div>

        <div className={styles.infoSection}>
          <h1 className={styles.productName}>{mockProduct.name}</h1>

          <div className={styles.price}>
            {mockProduct.price.toLocaleString("vi-VN")} đ
          </div>

          <button className={styles.addToCartBtn} onClick={handleAddToCart}>
            Thêm vào giỏ hàng
          </button>

          <div className={styles.tabs}>
            <button
              className={activeTab === "description" ? styles.activeTab : ""}
              onClick={() => setActiveTab("description")}
            >
              Mô tả
            </button>
            <button
              className={activeTab === "reviews" ? styles.activeTab : ""}
              onClick={() => setActiveTab("reviews")}
            >
              Đánh giá ({mockReviews.length})
            </button>
          </div>

          <div className={styles.tabContent}>
            {activeTab === "description" ? (
              <p className={styles.description}>{mockProduct.description}</p>
            ) : (
              <div>
                <div className={styles.reviewsList}>
                  {mockReviews.map((review) => (
                    <div key={review.id} className={styles.reviewItem}>
                      <div className={styles.reviewHeader}>
                        <strong>{review.userName}</strong>
                        <div className={styles.stars}>
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={
                                i < review.rating
                                  ? styles.starFilled
                                  : styles.starEmpty
                              }
                            >
                              ☆
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className={styles.reviewComment}>{review.comment}</p>
                    </div>
                  ))}
                </div>

                <div className={styles.addReview}>
                  <h3>Viết đánh giá của bạn</h3>
                  <div className={styles.ratingInput}>
                    <span>Đánh giá: </span>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={
                          star <= rating ? styles.starFilled : styles.starEmpty
                        }
                        onClick={() => setRating(star)}
                        style={{ cursor: "pointer", fontSize: "24px" }}
                      >
                        ☆
                      </span>
                    ))}
                  </div>
                  <textarea
                    placeholder="Nhập bình luận của bạn..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className={styles.commentInput}
                  />
                  <button
                    onClick={handleSubmitReview}
                    className={styles.submitReviewBtn}
                  >
                    Gửi đánh giá
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
