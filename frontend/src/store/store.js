import { configureStore } from '@reduxjs/toolkit';
import cartReducer from './cartSlice';
import authReducer from './authSlice';

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    auth: authReducer
  }
});

if (typeof window !== 'undefined') {
  store.subscribe(() => {
    window.localStorage.setItem('cartItems', JSON.stringify(store.getState().cart.items));
  });
}