/**
 * 11 Smart Slugs tương ứng với 11 chuyên mục linh kiện trên trang chủ.
 */
export const SMART_SLUGS = [
  'laptops',
  'peripherals',
  'cpu-gpu-main',
  'ram-memory',
  'storage-drives',
  'power-supplies',
  'cooling-cases',
  'desktop-pc',
  'audio',
  'mobile-tablets',
  'networking-cables',
] as const;

export type SmartSlug = (typeof SMART_SLUGS)[number];

/**
 * Chuyên mục mặc định (catch-all) khi sản phẩm không khớp với bất kỳ thẻ tag nào.
 */
export const DEFAULT_SMART_SLUG: SmartSlug = 'networking-cables';

/**
 * Bản đồ tag Amazon → Smart Slug.
 *
 * Thứ tự các nhóm có ý nghĩa ưu tiên:
 *   1. Hệ thống hoàn chỉnh (Laptop, Desktop, Mobile) kiểm tra TRƯỚC
 *      → ngăn linh kiện "giật" Laptop/PC có chứa keyword cấu hình.
 *   2. Linh kiện nội bộ (CPU, RAM, Storage, PSU, Cooling).
 *   3. Ngoại vi & giải trí (Peripherals, Audio).
 *   4. Catch-all: Networking & Cables.
 */
export const TAG_TO_SLUG: [string[], SmartSlug][] = [
  // --- Nhóm 1: Hệ thống hoàn chỉnh (ưu tiên cao nhất) ---
  [['Laptops', 'Traditional Laptops', '2 in 1 Laptops', 'Laptop Computers'], 'laptops'],
  [
    [
      'Desktops',
      'Traditional Desktops',
      'Towers',
      'All-in-One Desktops',
      'Mini PCs',
      'Monitors',
      'Computer Monitors',
      'Workstations',
    ],
    'desktop-pc',
  ],
  [
    ['Tablets', 'Cell Phones', 'Smartphones', 'Unlocked Cell Phones', 'Carrier Cell Phones'],
    'mobile-tablets',
  ],

  // --- Nhóm 2: Linh kiện phần cứng ---
  [
    [
      'CPU Processors',
      'Motherboards',
      'Graphics Cards',
      'Computer Graphics Cards',
      'Computer Cards',
    ],
    'cpu-gpu-main',
  ],
  [['Memory', 'Computer Memory'], 'ram-memory'],
  [
    [
      'Data Storage',
      'Internal Hard Drives',
      'External Hard Drives',
      'Solid State Drives',
      'External Solid State Drives',
      'USB Flash Drives',
      'Memory Cards',
      'Micro SD Cards',
    ],
    'storage-drives',
  ],
  [['Power Supplies', 'Internal Power Supplies', 'Power Inverters', 'UPS'], 'power-supplies'],
  [
    [
      'Fans & Cooling',
      'CPU Cooling Fans',
      'Case Fans',
      'Water Cooling Systems',
      'Heatsinks',
      'Computer Cases',
      'Cooling Pads & External Fans',
      'Cooling Pads',
    ],
    'cooling-cases',
  ],

  // --- Nhóm 3: Ngoại vi & giải trí ---
  [
    [
      'Keyboards, Mice & Accessories',
      'Keyboards',
      'Mice',
      'Gaming Mice',
      'Gaming Keyboards',
      'Keyboard & Mouse Combos',
      'Mouse Pads',
      'Trackballs',
    ],
    'peripherals',
  ],
  [
    [
      'Headphones',
      'Earbuds',
      'Home Audio',
      'Speakers',
      'Bookshelf Speakers',
      'Computer Speakers',
      'Sound Cards',
      'Microphones & Accessories',
      'Headphones, Earbuds & Accessories',
    ],
    'audio',
  ],
];
