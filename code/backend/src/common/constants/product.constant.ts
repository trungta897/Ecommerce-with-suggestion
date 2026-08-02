export interface CategoryNode {
  slug: string;
  name: string;
  children?: CategoryNode[];
}

export const CATEGORY_TREE: CategoryNode[] = [
  {
    slug: 'dien-thoai-tablet',
    name: 'Điện thoại, Tablet',
    children: [
      { slug: 'dien-thoai', name: 'Điện thoại' },
      { slug: 'may-tinh-bang', name: 'Máy tính bảng' },
    ],
  },
  {
    slug: 'laptop-group',
    name: 'Laptop',
    children: [{ slug: 'laptop', name: 'Laptop' }],
  },
  {
    slug: 'pc-group',
    name: 'Máy tính để bàn',
    children: [{ slug: 'may-tinh-de-ban', name: 'PC' }],
  },
  {
    slug: 'linh-kien-may-tinh',
    name: 'Linh kiện máy tính',
    children: [
      { slug: 'cpu', name: 'CPU - Bộ vi xử lý' },
      { slug: 'mainboard', name: 'Mainboard - Bo mạch chủ' },
      { slug: 'vga', name: 'VGA - Card màn hình' },
      { slug: 'ram', name: 'RAM máy tính' },
      { slug: 'o-cung', name: 'Ổ cứng trong (HDD/SSD)' },
      { slug: 'nguon', name: 'Nguồn máy tính (PSU)' },
      { slug: 'vo-case', name: 'Vỏ máy tính (Case)' },
      { slug: 'tan-nhiet', name: 'Tản nhiệt PC' },
    ],
  },
  {
    slug: 'man-hinh-group',
    name: 'Màn hình máy tính',
    children: [{ slug: 'man-hinh', name: 'Màn hình' }],
  },
  {
    slug: 'luu-tru-gan-ngoai',
    name: 'Lưu trữ gắn ngoài & Thẻ nhớ',
    children: [
      { slug: 'the-nho', name: 'Thẻ nhớ & Đầu đọc thẻ' },
      { slug: 'o-cung-ngoai', name: 'Ổ cứng gắn ngoài' },
      { slug: 'usb', name: 'USB' },
      { slug: 'o-dia-quang', name: 'Ổ đĩa quang' },
    ],
  },
  {
    slug: 'phu-kien',
    name: 'Phụ kiện & Thiết bị khác',
    children: [
      { slug: 'phu-kien-laptop', name: 'Phụ kiện Laptop' },
      { slug: 'cap-hub', name: 'Cáp & Hub chuyển đổi' },
      { slug: 'tai-nghe-am-thanh', name: 'Tai nghe & Âm thanh' },
      { slug: 'may-anh', name: 'Máy ảnh & Phụ kiện' },
      { slug: 'linh-kien-khac', name: 'Linh kiện khác' },
    ],
  },
];

export const DEFAULT_CATEGORY_SLUG = 'linh-kien-khac';

const LAPTOP_EXCLUSION_TAGS = [
  'Laptop Accessories',
  'Bags, Cases & Sleeves',
  'Backpacks',
  'Sleeves',
  'Stands',
  'Cooling Pads & External Fans',
  'Cooling Pads',
  'Docking Stations',
  'Camera Privacy Covers',
  'Memory Card Readers',
  'Memory Card Accessories',
  'Memory Card Cases',
  'CD & DVD Drives',
  'Optical Drives',
  'Cleaning',
  'Cleaning & Repair',
  'Laptop Sleeves',
  'Laptop Bags',
];

const DESKTOP_EXCLUSION_TAGS = [
  'Enclosures',
  'Hard Drive Enclosures',
  'All-in-Ones',
  'Computer Speakers',
  'Monitor Accessories',
  'Monitor Stands',
  'Monitor Arms',
  'TV Mounts',
  'TV Wall & Ceiling Mounts',
  'Internal TV Tuner & Capture Cards',
  'External TV Tuners',
  'TV Tuners & Video Capture',
];

const TAG_TO_SLUG: [string[], string][] = [
  // --- Điện thoại, Tablet ---
  [
    [
      'Cell Phones',
      'Smartphones',
      'Unlocked Cell Phones',
      'Carrier Cell Phones',
    ],
    'dien-thoai',
  ],
  [['Tablets'], 'may-tinh-bang'],

  // --- Lưu trữ ngoài ---
  [['External Hard Drives', 'Network Attached Storage'], 'o-cung-ngoai'],
  [['USB Flash Drives'], 'usb'],
  [
    [
      'Memory Cards',
      'Micro SD Cards',
      'CompactFlash Cards',
      'Memory Stick Cards',
      'Memory Card Readers',
      'Memory Card Adapters',
      'Memory Card Accessories',
      'Memory Card Cases',
    ],
    'the-nho',
  ],
  [
    [
      'Optical Drives',
      'CD & DVD Drives',
      'Disc Duplicators',
      'Internal Optical Drives',
      'Internal Blu-ray Drives',
      'Internal CD & DVD Drives',
      'Blu-ray Drives',
    ],
    'o-dia-quang',
  ],

  // --- Linh kiện PC ---
  [['CPU Processors', 'Processors'], 'cpu'],
  [['Motherboards'], 'mainboard'],
  [['Graphics Cards', 'Computer Graphics Cards', 'GPU'], 'vga'],
  [['Memory', 'Computer Memory', 'RAM'], 'ram'],
  [
    [
      'Internal Hard Drives',
      'Solid State Drives',
      'Internal Solid State Drives',
      'Hard Drives',
      'SSD',
    ],
    'o-cung',
  ],
  [
    [
      'Power Supplies',
      'Internal Power Supplies',
      'Power Inverters',
      'UPS',
      'Computer Power Supplies',
    ],
    'nguon',
  ],
  [['Computer Cases'], 'vo-case'],
  [
    [
      'Fans & Cooling',
      'CPU Cooling Fans',
      'Case Fans',
      'Water Cooling Systems',
      'Heatsinks',
      'Thermal Paste',
      'Thermal Pads',
      'Water Cooling',
      'USB Fans',
      'Silicon Grease',
      'Thermal Paste & Pads',
    ],
    'tan-nhiet',
  ],

  // --- Phụ kiện ---
  [
    [
      'Laptop Accessories',
      'Bags, Cases & Sleeves',
      'Backpacks',
      'Sleeves',
      'Stands',
      'Docking Stations',
      'Camera Privacy Covers',
      'Cooling Pads & External Fans',
      'Cooling Pads',
      'Laptop Sleeves',
      'Laptop Bags',
    ],
    'phu-kien-laptop',
  ],
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
      'Numeric Keypads',
      'Graphics Tablets',
      'Networking Products',
      'Routers',
      'Computer Routers',
      'Switches',
      'Computer Networking Switches',
      'Network Adapters',
      'Computer Network Adapters',
      'USB Network Adapters',
      'Computer Cables & Interconnects',
      'USB Cables',
      'HDMI Cables',
      'Ethernet Cables',
      'SATA Cables',
      'Audio & Video Cables',
      'Cables & Interconnects',
      'Cables & Accessories',
      'Power Cords',
      'Lightning Cables',
      'DVI',
      'KVM Switches',
      'USB Hubs',
      'I/O Port Cards',
      'USB Port Cards',
      'Computer Cable Adapters',
      'DVI-HDMI Adapters',
      'USB-to-VGA Adapters',
      'USB Gadgets',
      'Network Cards',
      'Monitor Accessories',
      'Monitor Stands',
      'Monitor Arms',
      'TV Mounts',
      'TV Wall & Ceiling Mounts',
    ],
    'cap-hub',
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
      'Radios',
      'Smart Glasses',
      'External Sound Cards',
      'Internal Sound Cards',
      'Audio & Video Accessories',
      'Computer Headsets',
      'Earpads',
      'Portable Bluetooth Speakers',
      'Portable Speakers & Docks',
      'Digital Voice Recorders',
      'Clock Radios',
      'Car Audio',
      'Car Stereo Receivers',
    ],
    'tai-nghe-am-thanh',
  ],
  [
    [
      'Camera & Photo',
      'Digital Cameras',
      'Action Cameras',
      'Webcams',
      'Computer Webcams',
      'Tripods & Monopods',
      'Tripods',
      'Digital Picture Frames',
      'Security Cameras',
      'Video Surveillance',
      'Pedometers',
    ],
    'may-anh',
  ],
  [
    [
      'Single Board Computers',
      'Data Storage',
      'Hard Drive Enclosures',
      'Computer Hard Drive Enclosures',
      'Hard Drive Accessories',
      'Hard Drive Bags & Cases',
      'Hard Drive Caddies',
    ],
    'linh-kien-khac',
  ],

  // --- Thiết bị chính ---
  [
    [
      'Laptops',
      'Traditional Laptops',
      '2 in 1 Laptops',
      'Laptop Computers',
      'MacBook',
    ],
    'laptop',
  ],
  [['Monitors', 'Computer Monitors', 'Gaming Monitors'], 'man-hinh'],
  [
    [
      'Desktops',
      'Traditional Desktops',
      'Towers',
      'All-in-One Desktops',
      'Mini PCs',
      'Workstations',
      'Servers',
    ],
    'may-tinh-de-ban',
  ],
];

const KEYWORD_TO_SLUG: [string[], string][] = [
  [['cable', 'adapter', 'router', 'switch', 'hub '], 'cap-hub'],
  [['keyboard', 'mouse', 'trackball', 'wacom', 'keypad'], 'cap-hub'],
  [
    ['headphone', 'speaker', 'earbud', 'microphone', 'sound card'],
    'tai-nghe-am-thanh',
  ],
  [['camera', 'webcam', 'tripod'], 'may-anh'],
  [
    ['backpack', 'sleeve', 'stand', 'cooling pad', 'docking station'],
    'phu-kien-laptop',
  ],
  [['kvm', 'usb hub', 'pcie card', 'monitor arm', 'monitor stand'], 'cap-hub'],
  [['flash drive'], 'usb'],
  [['micro sd', 'card reader'], 'the-nho'],
  [['dvd drive', 'cd drive', 'optical drive'], 'o-dia-quang'],
  [['ssd', 'hdd', 'hard drive', 'hard disk'], 'o-cung'],
  [['cpu', 'processor'], 'cpu'],
  [['motherboard', 'mainboard'], 'mainboard'],
  [['gpu', 'graphics card', 'rtx ', 'gtx ', 'rx '], 'vga'],
  [['ram', 'ddr4', 'ddr5', 'memory kit'], 'ram'],
  [['power supply', 'psu', 'ups ', 'charger'], 'nguon'],
  [
    ['cooler', 'heatsink', 'thermal pad', 'thermal paste', 'fan', 'case '],
    'tan-nhiet',
  ],
  [['laptop', 'macbook', 'chromebook'], 'laptop'],
  [['monitor '], 'man-hinh'],
  [['desktop', 'mini pc', 'server'], 'may-tinh-de-ban'],
  [['phone', 'smartphone', 'iphone'], 'dien-thoai'],
  [['tablet', 'ipad'], 'may-tinh-bang'],
];

export function classifyProduct(
  tags: string[],
  productName?: string,
  description?: string,
): string {
  const isLaptopExcluded = LAPTOP_EXCLUSION_TAGS.some((t) => tags.includes(t));
  const isDesktopExcluded = DESKTOP_EXCLUSION_TAGS.some((t) =>
    tags.includes(t),
  );

  if (Array.isArray(tags) && tags.length > 0) {
    for (const [tagList, slug] of TAG_TO_SLUG) {
      if (slug === 'laptop' && isLaptopExcluded) continue;
      if (slug === 'may-tinh-de-ban' && isDesktopExcluded) continue;

      if (tagList.some((t) => tags.includes(t))) {
        return slug;
      }
    }
  }

  // Gom nhóm text để lọc (Name + Description + Tags)
  const fullText =
    (productName || '') +
    ' ' +
    (description || '') +
    ' ' +
    (tags || []).join(' ');
  if (fullText.trim()) {
    const textLower = fullText.toLowerCase();

    // Explicit rule for Mascara (junk data)
    if (textLower.includes('mascara') || textLower.includes('makeup')) {
      return 'linh-kien-khac';
    }

    // Explicit rule for Raspberry Pi / Arduino
    if (textLower.includes('raspberry pi') || textLower.includes('arduino')) {
      return 'linh-kien-khac';
    }

    // Ngăn chặn phụ kiện lọt vào danh mục chính
    const isAccessoryText =
      /case for|cover|stand|mount|sleeve|bag|backpack/i.test(textLower);

    for (const [keywords, slug] of KEYWORD_TO_SLUG) {
      // Nếu là phụ kiện, không phân loại vào các thiết bị chính
      if (
        isAccessoryText &&
        [
          'laptop',
          'may-tinh-de-ban',
          'man-hinh',
          'dien-thoai',
          'may-tinh-bang',
        ].includes(slug)
      ) {
        continue;
      }

      if (
        keywords.some((k) =>
          new RegExp('\\b' + k.trim() + '\\b', 'i').test(textLower),
        )
      ) {
        return slug;
      }
    }
  }

  return DEFAULT_CATEGORY_SLUG;
}
