import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./Category.module.css";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import Categories from "../../components/Categories/Categories";
import StarRating from "../../components/StarRating/StarRating";
import productService from "../../services/product.service";
import { Product } from "../../types/product.types";

export default function Category() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const abortController = new AbortController();

    const fetchProducts = async () => {
      if (!slug) return;

      setLoading(true);
      setError(null);
      setProducts([]); // Reset products array

      try {
        const products = await productService.getProductsByCategory(
          slug,
          abortController.signal
        );
        setProducts(products || []);
      } catch (err: any) {
        // Ignore abort errors
        if (err.name === "CanceledError" || err.name === "AbortError") {
          return;
        }
        console.error("Failed to fetch products:", err);
        const errorMessage =
          err?.response?.data?.detail ||
          err?.detail ||
          err?.message ||
          "Unable to load products. Please try again!";
        setError(errorMessage);
        setProducts([]); // Ensure products is empty array on error
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchProducts();

    // Cleanup function to abort request on unmount
    return () => {
      abortController.abort();
    };
  }, [slug]);

  const handleProductClick = (product: Product) => {
    navigate(`/product/${slug}/${product.slug}`);
  };

  return (
    <>
      <Header />
      <div className={styles.wrapper}>
        <Categories />

        {loading ? (
          <div className={styles.loadingContainer}>
            <p>Loading products...</p>
          </div>
        ) : error ? (
          <div className={styles.errorContainer}>
            <p>{error}</p>
          </div>
        ) : (
          <div className={styles.productGrid}>
            {products && products.length > 0 ? (
              products.map((product) => (
                <div
                  key={product.id}
                  className={styles.productCard}
                  onClick={() => handleProductClick(product)}
                >
                  <img
                    src={productService.getPrimaryImage(product)}
                    alt={product.name}
                    className={styles.productImage}
                  />
                  <h3 className={styles.productName}>{product.name}</h3>
                  <p className={styles.productPrice}>
                    {productService.formatPrice(product.price)}
                  </p>
                  <div className={styles.ratingContainer}>
                    <StarRating
                      rating={product.average_rating}
                      size="small"
                      showText={true}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className={styles.emptyMessage}>
                There are no products in this category
              </p>
            )}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
