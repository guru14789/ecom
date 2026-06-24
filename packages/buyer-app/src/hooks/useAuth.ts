import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { loginUser, logoutUser } from '../store/slices/authSlice';
import { setLoginModalOpen, setPendingAction } from '../store/slices/uiSlice';
import { onAuthChange, logOut as firebaseLogout } from '../lib/firebase/auth';

export function useAuth() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const isLoggedIn = !!user?.isLoggedIn;

  useEffect(() => {
    const unsub = onAuthChange((firebaseUser) => {
      if (firebaseUser) {
        dispatch(loginUser({
          uid: firebaseUser.uid,
          phoneNumber: firebaseUser.phoneNumber || undefined,
          email: firebaseUser.email || undefined,
          fullName: firebaseUser.displayName || undefined,
          avatar: firebaseUser.photoURL || undefined,
        }));
      }
    });
    return unsub;
  }, [dispatch]);

  const logout = useCallback(async () => {
    await firebaseLogout();
    dispatch(logoutUser());
  }, [dispatch]);

  const requireAuth = useCallback((action: { type: 'cart' | 'joinGroup' | 'startGroup'; productId: number }) => {
    if (!isLoggedIn) {
      dispatch(setPendingAction(action));
      dispatch(setLoginModalOpen(true));
      return false;
    }
    return true;
  }, [dispatch, isLoggedIn]);

  return { user, isLoggedIn, logout, requireAuth };
}
