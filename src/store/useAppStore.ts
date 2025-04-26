
import { create } from 'zustand';
import { AppState } from './types';
import { createAuthSlice } from './slices/authSlice';
import { createGroupsSlice } from './slices/groupsSlice';
import { createExpensesSlice } from './slices/expensesSlice';
import { createFriendsSlice } from './slices/friendsSlice';
import { createSelectors } from './utils/createSelectors';
import { supabase } from '@/integrations/supabase/client';

const useAppStoreBase = create<AppState>()((...a) => ({
  ...createAuthSlice(...a),
  ...createGroupsSlice(...a),
  ...createExpensesSlice(...a),
  ...createFriendsSlice(...a),
}));

export const useAppStore = createSelectors(useAppStoreBase);

// Set up auth state change listener
supabase.auth.onAuthStateChange((event, session) => {
  if (session?.user) {
    const user = {
      id: session.user.id,
      name: session.user.user_metadata.name || 'User',
      email: session.user.email || '',
      avatarUrl: session.user.user_metadata.avatar_url,
    };
    useAppStore.getState().setCurrentUser(user);
    
    // Load user data
    useAppStore.getState().loadFriends();
    useAppStore.getState().loadGroups();
  } else {
    useAppStore.getState().setCurrentUser(null);
  }
});
