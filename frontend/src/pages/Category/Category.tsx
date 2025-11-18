import { useMemo } from "react";
import { useParams } from "react-router-dom";
import styles from "./Category.module.css";
import Header from "../../components/Header/Header";
import Categories from "../../components/Categories/Categories";

interface Product {
  id: number;
  name: string;
  price: string;
  image: string;
}

const MOCK_DATA: Record<string, Product[]> = {
  pizza: [
    {
      id: 1,
      name: "Pepperoni Pizza",
      price: "120.000₫",
      image: "",
    },
    {
      id: 2,
      name: "Hawaiian Pizza",
      price: "115.000₫",
      image: "",
    },
    {
      id: 3,
      name: "Seafood Pizza",
      price: "130.000₫",
      image: "",
    },
  ],
  chicken: [
    { id: 4, name: "Crispy Fried Chicken", price: "35.000₫", image: "" },
    { id: 5, name: "Spicy Sauce Chicken", price: "40.000₫", image: "" },
  ],
  salad: [
    { id: 6, name: "Tuna Salad", price: "55.000₫", image: "" },
    { id: 7, name: "Mixed Salad", price: "45.000₫", image: "" },
  ],
  drink: [
    { id: 8, name: "Coca Cola", price: "15.000₫", image: "" },
    { id: 9, name: "Pepsi", price: "15.000₫", image: "" },
  ],
  vegetarian: [{ id: 10, name: "Veggie Burger", price: "60.000₫", image: "" }],
  combo: [
    { id: 11, name: "Solo Combo", price: "89.000₫", image: "" },
    { id: 12, name: "Family Combo", price: "199.000₫", image: "" },
  ],
};

export default function Category() {
  const { slug } = useParams<{ slug: string }>();

  const products = useMemo(() => {
    if (slug && MOCK_DATA[slug]) {
      return MOCK_DATA[slug];
    }
    return [];
  }, [slug]);

  return (
    <>
      <Header />
      <div className={styles.wrapper}>
        <Categories />

        <div className={styles.productGrid}>
          {products.length > 0 ? (
            products.map((product) => (
              <div key={product.id} className={styles.productCard}>
                <img
                  src={
                    product.image ||
                    "https://via.placeholder.com/180?text=No+Image"
                  }
                  alt={product.name}
                  className={styles.productImage}
                />
                <h3 className={styles.productName}>{product.name}</h3>
                <p className={styles.productPrice}>{product.price}</p>
              </div>
            ))
          ) : (
            <p
              style={{
                gridColumn: "1 / -1",
                textAlign: "center",
                color: "#666",
              }}
            >
              No products available in this category.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
