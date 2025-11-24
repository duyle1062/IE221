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
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Don't fetch until auth state is determined
    if (authLoading) return;

    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        if (isAuthenticated) {
          // Authenticated user: Fetch Recommendations + Best Sellers
          const [recommended, bestSelling] = await Promise.all([
            recommendationService.getRecommendations(10),
            recommendationService.getBestSellers({ limit: 10 }),
          ]);
          setRecommendedProducts(recommended);
          setBestSellers(bestSelling);
        } else {
          // Non-authenticated user: Fetch Popular + Best Sellers
          const [popular, bestSelling] = await Promise.all([
            recommendationService.getPopularProducts({ limit: 10 }),
            recommendationService.getBestSellers({ limit: 10 }),
          ]);
          setPopularProducts(popular);
          setBestSellers(bestSelling);
        }
      } catch (err) {
        console.error("Error fetching products:", err);
        setError("Failed to load products. Please try again later.");
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
          Loading products...
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

      {/* Recommended for authenticated users */}
      {!loading &&
        !error &&
        isAuthenticated &&
        recommendedProducts.length > 0 && (
          <Card
            products={recommendedProducts}
            title="Recommended for You"
          />
        )}

      {/* Popular products for non-authenticated users */}
      {!loading &&
        !error &&
        !isAuthenticated &&
        popularProducts.length > 0 && (
          <Card
            products={popularProducts}
            title="Popular Dishes"
          />
        )}

      {/* Best Sellers for all users */}
      {!loading && !error && bestSellers.length > 0 && (
        <Card
          products={bestSellers}
          title="Best Sellers"
        />
      )}

      {/* Empty state */}
      {!loading &&
        !error &&
        bestSellers.length === 0 &&
        recommendedProducts.length === 0 &&
        popularProducts.length === 0 && (
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
