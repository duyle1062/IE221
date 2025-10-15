import React from "react";
import styles from "./CategoryPage.module.css";
import Header from "../../components/Header/Header";
import Categories from "../../components/Categories/Categories";

export default function ChickenPage() {
  return (
    <>
      <Header />
      <div className={styles.wrapper}>
        <Categories />

        {/* Grid */}
        <div className={styles.productGrid}>
          <div className={styles.productCard}>
            <img src="" alt="Pizza 1" className={styles.productImage} />
            <h3 className={styles.productName}>Pepperoni Pizza</h3>
            <p className={styles.productPrice}>120,000₫</p>
          </div>

          <div className={styles.productCard}>
            <img src="" alt="Pizza 2" className={styles.productImage} />
            <h3 className={styles.productName}>Hawaiian Pizza</h3>
            <p className={styles.productPrice}>115,000₫</p>
          </div>

          <div className={styles.productCard}>
            <img src="" alt="Pizza 3" className={styles.productImage} />
            <h3 className={styles.productName}>Seafood Pizza</h3>
            <p className={styles.productPrice}>130,000₫</p>
          </div>
        </div>
      </div>
    </>
  );
}
