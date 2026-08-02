export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  thumbnailUrl: string;
  images?: { url: string; variant: string; isPrimary: boolean }[];
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
  { id: '4', nameKey: 'accessory', slug: 'accessory' },
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'iPhone 15 Pro Max 256GB',
    slug: 'iphone-15-pro-max-256gb',
    price: 29590000,
    originalPrice: 34990000,
    discountPercentage: 15,
    thumbnailUrl: 'https://via.placeholder.com/600x600.png?text=Product+1',
    images: [
      {
        url: 'https://via.placeholder.com/600x600.png?text=Product+1',
        variant: 'hi_res',
        isPrimary: true,
      },
      {
        url: 'https://via.placeholder.com/600x600.png?text=Product+2',
        variant: 'hi_res',
        isPrimary: false,
      },
      {
        url: 'https://via.placeholder.com/600x600.png?text=Product+3',
        variant: 'hi_res',
        isPrimary: false,
      },
      {
        url: 'https://via.placeholder.com/600x600.png?text=Product+4',
        variant: 'hi_res',
        isPrimary: false,
      },
    ],
    aiScore: 98,
    category: 'phone',
    brand: 'Apple',
    tags: ['Bán chạy', 'Mới'],
  },
  {
    id: 'p2',
    name: 'Samsung Galaxy S24 Ultra 5G 256GB',
    slug: 'samsung-galaxy-s24-ultra',
    price: 31990000,
    originalPrice: 33990000,
    discountPercentage: 5,
    thumbnailUrl: 'https://via.placeholder.com/300x300.png?text=Galaxy+S24+Ultra',
    images: [
      {
        url: 'https://via.placeholder.com/300x300.png?text=Galaxy+S24+Ultra',
        variant: 'hi_res',
        isPrimary: true,
      },
    ],
    aiScore: 95,
    category: 'phone',
    brand: 'Samsung',
    tags: ['AI Phone'],
  },
  {
    id: 'p3',
    name: 'MacBook Air 15 inch M3 2024 8GB/256GB',
    slug: 'macbook-air-15-m3-2024',
    price: 31990000,
    originalPrice: 32990000,
    discountPercentage: 3,
    thumbnailUrl: 'https://via.placeholder.com/300x300.png?text=MacBook+Air+M3',
    images: [
      {
        url: 'https://via.placeholder.com/300x300.png?text=MacBook+Air+M3',
        variant: 'hi_res',
        isPrimary: true,
      },
    ],
    aiScore: 90,
    category: 'laptop',
    brand: 'Apple',
    tags: ['Văn phòng'],
  },
  {
    id: 'p4',
    name: 'Laptop ASUS TUF Gaming F15',
    slug: 'asus-tuf-gaming-f15',
    price: 19990000,
    originalPrice: 22990000,
    discountPercentage: 13,
    thumbnailUrl: 'https://via.placeholder.com/300x300.png?text=ASUS+TUF+Gaming',
    images: [
      {
        url: 'https://via.placeholder.com/300x300.png?text=ASUS+TUF+Gaming',
        variant: 'hi_res',
        isPrimary: true,
      },
    ],
    aiScore: 85,
    category: 'laptop',
    brand: 'ASUS',
    tags: ['Gaming', 'Giá sốc'],
  },
  {
    id: 'p5',
    name: 'iPad Pro 11 inch M4 2024 (Wifi) 256GB',
    slug: 'ipad-pro-11-m4-2024',
    price: 27990000,
    originalPrice: 28990000,
    discountPercentage: 3,
    thumbnailUrl: 'https://via.placeholder.com/300x300.png?text=iPad+Pro+M4',
    images: [
      {
        url: 'https://via.placeholder.com/300x300.png?text=iPad+Pro+M4',
        variant: 'hi_res',
        isPrimary: true,
      },
    ],
    aiScore: 92,
    category: 'tablet',
    brand: 'Apple',
  },
  {
    id: 'p6',
    name: 'Tai nghe Bluetooth AirPods Pro Gen 2',
    slug: 'airpods-pro-gen-2',
    price: 5990000,
    originalPrice: 6590000,
    discountPercentage: 9,
    thumbnailUrl: 'https://via.placeholder.com/300x300.png?text=AirPods+Pro+2',
    images: [
      {
        url: 'https://via.placeholder.com/300x300.png?text=AirPods+Pro+2',
        variant: 'hi_res',
        isPrimary: true,
      },
    ],
    aiScore: 88,
    category: 'accessory',
    brand: 'Apple',
    tags: ['Khuyên dùng'],
  },
];
