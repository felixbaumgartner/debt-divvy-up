import { StateCreator } from 'zustand';
import { AppState, FriendsSlice } from '../types';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types';
import { toast } from '@/components/ui/use-toast';

export const createFriendsSlice: StateCreator<
  AppState,
  [],
  [],
  FriendsSlice
> = (set, get) => ({
  users: [],
  addUser: async (name, email, avatarUrl) => {
    if (!get().currentUser) return;

    try {
      // First create a profile if it doesn't exist
      if (email) {
        console.log("Creating profile for friend:", { name, email });
        const { data: existingProfile, error: profileCheckError } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', email)
          .maybeSingle();

        if (profileCheckError) {
          console.error('Error checking existing profile:', profileCheckError);
          throw profileCheckError;
        }

        if (!existingProfile) {
          const { data: profile, error: createProfileError } = await supabase
            .from('profiles')
            .insert({
              name,
              email,
              avatar_url: avatarUrl,
            })
            .select()
            .single();

          if (createProfileError) {
            console.error('Error creating profile:', createProfileError);
            throw createProfileError;
          }
          console.log("Created new profile:", profile);
        }
      }

      // Then add the friend record
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
        throw error;
      }

      const newUser: User = {
        id: friend.id,
        name: friend.friend_name,
        email: friend.friend_email,
        avatarUrl: friend.friend_avatar_url,
      };
      
      set((state) => ({
        users: [...state.users.filter(u => u.id !== newUser.id), newUser],
      }));
      
      return newUser;
    } catch (error) {
      console.error('Error in addUser:', error);
      toast({
        title: "Error",
        description: "Failed to add friend. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
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

      // Preserve any users that might have been added from group members
      // but aren't in the friends list
      const existingUsers = get().users;
      const friendIds = new Set(users.map(u => u.id));
      const otherUsers = existingUsers.filter(u => !friendIds.has(u.id));
      
      set({ users: [...users, ...otherUsers] });
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  },
  addUserToList: (user) => {
    if (!user || !user.id) return;
    
    set((state) => {
      // Check if user already exists to avoid duplicates
      if (state.users.some(u => u.id === user.id)) {
        return state;
      }
      return {
        users: [...state.users, user]
      };
    });
  },
  getUserById: (userId) => {
    const { users } = get();
    return users.find(u => u.id === userId);
  },
});
