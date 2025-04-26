import { StateCreator } from 'zustand';
import { AppState, GroupsSlice } from '../types';
import { Group } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { toast } from '@/components/ui/use-toast';

export const createGroupsSlice: StateCreator<
  AppState,
  [],
  [],
  GroupsSlice
> = (set, get) => ({
  groups: [],
  activeGroupId: null,
  createGroup: async (name, description) => {
    const { currentUser } = get();
    if (!currentUser) return;

    try {
      console.log("Creating group:", name, description);
      const groupId = uuidv4();
      
      const { error: groupError } = await supabase
        .from('groups')
        .insert({
          id: groupId,
          name,
          description,
          created_by: currentUser.id
        });
        
      if (groupError) {
        console.error('Error creating group:', groupError);
        throw groupError;
      }
      
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: currentUser.id
        });
        
      if (memberError) {
        console.error('Error adding member to group:', memberError);
        throw memberError;
      }
      
      const newGroup: Group = {
        id: groupId,
        name,
        description,
        members: [currentUser],
        createdAt: new Date(),
      };
      
      set((state) => ({
        groups: [...state.groups, newGroup],
      }));
      
      await get().loadGroups();
      return newGroup;
    } catch (error) {
      console.error('Error in createGroup:', error);
      throw error;
    }
  },
  addUserToGroup: (groupId, userId) => {
    set((state) => {
      const user = state.users.find(u => u.id === userId);
      if (!user) return state;
      
      return {
        groups: state.groups.map(g => {
          if (g.id === groupId && !g.members.some(m => m.id === userId)) {
            return { ...g, members: [...g.members, user] };
          }
          return g;
        }),
      };
    });
  },
  removeUserFromGroup: (groupId, userId) => {
    set((state) => ({
      groups: state.groups.map(g => {
        if (g.id === groupId) {
          return {
            ...g,
            members: g.members.filter(m => m.id !== userId),
          };
        }
        return g;
      }),
    }));
  },
  setActiveGroup: (groupId) => {
    console.log('Setting active group:', groupId);
    set({ activeGroupId: groupId });
  },
  loadGroups: async () => {
    const { currentUser } = get();
    if (!currentUser) return;

    try {
      const { data: groupsData, error: groupsError } = await supabase.functions.invoke('get_user_groups', {
        body: { p_user_id: currentUser.id }
      });
  
      if (groupsError) {
        console.error('Error loading groups:', groupsError);
        return;
      }
  
      if (!groupsData || !Array.isArray(groupsData)) {
        set({ groups: [] });
        return;
      }
  
      const groups = await Promise.all(groupsData.map(async (groupData) => {
        const { data: membersData, error: membersError } = await supabase.functions.invoke('get_group_members', {
          body: { p_group_id: groupData.id }
        });
  
        if (membersError) {
          console.error(`Error loading members for group ${groupData.id}:`, membersError);
          return null;
        }
  
        return {
          id: groupData.id,
          name: groupData.name,
          description: groupData.description,
          members: membersData || [],
          createdAt: new Date(groupData.created_at),
        } as Group;
      }));
  
      const validGroups = groups.filter(Boolean) as Group[];
      set({ groups: validGroups });
    } catch (error) {
      console.error('Error in loadGroups:', error);
    }
  },
  getGroupUsers: (groupId) => {
    const { groups } = get();
    const group = groups.find(g => g.id === groupId);
    return group ? group.members : [];
  },
  deleteGroup: async (groupId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('groups')
        .delete()
        .eq('id', groupId);

      if (deleteError) {
        console.error('Error deleting group:', deleteError);
        toast({
          title: "Error",
          description: "Failed to delete group",
          variant: "destructive",
        });
        throw deleteError;
      }

      set((state) => ({
        groups: state.groups.filter(g => g.id !== groupId),
        activeGroupId: state.activeGroupId === groupId ? null : state.activeGroupId
      }));

      toast({
        title: "Success",
        description: "Group deleted successfully",
      });
    } catch (error) {
      console.error('Error in deleteGroup:', error);
      throw error;
    }
  },
});
