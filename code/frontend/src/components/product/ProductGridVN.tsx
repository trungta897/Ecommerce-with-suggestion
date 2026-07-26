'use client';

import React from 'react';
import ProductCardVN from './ProductCardVN';
import { useProducts } from '@/hooks/use-products';
import { Product } from '@/types';

interface ProductGridProps {
  products?: Product[];
}

export default function ProductGridVN({ products: propsProducts }: ProductGridProps = {}) {
  const { data: fetchedProducts, isLoading } = useProducts();
  const products = propsProducts || fetchedProducts || [];

  if (isLoading && !propsProducts) {
    return (
      <section className="w-full max-w-7xl mx-auto px-[var(--space-4)] py-[var(--space-6)]">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-[var(--space-4)] animate-pulse">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-64 bg-paper-2 rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="w-full max-w-7xl mx-auto px-[var(--space-4)] py-[var(--space-6)]">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-[var(--space-4)]">
        {products.slice(0, 10).map((product) => (
          <ProductCardVN key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
