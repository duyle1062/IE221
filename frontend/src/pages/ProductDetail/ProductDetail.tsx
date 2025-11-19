import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import StarRating from "../../components/StarRating/StarRating";
import cartService from "../../services/cart.service";
import productService from "../../services/product.service";
import { useAuth } from "../../context/AuthContext";
import { ProductDetailResponse } from "../../types/product.types";
import styles from "./ProductDetail.module.css";

const ProductDetailPage: React.FC = () => {
  const { categorySlug, productSlug } = useParams<{ categorySlug: string; productSlug: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [product, setProduct] = useState<ProductDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"description" | "reviews">("description");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  useEffect(() => {
    const abortController = new AbortController();

    const fetchProduct = async () => {
      if (!categorySlug || !productSlug) return;
      
      setLoading(true);
      setError(null);
      setProduct(null); // Reset product
      
      try {
        const data = await productService.getProductDetail(categorySlug, productSlug, abortController.signal);
        setProduct(data);
        // Set initial selected image
        if (data.images && data.images.length > 0) {
          const primaryImage = data.images.find(img => img.is_primary);
          setSelectedImage(primaryImage?.image_url ?? data.images?.[0]?.image_url ?? "");
        }
      } catch (err: any) {
        // Ignore abort errors
        if (err.name === 'CanceledError' || err.name === 'AbortError') {
          return;
        }
        console.error("Failed to fetch product:", err);
        const errorMessage = err?.response?.data?.detail || 
                           err?.detail || 
                           err?.message || 
                           "Không thể tải thông tin sản phẩm. Vui lòng thử lại!";
        setError(errorMessage);
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchProduct();

    // Cleanup function to abort request on unmount
    return () => {
      abortController.abort();
    };
  }, [categorySlug, productSlug]);

  const handleAddToCart = async () => {
    if (!product) return;
    
    // Check if user is authenticated
    if (!isAuthenticated) {
      alert("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!");
      navigate("/login");
      return;
    }

    setIsAddingToCart(true);
    try {
      await cartService.addToCart({
        product_id: product.id,
        quantity: quantity,
      });
      alert(`Đã thêm ${quantity} ${product.name} vào giỏ hàng!`);
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
      {loading ? (
        <div className={styles.loadingContainer}>
          <p>Đang tải thông tin sản phẩm...</p>
        </div>
      ) : error ? (
        <div className={styles.errorContainer}>
          <p>{error}</p>
          <button onClick={() => navigate(-1)} className={styles.backButton}>
            Quay lại
          </button>
        </div>
      ) : product ? (
        <div className={styles.container}>
          <div className={styles.productLayout}>
            <div className={styles.imageSection}>
              <div className={styles.mainImage}>
                <img src={selectedImage} alt={product.name} />
              </div>
              {product.images && product.images.length > 0 && (
                <div className={styles.thumbnailList}>
                  {product.images.map((img, idx) => (
                    <img
                      key={img.id}
                      src={img.image_url}
                      alt={`${product.name} ${idx + 1}`}
                      className={selectedImage === img.image_url ? styles.activeThumb : ""}
                      onClick={() => setSelectedImage(img.image_url)}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className={styles.infoSection}>
              <h1 className={styles.productName}>{product.name}</h1>

              <div className={styles.price}>
                {productService.formatPrice(product.price)}
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
                <div className={styles.ratingDisplay}>
                  <StarRating 
                    rating={product.average_rating} 
                    size="medium" 
                    showText={true}
                  />
                </div>
              </div>

              <button
                className={styles.addToCartBtn}
                onClick={handleAddToCart}
                disabled={isAddingToCart || !product.available}
              >
                {!product.available 
                  ? "Sản phẩm tạm hết hàng"
                  : isAddingToCart 
                    ? "Đang thêm..." 
                    : "Thêm vào giỏ hàng"}
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
                  Đánh giá ({product.ratings?.length || 0})
                </button>
              </div>

              <div className={styles.tabContent}>
                {activeTab === "description" ? (
                  <p className={styles.description}>{product.description}</p>
                ) : (
                  <div>
                    <div className={styles.reviewsList}>
                      {product.ratings && product.ratings.length > 0 ? (
                        product.ratings.map((review) => (
                          <div key={review.id} className={styles.reviewItem}>
                            <div className={styles.reviewHeader}>
                              <strong>
                                {review.user.first_name} {review.user.last_name}
                              </strong>
                              <StarRating 
                                rating={review.rating} 
                                size="small" 
                                showText={false}
                              />
                            </div>
                            <p className={styles.reviewComment}>{review.comment}</p>
                            <span className={styles.reviewDate}>
                              {new Date(review.created_at).toLocaleDateString("vi-VN")}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className={styles.noReviews}>Chưa có đánh giá nào.</p>
                      )}
                    </div>

                    <div className={styles.addReview}>
                      <h3>Viết đánh giá của bạn</h3>
                      <div className={styles.ratingInput}>
                        <span>Đánh giá: </span>
                        <StarRating 
                          rating={rating} 
                          size="large"
                          showText={false}
                          interactive={true}
                          onRatingChange={setRating}
                        />
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
      ) : null}
      <Footer />
    </>
  );
};

export default ProductDetailPage;
