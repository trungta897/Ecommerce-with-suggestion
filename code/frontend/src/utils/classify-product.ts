import { Product } from '@/types';
import {
  DEFAULT_CATEGORY_SLUG,
  classifyProduct as _classifyProduct,
  CATEGORY_TREE,
} from '@/constants/product';

function classifyProduct(tags: string[], productName?: string, description?: string): string {
  return _classifyProduct(tags, productName, description);
}

/**
 * Phân loại toàn bộ danh sách sản phẩm thành bản đồ chuyên mục một cách hoàn toàn ĐỘNG (Dynamic).
 */
export function classifyAllProducts(products: Product[]): Record<string, Product[]> {
  // Trích xuất tất cả leaf slugs từ CATEGORY_TREE
  const allSlugs: string[] = [];
  for (const parent of CATEGORY_TREE) {
    if (parent.children && parent.children.length > 0) {
      for (const child of parent.children) {
        allSlugs.push(child.slug);
      }
    } else {
      allSlugs.push(parent.slug);
    }
  }

  // Khởi tạo dynamic map
  const map = allSlugs.reduce(
    (acc, slug) => {
      acc[slug] = [];
      return acc;
    },
    {} as Record<string, Product[]>
  );
  map[DEFAULT_CATEGORY_SLUG] = map[DEFAULT_CATEGORY_SLUG] || [];

  for (const p of products) {
    const slug = classifyProduct(p.tags || [], p.name, p.description);
    if (!map[slug]) map[slug] = [];
    map[slug].push(p);
  }

  return map;
}
