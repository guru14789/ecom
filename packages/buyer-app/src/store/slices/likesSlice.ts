import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface LikesState {
  likedProductIds: number[];
}

const initialState: LikesState = {
  likedProductIds: [],
};

const likesSlice = createSlice({
  name: 'likes',
  initialState,
  reducers: {
    toggleLike: (state, action: PayloadAction<number>) => {
      const productId = action.payload;
      const index = state.likedProductIds.indexOf(productId);
      if (index >= 0) {
        state.likedProductIds.splice(index, 1);
      } else {
        state.likedProductIds.push(productId);
      }
    },
  },
});

export const { toggleLike } = likesSlice.actions;
export default likesSlice.reducer;
