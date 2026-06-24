import { useState, useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { joinGroupSession } from '../store/slices/authSlice';
import { setLoginModalOpen, setPendingAction, addToast } from '../store/slices/uiSlice';
import * as groupApi from '../api/groups';
import { getSocket } from '../hooks/useSocket';

export function useGroupBuy(productId: number) {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const joinedGroups = useAppSelector((state) => state.auth.joinedGroups);
  const joinedCount = joinedGroups[productId];
  const hasJoined = joinedCount !== undefined;

  const [currentCount, setCurrentCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleCountUpdate = (data: { sessionId: string; count: number }) => {
      setCurrentCount(data.count);
    };

    const handleCompleted = (data: { sessionId: string }) => {
      dispatch(addToast({
        title: 'Group Deal Unlocked!',
        message: 'The target count has been reached!',
        type: 'success',
      }));
    };

    socket.on('group:count_updated', handleCountUpdate);
    socket.on('group:completed', handleCompleted);

    return () => {
      socket.off('group:count_updated', handleCountUpdate);
      socket.off('group:completed', handleCompleted);
    };
  }, [dispatch]);

  const join = useCallback(async (sessionId: string, initialCount: number) => {
    if (!user?.isLoggedIn) {
      dispatch(setPendingAction({ type: 'joinGroup', productId }));
      dispatch(setLoginModalOpen(true));
      return null;
    }

    setIsLoading(true);
    try {
      const response = await groupApi.joinGroup(sessionId);
      dispatch(joinGroupSession({ productId, initialCount }));
      dispatch(addToast({
        title: 'Joined Group!',
        message: 'Share with friends to unlock the deal!',
        type: 'success',
      }));
      return response.data;
    } catch (err: any) {
      dispatch(addToast({
        title: 'Failed to Join',
        message: err.response?.data?.error?.message || 'Something went wrong',
        type: 'error',
      }));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, user, productId]);

  const start = useCallback(async (durationHours = 24) => {
    if (!user?.isLoggedIn) {
      dispatch(setPendingAction({ type: 'startGroup', productId }));
      dispatch(setLoginModalOpen(true));
      return null;
    }

    setIsLoading(true);
    try {
      const response = await groupApi.startGroup({
        productId: String(productId),
        durationHours,
      });
      dispatch(joinGroupSession({ productId, initialCount: 1 }));
      dispatch(addToast({
        title: 'Group Started!',
        message: 'Share the link with friends to join!',
        type: 'success',
      }));
      return response.data;
    } catch (err: any) {
      dispatch(addToast({
        title: 'Failed to Start',
        message: err.response?.data?.error?.message || 'Something went wrong',
        type: 'error',
      }));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, user, productId]);

  return { joinedCount, hasJoined, currentCount, isLoading, join, start };
}
