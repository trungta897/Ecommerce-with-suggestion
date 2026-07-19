export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  imageUrl: string;
  aiScore?: number; // % match based on AI
  category: string;
  brand: string;
  tags?: string[];
}

export interface Category {
  id: string;
  nameKey: string; // key in i18n
  slug: string;
}

export const CATEGORIES: Category[] = [
  { id: '1', nameKey: 'laptop', slug: 'laptop' },
  { id: '2', nameKey: 'phone', slug: 'phone' },
  { id: '3', nameKey: 'tablet', slug: 'tablet' },
  { id: '4', nameKey: 'accessory', slug: 'accessory' }
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'iPhone 15 Pro Max 256GB',
    slug: 'iphone-15-pro-max-256gb',
    price: 29590000,
    originalPrice: 34990000,
    discountPercentage: 15,
    imageUrl: 'https://via.placeholder.com/300x300.png?text=iPhone+15+Pro+Max',
    aiScore: 98,
    category: 'phone',
    brand: 'Apple',
    tags: ['Bán chạy', 'Mới']
  },
  {
    id: 'p2',
    name: 'Samsung Galaxy S24 Ultra 5G 256GB',
    slug: 'samsung-galaxy-s24-ultra',
    price: 31990000,
    originalPrice: 33990000,
    discountPercentage: 5,
    imageUrl: 'https://via.placeholder.com/300x300.png?text=Galaxy+S24+Ultra',
    aiScore: 95,
    category: 'phone',
    brand: 'Samsung',
    tags: ['AI Phone']
  },
  {
    id: 'p3',
    name: 'MacBook Air 15 inch M3 2024 8GB/256GB',
    slug: 'macbook-air-15-m3-2024',
    price: 31990000,
    originalPrice: 32990000,
    discountPercentage: 3,
    imageUrl: 'https://via.placeholder.com/300x300.png?text=MacBook+Air+M3',
    aiScore: 90,
    category: 'laptop',
    brand: 'Apple',
    tags: ['Văn phòng']
  },
  {
    id: 'p4',
    name: 'Laptop ASUS TUF Gaming F15',
    slug: 'asus-tuf-gaming-f15',
    price: 19990000,
    originalPrice: 22990000,
    discountPercentage: 13,
    imageUrl: 'https://via.placeholder.com/300x300.png?text=ASUS+TUF+Gaming',
    aiScore: 85,
    category: 'laptop',
    brand: 'ASUS',
    tags: ['Gaming', 'Giá sốc']
  },
  {
    id: 'p5',
    name: 'iPad Pro 11 inch M4 2024 (Wifi) 256GB',
    slug: 'ipad-pro-11-m4-2024',
    price: 27990000,
    originalPrice: 28990000,
    discountPercentage: 3,
    imageUrl: 'https://via.placeholder.com/300x300.png?text=iPad+Pro+M4',
    aiScore: 92,
    category: 'tablet',
    brand: 'Apple'
  },
  {
    id: 'p6',
    name: 'Tai nghe Bluetooth AirPods Pro Gen 2',
    slug: 'airpods-pro-gen-2',
    price: 5990000,
    originalPrice: 6590000,
    discountPercentage: 9,
    imageUrl: 'https://via.placeholder.com/300x300.png?text=AirPods+Pro+2',
    aiScore: 88,
    category: 'accessory',
    brand: 'Apple',
    tags: ['Khuyên dùng']
  }
];
