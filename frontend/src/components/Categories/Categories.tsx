import React from "react";
import styles from "./Categories.module.css";
import { FaPizzaSlice, FaDrumstickBite, FaLeaf } from "react-icons/fa";
import { MdLocalDrink } from "react-icons/md";
import { GiChickenOven } from "react-icons/gi";
import { LuSalad } from "react-icons/lu";
import { useLocation, useNavigate } from "react-router-dom";

interface CategoryItem {
  icon: React.ReactElement;
  label: string;
  path: string;
}

const categories: CategoryItem[] = [
  { icon: <FaPizzaSlice />, label: "Pizza", path: "/category/pizza" },
  { icon: <GiChickenOven />, label: "Chicken", path: "/category/chicken" },
  { icon: <LuSalad />, label: "Salad", path: "/category/salad" },
  { icon: <MdLocalDrink />, label: "Drink", path: "/category/drink" },
  { icon: <FaLeaf />, label: "Vegetarian", path: "/category/vegetarian" },
  { icon: <FaDrumstickBite />, label: "Combo", path: "/category/combo" },
];

export default function Categories() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      {categories.map((item, index) => {
        const isActive = location.pathname === item.path;
        return (
          <div
            key={index}
            className={`${styles.category} ${isActive ? styles.active : ""}`}
            onClick={() => navigate(item.path)}
          >
            <div className={styles.icon}>{item.icon}</div>
            <span className={styles.label}>{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}
