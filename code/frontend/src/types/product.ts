export interface ProductImage {
  url: string;
  variant: string;
  isPrimary: boolean;
}

export interface Category {
  id: string; // Changed to string (UUID) based on backend schema
  name: string; // Keeping standard naming convention
  slug: string;
  description?: string;
  imageUrl?: string;
  parentId?: string;
  isActive?: boolean;
}

export interface Product {
  id: string; // UUID from Prisma
  name: string;
  slug: string;
  brand?: string;
  description?: string;
  price: number;
  discountPrice?: number;
  stock: number;
  thumbnailUrl: string; // Ảnh MAIN
  images: ProductImage[]; // Tất cả ảnh
  avgRating: number;
  reviewCount: number;
  viewCount: number;
  soldCount: number;
  categoryId: string;
  category?: Category;
  isActive: boolean;
  createdAt: string;
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
