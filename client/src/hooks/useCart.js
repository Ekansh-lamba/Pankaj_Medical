import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';

export const useCart = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const cartStore = useCartStore();

  const handleFetchCart = () => {
    return cartStore.fetchCart(isAuthenticated);
  };

  const handleAddToCart = (product, quantity = 1) => {
    return cartStore.addToCart(product, quantity, isAuthenticated);
  };

  const handleUpdateQuantity = (productId, quantity) => {
    return cartStore.updateQuantity(productId, quantity, isAuthenticated);
  };

  const handleRemoveFromCart = (productId) => {
    return cartStore.removeFromCart(productId, isAuthenticated);
  };

  const handleClearCart = () => {
    return cartStore.clearCart(isAuthenticated);
  };

  return {
    items: cartStore.items,
    subtotal: cartStore.subtotal,
    grandTotal: cartStore.grandTotal,
    deliveryCharge: cartStore.deliveryCharge,
    hasRxItems: cartStore.hasRxItems,
    hasOtcItems: cartStore.hasOtcItems,
    itemCount: cartStore.itemCount,
    loading: cartStore.loading,
    fetchCart: handleFetchCart,
    addToCart: handleAddToCart,
    updateQuantity: handleUpdateQuantity,
    removeFromCart: handleRemoveFromCart,
    clearCart: handleClearCart,
    syncGuestCart: cartStore.syncGuestCart
  };
};
