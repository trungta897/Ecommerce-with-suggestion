export type HeroCategoryIconKey =
  | 'smartphone'
  | 'tablet'
  | 'laptop'
  | 'desktop'
  | 'mainboard'
  | 'cpu'
  | 'vga'
  | 'ram'
  | 'storage'
  | 'cooling'
  | 'monitor'
  | 'usb'
  | 'cable'
  | 'audio'
  | 'camera';

export interface HeroCategoryItem {
  slug: string;
  iconKey: HeroCategoryIconKey;
}

export interface HeroSlideConfig {
  id: string;
  titleKey: string;
  subtitleKey: string;
  descKey: string;
  badgeKey: string;
  timeKey: string;
  highlightKey: string;
  ctaKey: string;
  href: string;
  imageUrl: string;
  gradientClass: string;
  badgeClass: string;
  ctaClass: string;
}

export interface HeroSmallBannerConfig {
  id: string;
  titleKey: string;
  subKey: string;
  descKey: string;
  timeKey: string;
  badgeKey: string;
  href: string;
  imageUrl: string;
  gradientClass: string;
}

export interface MidPromoBannerConfig {
  id: string;
  href: string;
  titleKey: string;
  descKey: string;
  ctaKey: string;
  badgeKey: string;
  timeKey: string;
  imageUrl: string;
  gradientClass: string;
  ctaClass: string;
}

export const HOME_CATEGORY_SLUGS = [
  'laptop',
  'man-hinh',
  'may-tinh-de-ban',
  'o-cung',
  'vga',
  'ram',
] as const;

export const HOME_SECTION_PRODUCT_LIMIT = 8;
export const HOME_FALLBACK_FETCH_LIMIT = 16;
export const FLASH_SALE_FALLBACK_LIMIT = 8;
export const FLASH_SALE_DEFAULT_HOURS = 8;
export const FLASH_SALE_BASE_QTY = 20;
export const FLASH_SALE_QTY_STEP = 5;
export const FLASH_SALE_QTY_MODULO = 5;
export const FLASH_SALE_SOLD_RATIO = 0.45;
export const FLASH_SALE_SCROLL_STEP_PX = 300;
export const FLASH_SALE_FALLBACK_DISCOUNT_RATES = [
  0.2, 0.25, 0.15, 0.3, 0.18, 0.22, 0.28, 0.16,
] as const;

export const FLASH_SALE_QUICK_DISCOUNT_RATES = [10, 15, 20, 30, 50] as const;
export const FLASH_SALE_QUICK_DURATION_HOURS = [
  { hours: 6, label: '+6h' },
  { hours: 12, label: '+12h' },
  { hours: 24, label: '+24h' },
  { hours: 72, label: '+3d' },
  { hours: 168, label: '+7d' },
] as const;

export const HERO_AUTOPLAY_INTERVAL_MS = 5000;

export const HERO_CATEGORY_ITEMS: HeroCategoryItem[] = [
  { slug: 'dien-thoai', iconKey: 'smartphone' },
  { slug: 'may-tinh-bang', iconKey: 'tablet' },
  { slug: 'laptop', iconKey: 'laptop' },
  { slug: 'may-tinh-de-ban', iconKey: 'desktop' },
  { slug: 'mainboard', iconKey: 'mainboard' },
  { slug: 'cpu', iconKey: 'cpu' },
  { slug: 'vga', iconKey: 'vga' },
  { slug: 'ram', iconKey: 'ram' },
  { slug: 'o-cung', iconKey: 'storage' },
  { slug: 'tan-nhiet', iconKey: 'cooling' },
  { slug: 'man-hinh', iconKey: 'monitor' },
  { slug: 'usb', iconKey: 'usb' },
  { slug: 'cap-hub', iconKey: 'cable' },
  { slug: 'tai-nghe-am-thanh', iconKey: 'audio' },
  { slug: 'may-anh', iconKey: 'camera' },
];

export const HERO_SLIDES: HeroSlideConfig[] = [
  {
    id: 'macbook',
    titleKey: 'slides.macbook.title',
    subtitleKey: 'slides.macbook.subtitle',
    descKey: 'slides.macbook.desc',
    badgeKey: 'slides.macbook.badge',
    timeKey: 'slides.macbook.time',
    highlightKey: 'slides.macbook.highlight',
    ctaKey: 'slides.macbook.cta',
    href: '/category/laptop',
    imageUrl:
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=80',
    gradientClass: 'from-slate-900 via-blue-950 to-indigo-900',
    badgeClass: 'bg-blue-500/20 text-blue-200 border-blue-400/30',
    ctaClass: 'bg-white text-indigo-950 hover:bg-blue-50',
  },
  {
    id: 'iphone',
    titleKey: 'slides.iphone.title',
    subtitleKey: 'slides.iphone.subtitle',
    descKey: 'slides.iphone.desc',
    badgeKey: 'slides.iphone.badge',
    timeKey: 'slides.iphone.time',
    highlightKey: 'slides.iphone.highlight',
    ctaKey: 'slides.iphone.cta',
    href: '/category/dien-thoai',
    imageUrl:
      'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=900&q=80',
    gradientClass: 'from-zinc-900 via-neutral-800 to-stone-900',
    badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-400/30',
    ctaClass: 'bg-amber-400 text-zinc-950 hover:bg-amber-300',
  },
  {
    id: 'gaming_pc',
    titleKey: 'slides.gaming_pc.title',
    subtitleKey: 'slides.gaming_pc.subtitle',
    descKey: 'slides.gaming_pc.desc',
    badgeKey: 'slides.gaming_pc.badge',
    timeKey: 'slides.gaming_pc.time',
    highlightKey: 'slides.gaming_pc.highlight',
    ctaKey: 'slides.gaming_pc.cta',
    href: '/category/vga',
    imageUrl:
      'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=900&q=80',
    gradientClass: 'from-rose-950 via-red-900 to-orange-900',
    badgeClass: 'bg-red-500/20 text-red-200 border-red-400/30',
    ctaClass: 'bg-white text-red-950 hover:bg-red-50',
  },
];

export const HERO_SMALL_BANNERS: HeroSmallBannerConfig[] = [
  {
    id: 'back_to_school',
    titleKey: 'small_banners.back_to_school_title',
    subKey: 'small_banners.back_to_school_sub',
    descKey: 'small_banners.back_to_school_desc',
    timeKey: 'small_banners.back_to_school_time',
    badgeKey: 'small_banners.back_to_school_badge',
    href: '/category/laptop',
    imageUrl:
      'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=400&q=80',
    gradientClass: 'from-orange-600 via-orange-500 to-red-600',
  },
  {
    id: 'warehouse_clearance',
    titleKey: 'small_banners.warehouse_clearance_title',
    subKey: 'small_banners.warehouse_clearance_sub',
    descKey: 'small_banners.warehouse_clearance_desc',
    timeKey: 'small_banners.warehouse_clearance_time',
    badgeKey: 'small_banners.warehouse_clearance_badge',
    href: '/category/o-cung',
    imageUrl:
      'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=400&q=80',
    gradientClass: 'from-emerald-700 via-emerald-600 to-teal-700',
  },
  {
    id: 'apple_week',
    titleKey: 'small_banners.apple_week_title',
    subKey: 'small_banners.apple_week_sub',
    descKey: 'small_banners.apple_week_desc',
    timeKey: 'small_banners.apple_week_time',
    badgeKey: 'small_banners.apple_week_badge',
    href: '/category/dien-thoai',
    imageUrl:
      'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=400&q=80',
    gradientClass: 'from-purple-700 via-purple-600 to-fuchsia-700',
  },
  {
    id: 'build_pc',
    titleKey: 'small_banners.build_pc_title',
    subKey: 'small_banners.build_pc_sub',
    descKey: 'small_banners.build_pc_desc',
    timeKey: 'small_banners.build_pc_time',
    badgeKey: 'small_banners.build_pc_badge',
    href: '/category/may-tinh-de-ban',
    imageUrl:
      'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&w=400&q=80',
    gradientClass: 'from-blue-700 via-blue-600 to-cyan-600',
  },
];

export const MID_PROMO_BANNERS: MidPromoBannerConfig[] = [
  {
    id: 'laptop',
    href: '/category/laptop',
    titleKey: 'promo_banners.laptop_title',
    descKey: 'promo_banners.laptop_desc',
    ctaKey: 'promo_banners.laptop_cta',
    badgeKey: 'promo_banners.laptop_badge',
    timeKey: 'promo_banners.laptop_time',
    imageUrl:
      'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=700&q=80',
    gradientClass: 'from-blue-700 via-indigo-800 to-slate-900',
    ctaClass: 'bg-white text-blue-900 hover:bg-blue-50',
  },
  {
    id: 'vga',
    href: '/category/vga',
    titleKey: 'promo_banners.vga_title',
    descKey: 'promo_banners.vga_desc',
    ctaKey: 'promo_banners.vga_cta',
    badgeKey: 'promo_banners.vga_badge',
    timeKey: 'promo_banners.vga_time',
    imageUrl:
      'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=700&q=80',
    gradientClass: 'from-red-600 via-orange-600 to-amber-700',
    ctaClass: 'bg-white text-red-900 hover:bg-red-50',
  },
];
