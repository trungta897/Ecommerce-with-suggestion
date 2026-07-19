import HeroVN from "@/components/home/HeroVN";
import { FeaturesVN } from "@/components/home/FeaturesVN";
import { NewsletterVN } from "@/components/home/NewsletterVN";
import CategorySection from "@/components/product/CategorySection";
import { CATEGORIES, MOCK_PRODUCTS } from "@/lib/mockData";
import { useTranslations } from 'next-intl';

export default function Home() {
  const t = useTranslations('home.categories');

  return (
    <div className="flex flex-col gap-10 pb-20">
      <HeroVN />
      <FeaturesVN />

      <section className="container mx-auto px-4 lg:px-8 max-w-7xl">
        {CATEGORIES.map(category => {
          const categoryProducts = MOCK_PRODUCTS.filter(p => p.category === category.slug);
          if (categoryProducts.length === 0) return null;
          
          return (
            <CategorySection 
              key={category.id}
              title={t(category.nameKey as any) || category.nameKey}
              categorySlug={category.slug}
              products={categoryProducts}
            />
          );
        })}
      </section>

      <NewsletterVN />
    </div>
  );
}
