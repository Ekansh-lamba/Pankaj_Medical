import { create } from 'zustand';
import api from '../services/api';

// Helper to calculate totals for guest cart locally
const calculateGuestTotals = (items) => {
  let subtotal = 0;
  let hasRxItems = false;
  let hasOtcItems = false;
  let itemCount = 0;

  items.forEach(item => {
    subtotal += item.sellingPrice * item.quantity;
    itemCount += item.quantity;
    if (item.rxType === 'H' || item.rxType === 'NRX') {
      hasRxItems = true;
    } else {
      hasOtcItems = true;
    }
  });

  const deliveryCharge = itemCount === 0 ? 0 : (subtotal >= 500 ? 0 : 50);
  const grandTotal = subtotal + deliveryCharge;

  return {
    items,
    subtotal,
    hasRxItems,
    hasOtcItems,
    itemCount,
    deliveryCharge,
    grandTotal
  };
};

export const useCartStore = create((set, get) => ({
  items: [],
  subtotal: 0,
  grandTotal: 0,
  deliveryCharge: 0,
  hasRxItems: false,
  hasOtcItems: false,
  itemCount: 0,
  loading: false,

  // Loads cart from DB if logged in, else from localStorage
  fetchCart: async (isAuthenticated = false) => {
    set({ loading: true });
    try {
      if (isAuthenticated) {
        const res = await api.get('/api/cart');
        if (res.data && res.data.success) {
          set({ ...res.data.data, loading: false });
        }
      } else {
        const guestCartData = localStorage.getItem('pankaj_guest_cart');
        const items = guestCartData ? JSON.parse(guestCartData) : [];
        const totals = calculateGuestTotals(items);
        set({ ...totals, loading: false });
      }
    } catch (err) {
      console.error('Fetch cart failed:', err);
      set({ loading: false });
    }
  },

  // Add to cart action
  addToCart: async (product, quantity = 1, isAuthenticated = false) => {
    set({ loading: true });
    try {
      if (isAuthenticated) {
        const res = await api.post('/api/cart/add', { productId: product._id, quantity });
        if (res.data && res.data.success) {
          set({ ...res.data.data, loading: false });
          return { success: true, message: res.data.message };
        }
      } else {
        // Guest cart local state
        const items = [...get().items];
        const existingIndex = items.findIndex(item => item.product.toString() === product._id.toString());
        let targetQty = quantity;

        if (existingIndex > -1) {
          targetQty += items[existingIndex].quantity;
        }

        // Apply product-specific maximum ordering limits
        const isRx = product.rxType === 'H' || product.rxType === 'NRX';
        const maxLimit = isRx ? 2 : 10;
        
        if (targetQty > maxLimit) {
          set({ loading: false });
          return { success: false, message: `Maximum allowed limit for this medicine is ${maxLimit} units per order.` };
        }

        if (product.stock < targetQty) {
          set({ loading: false });
          return { success: false, message: `Only ${product.stock} units available in stock.` };
        }

        if (existingIndex > -1) {
          items[existingIndex].quantity = targetQty;
        } else {
          items.push({
            product: product._id,
            name: product.name,
            mrp: product.mrp,
            sellingPrice: product.sellingPrice,
            rxType: product.rxType,
            image: product.image,
            quantity: targetQty
          });
        }

        localStorage.setItem('pankaj_guest_cart', JSON.stringify(items));
        const totals = calculateGuestTotals(items);
        set({ ...totals, loading: false });
        return { success: true, message: 'Added to cart successfully' };
      }
    } catch (err) {
      console.error('Add to cart failed:', err);
      set({ loading: false });
      return { success: false, message: err.response?.data?.message || 'Server error' };
    }
  },

  // Update item quantity
  updateQuantity: async (productId, quantity, isAuthenticated = false) => {
    set({ loading: true });
    try {
      if (isAuthenticated) {
        const res = await api.put('/api/cart/update', { productId, quantity });
        if (res.data && res.data.success) {
          set({ ...res.data.data, loading: false });
          return { success: true };
        }
      } else {
        const items = [...get().items];
        const index = items.findIndex(item => item.product.toString() === productId.toString());
        if (index > -1) {
          items[index].quantity = quantity;
          localStorage.setItem('pankaj_guest_cart', JSON.stringify(items));
          const totals = calculateGuestTotals(items);
          set({ ...totals, loading: false });
          return { success: true };
        }
      }
    } catch (err) {
      console.error('Update quantity failed:', err);
      set({ loading: false });
      return { success: false, message: err.response?.data?.message || 'Server error' };
    }
  },

  // Remove single item
  removeFromCart: async (productId, isAuthenticated = false) => {
    set({ loading: true });
    try {
      if (isAuthenticated) {
        const res = await api.delete(`/api/cart/remove/${productId}`);
        if (res.data && res.data.success) {
          set({ ...res.data.data, loading: false });
          return { success: true };
        }
      } else {
        const items = get().items.filter(item => item.product.toString() !== productId.toString());
        localStorage.setItem('pankaj_guest_cart', JSON.stringify(items));
        const totals = calculateGuestTotals(items);
        set({ ...totals, loading: false });
        return { success: true };
      }
    } catch (err) {
      console.error('Remove item failed:', err);
      set({ loading: false });
      return { success: false, message: err.response?.data?.message || 'Server error' };
    }
  },

  // Sync guest cart to database on login
  syncGuestCart: async () => {
    const guestCartData = localStorage.getItem('pankaj_guest_cart');
    const items = guestCartData ? JSON.parse(guestCartData) : [];
    
    if (items.length === 0) return;

    set({ loading: true });
    try {
      const payload = items.map(item => ({ productId: item.product, quantity: item.quantity }));
      const res = await api.post('/api/cart/sync', { items: payload });
      if (res.data && res.data.success) {
        localStorage.removeItem('pankaj_guest_cart');
        set({ ...res.data.data, loading: false });
      }
    } catch (err) {
      console.error('Sync guest cart failed:', err);
      set({ loading: false });
    }
  },

  // Clear entire cart
  clearCart: async (isAuthenticated = false) => {
    set({ loading: true });
    try {
      if (isAuthenticated) {
        const res = await api.delete('/api/cart/clear');
        if (res.data && res.data.success) {
          set({ ...res.data.data, loading: false });
        }
      } else {
        localStorage.removeItem('pankaj_guest_cart');
        set({
          items: [],
          subtotal: 0,
          grandTotal: 0,
          deliveryCharge: 0,
          hasRxItems: false,
          hasOtcItems: false,
          itemCount: 0,
          loading: false
        });
      }
    } catch (err) {
      console.error('Clear cart failed:', err);
      set({ loading: false });
    }
  }
}));

