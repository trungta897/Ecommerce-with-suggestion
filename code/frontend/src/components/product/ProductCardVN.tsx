import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/lib/mockData';

interface ProductCardProps {
  product: Product;
}

export default function ProductCardVN({ product }: ProductCardProps) {
  return (
    <Link href={`/products/${product.slug}`} className="group bg-white p-4 rounded-xl border border-rule hover:shadow-lg transition-all flex flex-col h-full">
      {/* AI Score Badge */}
      {product.aiScore && (
        <div className="mb-3 inline-flex items-center gap-1 bg-purple-50 text-purple-700 text-xs font-semibold px-2 py-1 rounded-md border border-purple-100 self-start">
          ✨ {product.aiScore}% Phù hợp
        </div>
      )}
      
      {/* Image Area */}
      <div className="relative aspect-square w-full bg-paper-2 rounded-lg mb-4 overflow-hidden">
        {/* Placeholder if no next/image domain config, using img for now or standard next/image */}
        <img 
          src={product.imageUrl} 
          alt={product.name}
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
        />
        {product.discountPercentage && (
          <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded">
            Giảm {product.discountPercentage}%
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-grow justify-between">
        <div>
          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {product.tags.map(tag => (
                <span key={tag} className="text-[10px] bg-gray-100 text-ink-2 px-2 py-0.5 rounded border border-gray-200">
                  {tag}
                </span>
              ))}
            </div>
          )}
          <h3 className="font-medium text-ink line-clamp-2 mb-2 text-sm md:text-base group-hover:text-primary transition-colors">
            {product.name}
          </h3>
        </div>
        
        <div className="mt-2">
          <div className="text-primary font-bold text-lg md:text-xl">
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}
          </div>
          {product.originalPrice && (
            <div className="text-muted text-sm line-through mt-1">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.originalPrice)}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
