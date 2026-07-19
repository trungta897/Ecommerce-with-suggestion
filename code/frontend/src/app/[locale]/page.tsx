import HeroVN from "@/components/home/HeroVN";
import { FeaturesVN } from "@/components/home/FeaturesVN";
import ProductGridVN from "@/components/product/ProductGridVN";
import { NewsletterVN } from "@/components/home/NewsletterVN";
import { useTranslations } from 'next-intl';

export default function Home() {
  const t = useTranslations('home.product');

  return (
    <div className="flex flex-col gap-16 pb-20">
      <HeroVN />
      <FeaturesVN />

      <section className="container mx-auto px-4 lg:px-8 max-w-7xl">
        <div className="flex flex-col gap-2 mb-8">
          <h2 className="text-3xl font-display font-bold tracking-tight text-gray-900">
            {t('recommended_title')}
          </h2>
          <p className="text-gray-500">
            {t('recommended_subtitle')}
            test
          </p>
        </div>

        <ProductGridVN />
      </section>

      <NewsletterVN />
    </div>
  );
}
