
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
    const { users } = get();
    const { currentUser } = get();
    const { groups } = get();
    
    // Check if the user ID matches the current user
    if (currentUser && currentUser.id === userId) {
      return currentUser;
    }
    
    // Search among friends and other users
    const foundUser = users.find(user => user.id === userId);
    if (foundUser) return foundUser;
    
    // If not found in users array, search in group members
    for (const group of groups) {
      const groupMember = group.members.find(member => member.id === userId);
      if (groupMember) return groupMember;
    }
    
    // If user is not found anywhere
    return undefined;
  },
});
