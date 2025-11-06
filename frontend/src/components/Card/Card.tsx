import React, { useRef, useState } from 'react';
import styles from './Card.module.css';

interface CardItem {
  imageUrl: string;
  title: string;
  description: string;
  price: string;
}

const Card: React.FC = () => {
  const cardData: CardItem[] = [
    {
      imageUrl: 'https://via.placeholder.com/280x180?text=Pizza+1',
      title: 'Pizza Hải Sản Xốt Pesto',
      description: 'Chỉ từ',
      price: '149.000 đ',
    },
    {
      imageUrl: 'https://via.placeholder.com/280x180?text=Pizza+2',
      title: 'Pizza Phô Mai Cao',
      description: 'Chỉ từ',
      price: '119.000 đ',
    },
    {
      imageUrl: 'https://via.placeholder.com/280x180?text=Pizza+3',
      title: 'Pizza Rau Củ Nướng',
      description: 'Chỉ từ',
      price: '99.000 đ',
    },
    {
      imageUrl: 'https://via.placeholder.com/280x180?text=Pizza+4',
      title: 'Pizza Thịt Nướng BBQ',
      description: 'Chỉ từ',
      price: '129.000 đ',
    },
    {
      imageUrl: 'https://via.placeholder.com/280x180?text=Pizza+5',
      title: 'Pizza Gà Cay',
      description: 'Chỉ từ',
      price: '139.000 đ',
    },
    {
      imageUrl: 'https://via.placeholder.com/280x180?text=Pizza+6',
      title: 'Pizza Bò Nướng Tiêu Đen',
      description: 'Chỉ từ',
      price: '159.000 đ',
    },
    {
      imageUrl: 'https://via.placeholder.com/280x180?text=Pizza+7',
      title: 'Pizza Hải Sản Xốt Pesto',
      description: 'Chỉ từ',
      price: '149.000 đ',
    },
    {
      imageUrl: 'https://via.placeholder.com/280x180?text=Pizza+8',
      title: 'Pizza Phô Mai Cao',
      description: 'Chỉ từ',
      price: '119.000 đ',
    },
  ];

  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - containerRef.current.offsetLeft);
    setScrollLeft(containerRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Tăng tốc độ kéo
    containerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const handleAddToCart = (title: string) => {
    console.log('Added to cart: ' + title);
  };

  return (
    <div
      className={styles.cardsContainer}
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUpOrLeave}
      onMouseLeave={handleMouseUpOrLeave}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      {cardData.map((item, index) => (
        <div key={index} className={styles.card}>
          <div className={styles.imageContainer}>
            <img src={item.imageUrl} alt={item.title} className={styles.cardImage} />
          </div>
          <div className={styles.cardContent}>
            <h3 className={styles.cardTitle}>{item.title}</h3>
            <p className={styles.cardDescription}>{item.description}</p>
            <div className={styles.priceContainer}>
              <span className={styles.price}>{item.price}</span>
              <button
                className={styles.addButton}
                onClick={() => handleAddToCart(item.title)}
              >
                +
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Card;