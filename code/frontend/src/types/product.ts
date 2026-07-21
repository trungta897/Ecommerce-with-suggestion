export interface Category {
  id: number;
  name_vi: string;
  description_vi: string;
  slug: string;
}

export interface Product {
  id: number;
  title_vi: string;
  description_vi: string;
  price: number;
  stock: number;
  image_url: string;
  category_id: number;
  is_active: boolean;
  category?: Category; // Assuming eager loading
}

export interface Review {
  id: number;
  user_id: string; // Since user id is UUID
  product_id: number;
  order_id: number;
  rating: number;
  comment: string;
  status: 'visible' | 'hidden';
}
