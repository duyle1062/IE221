import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Product } from "../../types/product.types";
import productService from "../../services/product.service";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import styles from "./SearchResults.module.css";

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get("q") || "";
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!query.trim()) {
        setProducts([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const results = await productService.searchProducts(query, {
          is_active: true,
        });
        setProducts(results);
      } catch (err: any) {
        console.error("Search error:", err);
        setError("Failed to search products. Please try again!");
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [query]);

  const handleProductClick = (product: Product) => {
    navigate(`/product/${product.category.slug_name}/${product.slug}`);
  };

  return (
    <>
      <Header />
      <div className={styles.container}>
        <div className={styles.content}>
          <h1 className={styles.title}>Search Results for "{query}"</h1>

          {loading ? (
            <div className={styles.loading}>
              <p>Searching...</p>
            </div>
          ) : error ? (
            <div className={styles.error}>
              <p>{error}</p>
            </div>
          ) : products.length > 0 ? (
            <>
              <p className={styles.resultCount}>
                Found {products.length}{" "}
                {products.length === 1 ? "product" : "products"}
              </p>
              <div className={styles.productsGrid}>
                {products.map((product) => (
                  <div
                    key={product.id}
                    className={styles.productCard}
                    onClick={() => handleProductClick(product)}
                  >
                    <div className={styles.imageContainer}>
                      <img
                        src={
                          product.images && product.images.length > 0
                            ? product.images[0].image_url
                            : "/placeholder.png"
                        }
                        alt={product.name}
                        className={styles.productImage}
                      />
                      {!product.available && (
                        <div className={styles.unavailableBadge}>
                          Out of Stock
                        </div>
                      )}
                    </div>
                    <div className={styles.productInfo}>
                      <h3 className={styles.productName}>{product.name}</h3>
                      <p className={styles.productDescription}>
                        {product.description.length > 100
                          ? `${product.description.substring(0, 100)}...`
                          : product.description}
                      </p>
                      <div className={styles.productFooter}>
                        <p className={styles.productPrice}>
                          {new Intl.NumberFormat("en-US").format(
                            Math.round(parseFloat(product.price))
                          )}{" "}
                          VND
                        </p>
                        {product.average_rating && (
                          <div className={styles.rating}>
                            ⭐ {product.average_rating.toFixed(1)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className={styles.noResults}>
              <p>No products found for "{query}"</p>
              <p className={styles.suggestion}>
                Try different keywords or browse our categories
              </p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
