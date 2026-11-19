export interface ReviewAuthor {
  id: string;
  fullName: string;
  email?: string;
  phone?: string | null;
  avatarUrl?: string | null;
}

export interface ReviewProduct {
  id: string;
  name: string;
  slug?: string;
  images?: string[] | null;
}

export interface AdminReviewItem {
  id: string;
  userId: string;
  productId: string;
  orderId?: string | null;
  rating: number;
  title?: string | null;
  content?: string | null;
  isVerifiedPurchase: boolean;
  status: 'VISIBLE' | 'HIDDEN';
  createdAt: string;
  user: ReviewAuthor;
  product: ReviewProduct;
}

export interface ReviewsResponse {
  data: AdminReviewItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
