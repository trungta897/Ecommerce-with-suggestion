export const HEADER_SUGGESTED_KEYWORDS = [
  'Laptop',
  'ASUS ROG',
  'RAM DDR4',
  'VGA RTX',
  'Ổ cứng SSD',
  'Màn hình Gaming',
];

export const POPULAR_SEARCH_KEYWORDS = [
  'Laptop Gaming',
  'ASUS ROG',
  'RAM DDR4',
  'VGA RTX',
  'Ổ cứng SSD 1TB',
  'Màn hình 144Hz',
  'Dell Laptop',
  'Seagate HDD',
];

export const SEARCH_MIN_QUERY_LENGTH = 2;
export const SEARCH_MAX_QUERY_LENGTH = 100;
export const SEARCH_HISTORY_KEY = 'datn_recent_searches';
export const SEARCH_HISTORY_MAX_ITEMS = 6;
export const SEARCH_DEBOUNCE_MS = 300;

export const SEARCH_SORT_OPTIONS = [
  { value: 'newest', labelKey: 'sortNewest' },
  { value: 'popular', labelKey: 'sortPopular' },
  { value: 'price_asc', labelKey: 'sortPriceAsc' },
  { value: 'price_desc', labelKey: 'sortPriceDesc' },
] as const;

export const SEARCH_RATING_OPTIONS = [
  { value: '5', rating: 5 },
  { value: '4', rating: 4 },
  { value: '3', rating: 3 },
  { value: '2', rating: 2 },
  { value: '1', rating: 1 },
] as const;
