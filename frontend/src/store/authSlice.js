import { createSlice } from '@reduxjs/toolkit';

function loadSavedAuth() {
  if (typeof window === 'undefined') return { token: null, user: null };

  for (const storage of [window.localStorage, window.sessionStorage]) {
    const token = storage.getItem('authToken');
    const savedUser = storage.getItem('authUser');
    if (!token || !savedUser) continue;

    try {
      const user = JSON.parse(savedUser);
      if (user && user.id) return { token, user };
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error;
    }
  }

  return { token: null, user: null };
}

const authSlice = createSlice({
  name: 'auth',
  initialState: loadSavedAuth(),
  reducers: {
    setAuth: (state, action) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
    },
    clearAuth: (state) => {
      state.token = null;
      state.user = null;
    }
  }
});

export const { setAuth, clearAuth } = authSlice.actions;
export default authSlice.reducer;
