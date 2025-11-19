// Product related types

export interface ProductImage {
  id: number;
  image_url: string;
  is_primary: boolean;
  sort_order: number;
}

export interface Category {
  id: number;
  name: string;
  slug_name: string;
  description: string;
  is_active: boolean;
  sort_order: number;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: string;
  category: Category;
  average_rating: number | null;
  images: ProductImage[];
  is_active: boolean;
  available: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Product[];
}

export interface Rating {
  id: number;
  user: {
    id: number;
    first_name: string;
    last_name: string;
  };
  rating: number;
  comment: string;
  created_at: string;
}

export interface RatingListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Rating[];
}

export interface CreateRatingData {
  rating: number;
  comment: string;
}

export interface ProductDetailResponse extends Product {
  ratings?: RatingListResponse;
}
