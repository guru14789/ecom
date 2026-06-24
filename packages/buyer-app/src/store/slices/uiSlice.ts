import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface UIState {
  isCartOpen: boolean;
  isProfileOpen: boolean;
  isLoginModalOpen: boolean;
  isAddressModalOpen: boolean;
  pendingAction: { type: 'cart' | 'joinGroup' | 'startGroup'; productId: number } | null;
  toasts: ToastMessage[];
}

const initialState: UIState = {
  isCartOpen: false,
  isProfileOpen: false,
  isLoginModalOpen: false,
  isAddressModalOpen: false,
  pendingAction: null,
  toasts: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setCartOpen: (state, action: PayloadAction<boolean>) => {
      state.isCartOpen = action.payload;
    },
    setProfileOpen: (state, action: PayloadAction<boolean>) => {
      state.isProfileOpen = action.payload;
    },
    setLoginModalOpen: (state, action: PayloadAction<boolean>) => {
      state.isLoginModalOpen = action.payload;
    },
    setAddressModalOpen: (state, action: PayloadAction<boolean>) => {
      state.isAddressModalOpen = action.payload;
    },
    setPendingAction: (
      state,
      action: PayloadAction<UIState['pendingAction']>
    ) => {
      state.pendingAction = action.payload;
    },
    addToast: (state, action: PayloadAction<Omit<ToastMessage, 'id'>>) => {
      const id = Math.random().toString(36).substring(7);
      state.toasts.push({ ...action.payload, id });
    },
    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
  },
});

export const {
  setCartOpen,
  setProfileOpen,
  setLoginModalOpen,
  setAddressModalOpen,
  setPendingAction,
  addToast,
  removeToast,
} = uiSlice.actions;
export default uiSlice.reducer;
