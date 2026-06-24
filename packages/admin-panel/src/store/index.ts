import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AdminState {
  user: AdminUser | null;
}

const initialState: AdminState = {
  user: null,
};

const adminReducer = (state = initialState, action: any): AdminState => {
  switch (action.type) {
    case 'SET_ADMIN_USER':
      return { ...state, user: action.payload };
    case 'LOGOUT':
      return initialState;
    default:
      return state;
  }
};

export const store = configureStore({
  reducer: { admin: adminReducer },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
