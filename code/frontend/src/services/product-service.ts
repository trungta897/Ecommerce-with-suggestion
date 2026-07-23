import { Product, Category } from '@/types';
import { MOCK_PRODUCTS, CATEGORIES } from '@/lib/mockData';
import type { Product as MockProduct } from '@/lib/mockData';

const MOCK_DELAY = 300;

// Hàm giả lập delay để mock hành vi API thật
const simulateApiDelay = <T>(data: T): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(data), MOCK_DELAY));

/**
 * Chuyển đổi mock product sang cấu trúc Product type chính thức.
 * Khi tích hợp API thật, hàm này sẽ được loại bỏ.
 */
const mapMockToProduct = (mock: MockProduct): Product => ({
  id: String(mock.id),
  name: mock.name,
  slug: mock.name.toLowerCase().replace(/ /g, '-'),
  description: '',
  price: mock.price,
  stock: 50,
  thumbnailUrl: mock.imageUrl,
  images: [{ url: mock.imageUrl, variant: 'MAIN', isPrimary: true }],
  avgRating: 4.5,
  reviewCount: 100,
  viewCount: 200,
  soldCount: 50,
  categoryId: '0',
  isActive: true,
  createdAt: new Date().toISOString(),
});

export const productService = {
  getAll: (): Promise<Product[]> => {
    // TODO: return apiClient.get('/products').then(res => res.data.data);
    return simulateApiDelay(MOCK_PRODUCTS.map(mapMockToProduct));
  },

  getById: (id: string): Promise<Product | undefined> => {
    // TODO: return apiClient.get(`/products/${id}`).then(res => res.data.data);
    const product = MOCK_PRODUCTS.find((p) => p.id === id);
    return simulateApiDelay(product ? mapMockToProduct(product) : undefined);
  },

  getByCategory: (slug: string): Promise<Product[]> => {
    // TODO: return apiClient.get(`/products?category=${slug}`).then(res => res.data.data);
    const products = MOCK_PRODUCTS.filter((p) => p.category === slug);
    return simulateApiDelay(products.map(mapMockToProduct));
  },

  getCategories: (): Promise<Category[]> => {
    // TODO: return apiClient.get('/categories').then(res => res.data.data);
    return simulateApiDelay(
      CATEGORIES.map((c) => ({
        id: String(c.id),
        name: c.nameKey,
        description: '',
        slug: c.slug,
      }))
    );
  },
};
