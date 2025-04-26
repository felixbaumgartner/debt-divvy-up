
import { StateCreator } from 'zustand';
import { AppState, FriendsSlice } from '../types';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types';

export const createFriendsSlice: StateCreator<
  AppState,
  [],
  [],
  FriendsSlice
> = (set, get) => ({
  users: [],
  addUser: async (name, email, avatarUrl) => {
    if (!get().currentUser) return;

    const { data: friend, error } = await supabase
      .from('friends')
      .insert({
        user_id: get().currentUser.id,
        friend_name: name,
        friend_email: email,
        friend_avatar_url: avatarUrl,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding friend:', error);
      return;
    }

    const newUser: User = {
      id: friend.id,
      name: friend.friend_name,
      email: friend.friend_email,
      avatarUrl: friend.friend_avatar_url,
    };
    
    set((state) => ({
      users: [...state.users, newUser],
    }));
    
    return newUser;
  },
  loadFriends: async () => {
    const { currentUser } = get();
    if (!currentUser) return;

    try {
      const { data: friends, error } = await supabase
        .from('friends')
        .select('*')
        .eq('user_id', currentUser.id);

      if (error) {
        console.error('Error loading friends:', error);
        return;
      }

      const users = friends.map((friend): User => ({
        id: friend.id,
        name: friend.friend_name,
        email: friend.friend_email,
        avatarUrl: friend.friend_avatar_url,
      }));

      set({ users });
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  },
  getUserById: (userId) => {
    const { users } = get();
    return users.find(u => u.id === userId);
  },
});
