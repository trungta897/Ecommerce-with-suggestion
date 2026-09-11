'use client';

import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { Sparkles } from '@/components/base/icons';
import { activityService } from '@/services/activity-service';
import ProductCard from '@/components/features/product/ProductCard';

interface ProfileRecommendationsSectionProps {
  userId?: string;
}

export function ProfileRecommendationsSection({ userId }: ProfileRecommendationsSectionProps) {
  const t = useTranslations('profile');

  const { data: recommendations, isLoading: isRecsLoading } = useQuery({
    queryKey: ['profile-recommendations', userId],
    queryFn: () => activityService.getRecommendations({ limit: 4 }),
    enabled: !!userId,
  });

  return (
    <div className="bg-gradient-to-r from-purple-50/80 to-blue-50/80 border border-purple-100 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-purple-900">{t('aiRecommend')}</h2>
          <p className="text-xs sm:text-sm text-purple-700">{t('aiRecommendDesc')}</p>
        </div>
      </div>

      <div className="mt-5">
        {isRecsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-pulse">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-64 bg-white/70 rounded-xl border border-purple-100" />
            ))}
          </div>
        ) : recommendations && recommendations.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {recommendations.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-purple-600">{t('aiRecommendDesc')}</div>
        )}
      </div>
    </div>
  );
}
