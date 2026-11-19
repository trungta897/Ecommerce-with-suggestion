'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store';
import { wishlistService } from '@/services/wishlist-service';
import { useToast } from '@/providers/toast-provider';
import { useTranslations } from 'next-intl';

export function useWishlist() {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['wishlist', user?.id],
    queryFn: wishlistService.getWishlist,
    enabled: !!user,
  });
}

export function useWishlistIds() {
  const { user } = useAuthStore();

  const query = useQuery({
    queryKey: ['wishlist-ids', user?.id],
    queryFn: wishlistService.getWishlistIds,
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });

  const idsSet = new Set<string>(query.data || []);

  return {
    ...query,
    wishlistIds: idsSet,
    isWishlisted: (productId: string) => idsSet.has(productId),
  };
}

export function useToggleWishlist() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const toast = useToast();
  const t = useTranslations('product');

  return useMutation({
    mutationFn: async (productId: string) => {
      if (!user) {
        throw new Error('UNAUTHORIZED');
      }
      return wishlistService.toggleWishlist(productId);
    },
    onMutate: async (productId: string) => {
      if (!user) return;

      await queryClient.cancelQueries({ queryKey: ['wishlist-ids', user.id] });

      const previousIds = queryClient.getQueryData<string[]>(['wishlist-ids', user.id]) || [];
      const hasId = previousIds.includes(productId);

      const updatedIds = hasId
        ? previousIds.filter((id) => id !== productId)
        : [...previousIds, productId];

      queryClient.setQueryData(['wishlist-ids', user.id], updatedIds);

      return { previousIds };
    },
    onSuccess: (data) => {
      if (data.isWishlisted) {
        toast.success(t('wishlistAdded'), t('addedToCartTitle'));
      } else {
        toast.info(t('wishlistRemoved'));
      }
    },
    onError: (err: Error, _productId, context) => {
      if (err.message === 'UNAUTHORIZED') {
        toast.warning(t('requireLoginWishlist'));
        return;
      }
      if (user && context?.previousIds) {
        queryClient.setQueryData(['wishlist-ids', user.id], context.previousIds);
      }
      toast.error(t('addedToCartFailed'));
    },
    onSettled: () => {
      if (user) {
        queryClient.invalidateQueries({ queryKey: ['wishlist-ids', user.id] });
        queryClient.invalidateQueries({ queryKey: ['wishlist', user.id] });
      }
    },
  });
}
