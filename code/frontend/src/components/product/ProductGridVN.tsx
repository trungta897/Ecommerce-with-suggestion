import React from 'react';
import ProductCardVN from './ProductCardVN';
import { MOCK_PRODUCTS, Product } from '@/lib/mockData';

export default function ProductGridVN() {
  return (
    <section className="w-full max-w-7xl mx-auto px-[var(--space-4)] py-[var(--space-6)]">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-[var(--space-4)]">
        {MOCK_PRODUCTS.slice(0, 5).map((product) => (
          <ProductCardVN key={product.id} product={product as unknown as Product} />
        ))}
      </div>
    </section>
  );
}
