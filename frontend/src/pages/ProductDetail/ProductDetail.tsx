import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import StarRating from "../../components/StarRating/StarRating";
import Card from "../../components/Card/Card";
import cartService from "../../services/cart.service";
import productService from "../../services/product.service";
import ratingService from "../../services/rating.service";
import recommendationService from "../../services/recommendation.service";
import { addGroupOrderItem } from "../../services/groupOrder.service";
import { useAuth } from "../../context/AuthContext";
import {
  ProductDetailResponse,
  RatingListResponse,
  Product,
} from "../../types/product.types";
import styles from "./ProductDetail.module.css";
import { FaUsers } from "react-icons/fa";

const ProductDetailPage: React.FC = () => {
  // Add to group order using real API
  const handleAddToGroupOrder = async () => {
    const activeGroupOrderId = localStorage.getItem("activeGroupOrderId");

    if (!activeGroupOrderId) {
      // No active group, navigate to group order page
      toast.info("Please create or join a group order first");
      navigate("/group-order");
      return;
    }

    if (!product?.id) {
      toast.error("Product information not available");
      return;
    }

    try {
      setIsAddingToGroupOrder(true);
      await addGroupOrderItem(parseInt(activeGroupOrderId), {
        product_id: product.id,
        quantity: quantity,
      });
      toast.success(`Added ${quantity} ${product.name} to group order!`);
      setQuantity(1);
    } catch (error: any) {
      toast.error(error.message || "Failed to add item to group order");
    } finally {
      setIsAddingToGroupOrder(false);
    }
  };
  const { categorySlug, productSlug } = useParams<{
    categorySlug: string;
    productSlug: string;
  }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [product, setProduct] = useState<ProductDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"description" | "reviews">(
    "description"
  );
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isAddingToGroupOrder, setIsAddingToGroupOrder] = useState(false);

  // Rating states
  const [ratings, setRatings] = useState<RatingListResponse | null>(null);
  const [ratingsLoading, setRatingsLoading] = useState(false);
  const [ratingsError, setRatingsError] = useState<string | null>(null);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const pageSize = 5;

  // Similar products state
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [similarLoading, setSimilarLoading] = useState(false);

  // Fetch product details
  useEffect(() => {
    const abortController = new AbortController();

    const fetchProduct = async () => {
      if (!categorySlug || !productSlug) return;

      setLoading(true);
      setError(null);
      setProduct(null); // Reset product

      try {
        const data = await productService.getProductDetail(
          categorySlug,
          productSlug,
          abortController.signal
        );
        setProduct(data);
        // Set initial selected image
        if (data.images && data.images.length > 0) {
          const primaryImage = data.images.find((img) => img.is_primary);
          setSelectedImage(
            primaryImage?.image_url ?? data.images?.[0]?.image_url ?? ""
          );
        }
      } catch (err: any) {
        // Ignore abort errors
        if (err.name === "CanceledError" || err.name === "AbortError") {
          return;
        }
        console.error("Failed to fetch product:", err);
        const errorMessage =
          err?.response?.data?.detail ||
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

  // Fetch similar products when product is loaded
  useEffect(() => {
    const fetchSimilarProducts = async () => {
      if (!product?.id) return;

      setSimilarLoading(true);
      try {
        const similar = await recommendationService.getSimilarProducts(
          product.id,
          { limit: 6 }
        );
        setSimilarProducts(similar);
      } catch (err) {
        console.error("Failed to fetch similar products:", err);
        // Fail silently - similar products are optional
      } finally {
        setSimilarLoading(false);
      }
    };

    fetchSimilarProducts();
  }, [product?.id]);

  // Fetch ratings when product is loaded or page changes
  useEffect(() => {
    const abortController = new AbortController();

    const fetchRatings = async () => {
      if (!product?.id) return;

      setRatingsLoading(true);
      setRatingsError(null);

      try {
        const data = await ratingService.getRatings(
          product.id,
          currentPage,
          pageSize,
          abortController.signal
        );
        setRatings(data);
      } catch (err: any) {
        // Ignore abort errors
        if (err.name === "CanceledError" || err.name === "AbortError") {
          return;
        }
        console.error("Failed to fetch ratings:", err);
        const errorMessage =
          err?.response?.data?.detail ||
          err?.detail ||
          err?.message ||
          "Không thể tải đánh giá.";
        setRatingsError(errorMessage);
      } finally {
        if (!abortController.signal.aborted) {
          setRatingsLoading(false);
        }
      }
    };

    fetchRatings();

    return () => {
      abortController.abort();
    };
  }, [product?.id, currentPage, pageSize]);

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

  const handleSubmitReview = async () => {
    if (!product) return;

    // Reset error state
    setSubmitError(null);

    // Check if user is authenticated
    if (!isAuthenticated) {
      setSubmitError("Vui lòng đăng nhập để đánh giá sản phẩm!");
      return;
    }

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      setSubmitError("Vui lòng chọn đánh giá từ 1 đến 5 sao!");
      return;
    }

    // Validate comment
    if (!comment.trim()) {
      setSubmitError("Vui lòng nhập nội dung đánh giá của bạn!");
      return;
    }

    setIsSubmittingRating(true);

    try {
      await ratingService.createRating(product.id, {
        rating,
        comment: comment.trim(),
      });

      alert("Thanks for your review!");

      // Reset form
      setRating(0);
      setComment("");
      setSubmitError(null);

      // Refresh ratings list
      setCurrentPage(1); // Go back to first page
      const updatedRatings = await ratingService.getRatings(
        product.id,
        1,
        pageSize
      );
      setRatings(updatedRatings);

      // Refresh product to update average rating
      if (categorySlug && productSlug) {
        const updatedProduct = await productService.getProductDetail(
          categorySlug,
          productSlug
        );
        setProduct(updatedProduct);
      }
    } catch (error: any) {
      console.error("Submit rating failed:", error);
      console.log("Error response:", error?.response);

      // Extract error message from response
      const responseData = error?.response?.data;
      let errorMessage = "Unable to submit review. Please try again!";

      if (responseData) {
        const errorText =
          responseData.non_field_errors?.[0] ||
          responseData.detail ||
          responseData[0] ||
          (typeof responseData === "string" ? responseData : null);

        if (errorText) {
          // Check for "already rated" pattern
          if (errorText.toLowerCase().includes("already rated")) {
            errorMessage =
              "You have already rated this product. Only one rating per user!";
          } else {
            errorMessage = errorText;
          }
        }
      }

      setSubmitError(errorMessage);
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);

    // Scroll to top of reviews section when changing page
    const reviewsSection = document.querySelector(`.${styles.reviewsList}`);
    if (reviewsSection) {
      reviewsSection.scrollTo({ top: 0, behavior: "smooth" });
    }
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
          <p>Loading product information...</p>
        </div>
      ) : error ? (
        <div className={styles.errorContainer}>
          <p>{error}</p>
          <button onClick={() => navigate(-1)} className={styles.backButton}>
            Back
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
                      className={
                        selectedImage === img.image_url
                          ? styles.activeThumb
                          : ""
                      }
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

              <button
                className={styles.groupOrderBtn}
                onClick={handleAddToGroupOrder}
                disabled={isAddingToGroupOrder || !product.available}
              >
                {isAddingToGroupOrder ? (
                  "Adding..."
                ) : (
                  <>
                    <FaUsers /> Add To Group Order
                  </>
                )}
              </button>

              <div className={styles.tabs}>
                <button
                  className={
                    activeTab === "description" ? styles.activeTab : ""
                  }
                  onClick={() => setActiveTab("description")}
                >
                  Mô tả
                </button>
                <button
                  className={activeTab === "reviews" ? styles.activeTab : ""}
                  onClick={() => setActiveTab("reviews")}
                >
                  Đánh giá ({ratings?.count || 0})
                </button>
              </div>

              <div className={styles.tabContent}>
                {activeTab === "description" ? (
                  <p className={styles.description}>{product.description}</p>
                ) : (
                  <div>
                    <div className={styles.reviewsList}>
                      {ratingsLoading ? (
                        <p>Loading reviews...</p>
                      ) : ratingsError ? (
                        <p className={styles.errorText}>{ratingsError}</p>
                      ) : ratings && ratings.results.length > 0 ? (
                        <>
                          {ratings.results.map((review) => (
                            <div key={review.id} className={styles.reviewItem}>
                              <div className={styles.reviewHeader}>
                                <strong>
                                  {review.user.first_name}{" "}
                                  {review.user.last_name}
                                </strong>
                                <StarRating
                                  rating={review.rating}
                                  size="small"
                                  showText={false}
                                />
                              </div>
                              <p className={styles.reviewComment}>
                                {review.comment}
                              </p>
                              <span className={styles.reviewDate}>
                                {new Date(review.created_at).toLocaleDateString(
                                  "vi-VN"
                                )}
                              </span>
                            </div>
                          ))}

                          {/* Pagination controls */}
                          {ratings.count > pageSize && (
                            <div className={styles.pagination}>
                              <button
                                onClick={() =>
                                  handlePageChange(currentPage - 1)
                                }
                                disabled={!ratings.previous || ratingsLoading}
                                className={styles.paginationBtn}
                              >
                                ← Trang trước
                              </button>
                              <span className={styles.pageInfo}>
                                Trang {currentPage} /{" "}
                                {Math.ceil(ratings.count / pageSize)}
                                <span
                                  style={{
                                    fontSize: "12px",
                                    color: "#999",
                                    display: "block",
                                    marginTop: "4px",
                                  }}
                                >
                                  ({(currentPage - 1) * pageSize + 1}-
                                  {Math.min(
                                    currentPage * pageSize,
                                    ratings.count
                                  )}{" "}
                                  / {ratings.count} đánh giá)
                                </span>
                              </span>
                              <button
                                onClick={() =>
                                  handlePageChange(currentPage + 1)
                                }
                                disabled={!ratings.next || ratingsLoading}
                                className={styles.paginationBtn}
                              >
                                Trang sau →
                              </button>
                            </div>
                          )}
                        </>
                      ) : (
                        <p className={styles.noReviews}>
                          Chưa có đánh giá nào.
                        </p>
                      )}
                    </div>

                    <div className={styles.addReview}>
                      <h3>Viết đánh giá của bạn</h3>
                      {isAuthenticated ? (
                        <>
                          {submitError && (
                            <div className={styles.submitError}>
                              {submitError}
                            </div>
                          )}
                          <div className={styles.ratingInput}>
                            <span>Đánh giá: </span>
                            <StarRating
                              rating={rating}
                              size="large"
                              showText={false}
                              interactive={true}
                              onRatingChange={(newRating) => {
                                setRating(newRating);
                                setSubmitError(null); // Clear error when user interacts
                              }}
                            />
                          </div>
                          <textarea
                            placeholder="Nhập bình luận của bạn..."
                            value={comment}
                            onChange={(e) => {
                              setComment(e.target.value);
                              setSubmitError(null); // Clear error when user types
                            }}
                            className={styles.commentInput}
                            disabled={isSubmittingRating}
                          />
                          <button
                            onClick={handleSubmitReview}
                            className={styles.submitReviewBtn}
                            disabled={isSubmittingRating}
                          >
                            {isSubmittingRating
                              ? "Đang gửi..."
                              : "Gửi đánh giá"}
                          </button>
                        </>
                      ) : (
                        <p className={styles.loginPrompt}>
                          Vui lòng <a href="/login">đăng nhập</a> để đánh giá
                          sản phẩm.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Similar Products Section */}
      {!loading && product && similarProducts.length > 0 && (
        <div style={{ padding: "20px 0", backgroundColor: "#f8f9fa" }}>
          <Card products={similarProducts} title="Similar Dishes" />
        </div>
      )}

      <Footer />
    </>
  );
};

export default ProductDetailPage;
