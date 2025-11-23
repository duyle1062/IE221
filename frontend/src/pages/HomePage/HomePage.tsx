import React, { useState, useEffect } from "react";
import Header from "../../components/Header/Header";
import Banner from "../../components/Banner/Banner";
import Categories from "../../components/Categories/Categories";
import Card from "../../components/Card/Card";
import Footer from "../../components/Footer/Footer";
import { useAuth } from "../../context/AuthContext";
import recommendationService from "../../services/recommendation.service";
import { Product } from "../../types/product.types";

export default function HomePage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Don't fetch until auth state is determined
    if (authLoading) return;

    const fetchProducts = async () => {
      setLoading(true);
      setError(null);

      try {
        if (isAuthenticated) {
          // Fetch both personalized recommendations AND popular products for authenticated users
          try {
            const [recommendations, popular] = await Promise.all([
              recommendationService.getRecommendations(10),
              recommendationService.getPopularProducts({ limit: 8 }),
            ]);
            setRecommendedProducts(recommendations);
            setPopularProducts(popular);
          } catch (err) {
            console.warn(
              "Failed to fetch recommendations, falling back to popular products only:",
              err
            );
            // Fallback: only show popular products if recommendations fail
            const popular = await recommendationService.getPopularProducts({
              limit: 10,
            });
            setRecommendedProducts([]);
            setPopularProducts(popular);
          }
        } else {
          // Fetch only popular products for non-authenticated users
          const popular = await recommendationService.getPopularProducts({
            limit: 8,
          });
          setRecommendedProducts([]);
          setPopularProducts(popular);
        }
      } catch (err: any) {
        console.error("Failed to fetch products:", err);
        setError("Không thể tải sản phẩm. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [isAuthenticated, authLoading]);

  return (
    <>
      <Header />
      <Banner />
      <Categories />

      {loading && (
        <div
          style={{
            textAlign: "center",
            padding: "50px",
            fontSize: "18px",
            color: "#666",
          }}
        >
          Đang tải sản phẩm...
        </div>
      )}

      {error && (
        <div
          style={{
            textAlign: "center",
            padding: "50px",
            fontSize: "18px",
            color: "#e74c3c",
          }}
        >
          {error}
        </div>
      )}

      {/* Recommendations Section (Only for authenticated users) */}
      {!loading &&
        !error &&
        isAuthenticated &&
        recommendedProducts.length > 0 && (
          <Card
            products={recommendedProducts}
            title="Recommendations for you"
          />
        )}

      {/* Popular Dishes Section (For all users, or authenticated users see it below recommendations) */}
      {!loading && !error && popularProducts.length > 0 && (
        <Card
          products={popularProducts}
          title={isAuthenticated ? "Popular Dishes" : "Popular Dishes"}
        />
      )}

      {/* No products message */}
      {!loading &&
        !error &&
        popularProducts.length === 0 &&
        recommendedProducts.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "50px",
              fontSize: "18px",
              color: "#666",
            }}
          >
            There are no products to display.
          </div>
        )}

      <Footer />
    </>
  );
}
