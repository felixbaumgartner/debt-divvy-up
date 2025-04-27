import { StateCreator } from 'zustand';
import { AppState, FriendsSlice } from '../types';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types';
import { toast } from '@/components/ui/use-toast';
import { v4 as uuidv4 } from 'uuid';

export const createFriendsSlice: StateCreator<
  AppState,
  [],
  [],
  FriendsSlice
> = (set, get) => ({
  users: [],
  friends: [], // Initialize empty friends array
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
          const profileId = uuidv4();
          
          const { data: profile, error: createProfileError } = await supabase
            .from('profiles')
            .insert({
              id: profileId,
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
        friends: [...state.friends.filter(f => f.id !== newUser.id), newUser],
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

      const friendUsers = friends.map((friend): User => ({
        id: friend.id,
        name: friend.friend_name,
        email: friend.friend_email,
        avatarUrl: friend.friend_avatar_url,
      }));

      // Preserve any users that might have been added from group members
      // but aren't in the friends list
      const existingUsers = get().users;
      const friendIds = new Set(friendUsers.map(u => u.id));
      const otherUsers = existingUsers.filter(u => !friendIds.has(u.id));
      
      set({ 
        users: [...friendUsers, ...otherUsers],
        friends: friendUsers, // Set the friends array separately
      });
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
  deleteFriend: async (friendId: string) => {
    try {
      const { error } = await supabase
        .from('friends')
        .delete()
        .eq('id', friendId);

      if (error) {
        console.error('Error deleting friend:', error);
        throw error;
      }

      // Update local state
      set((state) => ({
        friends: state.friends.filter(friend => friend.id !== friendId),
        // Keep the user in the users array as they might be needed for groups
        users: state.users
      }));

      toast({
        title: "Success",
        description: "Friend removed successfully",
      });
    } catch (error) {
      console.error('Error in deleteFriend:', error);
      toast({
        title: "Error",
        description: "Failed to remove friend",
        variant: "destructive",
      });
      throw error;
    }
  },
});
