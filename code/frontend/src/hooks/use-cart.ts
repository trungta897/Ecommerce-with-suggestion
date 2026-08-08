import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cartService } from '@/services/cart-service';
import { queryKeys } from './query-keys';
import { useAuthStore } from '@/store/useAuthStore';
import { useCartStore } from '@/store/useCartStore';
import { CartItem } from '@/types/order';

export function useCart() {
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const localCart = useCartStore();

  const cartQuery = useQuery({
    queryKey: queryKeys.cart.all,
    queryFn: cartService.getCart,
    enabled: isAuthenticated,
  });

  const items = isAuthenticated ? cartQuery.data || [] : localCart.items;

  const addItemMutation = useMutation({
    mutationFn: cartService.addItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.all });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      cartService.updateItem(productId, { quantity }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.all });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: cartService.removeItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.all });
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: cartService.clearCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.all });
    },
  });

  const addItem = async (item: CartItem) => {
    if (isAuthenticated) {
      await addItemMutation.mutateAsync({
        productId: item.product_id,
        quantity: item.quantity,
      });
    } else {
      localCart.addItem(item);
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (isAuthenticated) {
      await updateItemMutation.mutateAsync({ productId, quantity });
    } else {
      localCart.updateQuantity(productId, quantity);
    }
  };

  const removeItem = async (productId: string) => {
    if (isAuthenticated) {
      await removeItemMutation.mutateAsync(productId);
    } else {
      localCart.removeItem(productId);
    }
  };

  const clearCart = async () => {
    if (isAuthenticated) {
      await clearCartMutation.mutateAsync();
    } else {
      localCart.clearCart();
    }
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  return {
    items,
    isLoading: isAuthenticated ? cartQuery.isLoading : false,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    getTotalItems,
    isMerging: localCart.isMerging,
  };
}
