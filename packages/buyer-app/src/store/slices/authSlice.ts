import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Address, AuthUser, Order } from '../../types';

interface AuthState {
  user: AuthUser | null;
  firebaseUid: string | null;
  addresses: Address[];
  orders: Order[];
  walletBalance: number;
  joinedGroups: Record<number, number>;
  referralCode: string;
  referredCount: number;
}

const initialState: AuthState = {
  user: null,
  firebaseUid: null,
  addresses: [],
  orders: [],
  walletBalance: 0,
  joinedGroups: {},
  referralCode: '',
  referredCount: 0,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginUser: (state, action: PayloadAction<{
      uid: string;
      phoneNumber?: string;
      email?: string;
      fullName?: string;
      avatar?: string;
    }>) => {
      state.firebaseUid = action.payload.uid;
      state.user = {
        id: action.payload.uid,
        phoneNumber: action.payload.phoneNumber || '',
        email: action.payload.email,
        fullName: action.payload.fullName || 'Guest User',
        avatar: action.payload.avatar,
        isLoggedIn: true,
      };
    },
    logoutUser: (state) => {
      state.user = null;
      state.firebaseUid = null;
      state.addresses = [];
      state.orders = [];
      state.walletBalance = 0;
      state.referralCode = '';
      state.referredCount = 0;
    },
    setUserProfile: (state, action: PayloadAction<{
      addresses?: Address[];
      fullName?: string;
      avatar?: string;
    }>) => {
      if (state.user) {
        if (action.payload.fullName) state.user.fullName = action.payload.fullName;
        if (action.payload.avatar) state.user.avatar = action.payload.avatar;
      }
      if (action.payload.addresses) state.addresses = action.payload.addresses;
    },
    addAddress: (state, action: PayloadAction<Address>) => {
      state.addresses.push(action.payload);
    },
    removeAddress: (state, action: PayloadAction<number>) => {
      state.addresses.splice(action.payload, 1);
    },
    addOrder: (state, action: PayloadAction<Order>) => {
      state.orders.unshift(action.payload);
    },
    updateOrderStatus: (state, action: PayloadAction<{ orderId: string; status: Order['status'] }>) => {
      const order = state.orders.find(o => o.id === action.payload.orderId);
      if (order) {
        order.status = action.payload.status;
      }
    },
    joinGroupSession: (state, action: PayloadAction<{ productId: number; initialCount: number }>) => {
      const { productId, initialCount } = action.payload;
      if (state.joinedGroups[productId] === undefined) {
        state.joinedGroups[productId] = initialCount + 1;
      }
    },
    addWalletCredits: (state, action: PayloadAction<number>) => {
      state.walletBalance += action.payload;
    },
    deductWalletCredits: (state, action: PayloadAction<number>) => {
      state.walletBalance = Math.max(0, state.walletBalance - action.payload);
    },
  },
});

export const {
  loginUser,
  logoutUser,
  setUserProfile,
  addAddress,
  removeAddress,
  addOrder,
  updateOrderStatus,
  joinGroupSession,
  addWalletCredits,
  deductWalletCredits,
} = authSlice.actions;
export default authSlice.reducer;
