import { Product } from '@/types';
import { TAG_TO_SLUG, SMART_SLUGS, DEFAULT_SMART_SLUG, SmartSlug } from '@/constants/product';

export { SMART_SLUGS } from '@/constants/product';
export type { SmartSlug } from '@/constants/product';

/**
 * Phân loại một sản phẩm vào đúng Smart Slug dựa 100% trên trường `tags`
 * (cây phân loại Amazon). Không sử dụng regex trên tên sản phẩm.
 * Không fallback theo category slug — vì category gốc từ DB quá rộng
 * (ví dụ 'cell-phones-accessories' chứa cả cáp sạc, hộp đựng thẻ nhớ).
 *
 * Nếu không khớp tag nào → trả về DEFAULT_SMART_SLUG (catch-all).
 */
export function classifyProduct(product: Product): SmartSlug {
  const tags: string[] = Array.isArray(product.tags) ? product.tags : [];

  // Quét qua bản đồ tag theo đúng thứ tự ưu tiên
  for (const [tagList, slug] of TAG_TO_SLUG) {
    if (tagList.some((t) => tags.includes(t))) {
      return slug;
    }
  }

  return DEFAULT_SMART_SLUG;
}

/**
 * Phân loại toàn bộ danh sách sản phẩm thành bản đồ chuyên mục một cách hoàn toàn ĐỘNG (Dynamic).
 * Không hardcode danh sách key, duy trì nguyên tắc Single Source of Truth với SMART_SLUGS.
 * Mỗi sản phẩm chỉ thuộc đúng 1 chuyên mục duy nhất (Zero Overlap).
 */
export function classifyAllProducts(products: Product[]): Record<SmartSlug, Product[]> {
  // Khởi tạo dynamic map dựa trên hằng số SMART_SLUGS
  const map = SMART_SLUGS.reduce(
    (acc, slug) => {
      acc[slug] = [];
      return acc;
    },
    {} as Record<SmartSlug, Product[]>
  );

  for (const p of products) {
    const slug = classifyProduct(p);
    map[slug].push(p);
  }

  return map;
}
