import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import cartService from "../../services/cart.service";
import { useAuth } from "../../context/AuthContext";
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

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [selectedImage, setSelectedImage] = useState(mockProduct.images[0]);
  const [activeTab, setActiveTab] = useState<"description" | "reviews">(
    "description"
  );
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const handleAddToCart = async () => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      alert("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!");
      navigate("/login");
      return;
    }

    setIsAddingToCart(true);
    try {
      await cartService.addToCart({
        product_id: mockProduct.id,
        quantity: quantity,
      });
      alert(`Đã thêm ${quantity} ${mockProduct.name} vào giỏ hàng!`);
      setQuantity(1); // Reset quantity after successful add
    } catch (error: any) {
      console.error("Add to cart failed:", error);
      const errorMessage =
        error?.detail ||
        error?.message ||
        "Không thể thêm sản phẩm vào giỏ hàng. Vui lòng thử lại!";
      alert(errorMessage);
    } finally {
      setIsAddingToCart(false);
    }
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

  const handleIncreaseQuantity = () => {
    setQuantity((prev) => prev + 1);
  };

  const handleDecreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  return (
    <>
      <Header />
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

            <div className={styles.quantitySection}>
              <label className={styles.quantityLabel}>Số lượng:</label>
              <div className={styles.quantityControls}>
                <button
                  className={styles.quantityBtn}
                  onClick={handleDecreaseQuantity}
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span className={styles.quantityValue}>{quantity}</span>
                <button
                  className={styles.quantityBtn}
                  onClick={handleIncreaseQuantity}
                >
                  +
                </button>
              </div>
            </div>

            <button
              className={styles.addToCartBtn}
              onClick={handleAddToCart}
              disabled={isAddingToCart}
            >
              {isAddingToCart ? "Đang thêm..." : "Thêm vào giỏ hàng"}
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
                            star <= rating
                              ? styles.starFilled
                              : styles.starEmpty
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
      <Footer />
    </>
  );
};

export default ProductDetailPage;
