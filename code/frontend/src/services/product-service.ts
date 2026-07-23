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
  id: Number(mock.id),
  title_vi: mock.name,
  description_vi: '',
  price: mock.price,
  stock: 50,
  image_url: mock.imageUrl,
  category_id: 0,
  is_active: true,
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
        id: Number(c.id),
        name_vi: c.nameKey,
        description_vi: '',
        slug: c.slug,
      }))
    );
  },
};
