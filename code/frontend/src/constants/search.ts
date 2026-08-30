export const HEADER_SUGGESTED_KEYWORDS = [
  'iphone 16',
  'macbook pro',
  'laptop gaming',
  'samsung s24',
  'loa bluetooth',
];

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
