import { createSlice } from '@reduxjs/toolkit';

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: []
  },
  reducers: {
    // Add item to cart or increment quantity if it already exists
    addToCart: (state, action) => {
      const product = action.payload;
      const selectedSize = product.size || 'M';
      const existingItem = state.items.find(
        (item) => item.id === product.id && item.size === selectedSize
      );

      if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 1) + 1;
      } else {
        state.items.push({
          ...product,
          size: selectedSize,
          quantity: 1
        });
      }
    },

    // Update quantity (+1 or -1)
    updateQuantity: (state, action) => {
      const { id, delta } = action.payload;
      const item = state.items.find((i) => i.id === id);
      if (item) {
        const newQty = (item.quantity || 1) + delta;
        item.quantity = newQty > 0 ? newQty : 1;
      }
    },

    // Remove item from cart
    removeFromCart: (state, action) => {
      const id = action.payload;
      state.items = state.items.filter((item) => item.id !== id);
    },

    // Clear cart after checkout
    clearCart: (state) => {
      state.items = [];
    }
  }
});

export const { addToCart, updateQuantity, removeFromCart, clearCart } = cartSlice.actions;
export default cartSlice.reducer;