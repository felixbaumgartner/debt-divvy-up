import { StateCreator } from 'zustand';
import { AppState, AuthSlice } from '../types';
import { supabase } from '@/integrations/supabase/client';

export const createAuthSlice: StateCreator<
  AppState,
  [],
  [],
  AuthSlice
> = (set, get) => ({
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),
  getUserById: (userId) => {
    const { friends } = get();
    const { currentUser } = get();
    
    // Check if the user ID matches the current user
    if (currentUser && currentUser.id === userId) {
      return currentUser;
    }
    
    // Otherwise, search among friends
    return friends.find(friend => friend.id === userId);
  },
});
