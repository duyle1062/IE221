import { useState, useRef, useEffect } from "react";
import styles from "./Header.module.css";
import { FaShoppingCart, FaUser } from "react-icons/fa";
import { IoIosMenu } from "react-icons/io";
import { GoSearch } from "react-icons/go";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Product } from "../../types/product.types";
import productService from "../../services/product.service";
import logoImage from "../../assets/images/Logo_FastFood.png";

export default function Header() {
  const [openMenu, setOpenMenu] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showResults, setShowResults] = useState<boolean>(false);

  const avatarRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Menu", path: "/category/pizza" },
    { name: "Group Order", path: "/group-order" },
    { name: "Service", path: "/service" },
    { name: "About us", path: "/about-us" },
  ];

  const checkActive = (item: { name: string; path: string }) => {
    const currentPath = location.pathname;

    if (item.name === "Home" && currentPath === "/") {
      return true;
    }

    if (item.name === "Menu") {
      if (
        currentPath.startsWith("/category") ||
        currentPath.startsWith("/product")
      ) {
        return true;
      }
    }

    if (item.name === "Group Order" && currentPath.startsWith("/group-order")) {
      return true;
    }

    if (
      item.name !== "Home" &&
      item.name !== "Menu" &&
      currentPath === item.path
    ) {
      return true;
    }

    return false;
  };

  const handleLogout = async () => {
    try {
      await logout();
      setOpenMenu(false);
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      setOpenMenu(false);
      navigate("/login");
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setOpenMenu(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchQuery.trim().length > 0) {
        handleSearch(searchQuery);
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleSearch = async (query: string) => {
    try {
      setIsSearching(true);
      console.log("Starting search for:", query);
      const results = await productService.searchProducts(query, {
        is_active: true,
      });
      console.log("Search results received:", results);
      console.log("Number of results:", results?.length);
      setSearchResults(results);
      setShowResults(true);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
      setShowResults(true);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleProductClick = (product: Product) => {
    setShowResults(false);
    setSearchQuery("");
    setSearchResults([]);
    navigate(`/product/${product.category.slug_name}/${product.slug}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowResults(false);
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.logo}>
        <Link to="/">
          <img
            src={logoImage}
            alt="FastFood Logo"
            className={styles.logoImage}
          />
        </Link>
      </div>

      <div className={styles["search-bar"]} ref={searchRef}>
        <form
          onSubmit={handleSearchSubmit}
          style={{ display: "flex", width: "100%" }}
        >
          <GoSearch className={styles["search-icon"]} />
          <input
            type="text"
            placeholder="Search"
            className={styles["search-input"]}
            value={searchQuery}
            onChange={handleSearchInputChange}
          />
        </form>

        {showResults && (
          <div className={styles["search-results"]}>
            {isSearching ? (
              <div className={styles["search-loading"]}>Searching...</div>
            ) : searchResults.length > 0 ? (
              <>
                {searchResults.slice(0, 5).map((product) => (
                  <div
                    key={product.id}
                    className={styles["search-result-item"]}
                    onClick={() => handleProductClick(product)}
                  >
                    <img
                      src={
                        product.images && product.images.length > 0
                          ? product.images[0].image_url
                          : "/placeholder.png"
                      }
                      alt={product.name}
                      className={styles["result-image"]}
                    />
                    <div className={styles["result-info"]}>
                      <p className={styles["result-name"]}>{product.name}</p>
                      <p className={styles["result-price"]}>
                        {new Intl.NumberFormat("en-US").format(
                          Math.round(parseFloat(product.price))
                        )}{" "}
                        VND
                      </p>
                    </div>
                  </div>
                ))}
                {searchResults.length > 5 && (
                  <div
                    className={styles["search-view-all"]}
                    onClick={() => {
                      setShowResults(false);
                      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
                    }}
                  >
                    View all {searchResults.length} results →
                  </div>
                )}
              </>
            ) : (
              <div className={styles["search-no-results"]}>
                No products found for "{searchQuery}"
              </div>
            )}
          </div>
        )}
      </div>

      <ul className={styles["nav-links"]}>
        {navItems.map((item) => (
          <li key={item.name}>
            <Link
              to={item.path}
              className={checkActive(item) ? styles.active : ""}
            >
              {item.name}
            </Link>
          </li>
        ))}
      </ul>

      <div className={styles.actions}>
        {isAuthenticated && (
          <>
            <div className={styles.cart}>
              <Link to="/cart">
                <FaShoppingCart className={styles["cart-icon"]} />
              </Link>
            </div>
          </>
        )}

        <div
          ref={avatarRef}
          className={styles.avatar}
          onClick={() => setOpenMenu((prev) => !prev)}
        >
          <IoIosMenu className={styles["menu-icon"]} />
          <FaUser className={styles["user-icon"]} />

          {openMenu && (
            <div className={styles.dropdown}>
              {!isAuthenticated ? (
                <>
                  <Link to="/login" onClick={() => setOpenMenu(false)}>
                    <p>Sign In</p>
                  </Link>
                  <Link to="/register" onClick={() => setOpenMenu(false)}>
                    <p>Register</p>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/userprofile" onClick={() => setOpenMenu(false)}>
                    <p>User Profile</p>
                  </Link>
                  <Link to="/orders" onClick={() => setOpenMenu(false)}>
                    <p>Order Tracking</p>
                  </Link>
                  <p onClick={handleLogout} style={{ cursor: "pointer" }}>
                    Log out
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
