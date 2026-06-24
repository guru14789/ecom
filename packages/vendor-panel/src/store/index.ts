import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

interface VendorState {
  user: { id: string; name: string; email: string; storeName: string } | null;
  subscription: { tier: string; status: string; productLimit: number } | null;
  stats: { totalProducts: number; totalOrders: number; totalEarnings: number; pendingPayouts: number } | null;
}

const initialState: VendorState = {
  user: null,
  subscription: null,
  stats: null,
};

const vendorReducer = (state = initialState, action: any): VendorState => {
  switch (action.type) {
    case 'SET_VENDOR_USER':
      return { ...state, user: action.payload };
    case 'SET_SUBSCRIPTION':
      return { ...state, subscription: action.payload };
    case 'SET_STATS':
      return { ...state, stats: action.payload };
    case 'LOGOUT':
      return initialState;
    default:
      return state;
  }
};

export const store = configureStore({
  reducer: { vendor: vendorReducer },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
