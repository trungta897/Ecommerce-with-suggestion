import React from 'react';
import ProductCardVN from './ProductCardVN';

export default function ProductGridVN() {
  const dummyProducts = [
    { id: 1, title: 'iPhone 15 Pro Max 256GB Titanium', price: '34.990.000đ', originalPrice: '38.990.000đ', ram: '8GB', rom: '256GB', isAiMatch: true },
    { id: 2, title: 'MacBook Air 15 inch M3 2024', price: '31.490.000đ', originalPrice: '32.990.000đ', ram: '8GB', rom: '256GB', isAiMatch: false },
    { id: 3, title: 'iPad Pro 11 inch M4 Wi-Fi 256GB', price: '28.990.000đ', ram: '8GB', rom: '256GB', isAiMatch: true },
    { id: 4, title: 'Samsung Galaxy S24 Ultra 5G 256GB', price: '31.990.000đ', originalPrice: '33.990.000đ', ram: '12GB', rom: '256GB', isAiMatch: false },
    { id: 5, title: 'Apple Watch Series 9 GPS 41mm', price: '9.490.000đ', originalPrice: '10.490.000đ', ram: 'N/A', rom: '64GB', isAiMatch: false },
  ];

  return (
    <section className="w-full max-w-7xl mx-auto px-[var(--space-4)] py-[var(--space-6)]">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-[var(--space-4)]">
        {dummyProducts.map((product) => (
          <ProductCardVN key={product.id} {...product} />
        ))}
      </div>
    </section>
  );
}
