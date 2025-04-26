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
    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to create a group",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log("Creating group:", name, description);
      const groupId = uuidv4();
      
      const { data, error } = await supabase.functions.invoke('create_group', {
        body: { 
          group_id: groupId,
          group_name: name,
          group_description: description,
          creator_id: currentUser.id
        }
      });
        
      if (error) {
        console.error('Error creating group:', error);
        toast({
          title: "Error",
          description: "Failed to create group",
          variant: "destructive",
        });
        throw error;
      }
      
      if (!data?.success) {
        console.error('Error creating group:', data?.error || 'Unknown error');
        toast({
          title: "Error",
          description: "Failed to create group",
          variant: "destructive",
        });
        throw new Error(data?.error || 'Unknown error');
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
      
      // Refresh groups from database to ensure we have latest data
      await get().loadGroups();
      
      toast({
        title: "Success",
        description: "Group created successfully",
      });
      
      return newGroup;
    } catch (error) {
      console.error('Error in createGroup:', error);
      throw error;
    }
  },
  addUserToGroup: async (groupId, userId) => {
    try {
      const user = get().users.find(u => u.id === userId);
      const group = get().groups.find(g => g.id === groupId);
      const currentUser = get().currentUser;
      
      if (!user || !group || !currentUser) {
        console.error('Missing required data:', { user, group, currentUser });
        toast({
          title: "Error",
          description: "Missing user or group data",
          variant: "destructive",
        });
        return;
      }

      console.log('Adding user to group:', { userId, groupId });

      // First try to ensure the user exists in the database
      try {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            name: user.name,
            email: user.email
          }, { onConflict: 'id' });

        if (profileError) {
          console.log('Note: Could not create user profile:', profileError);
          // Continue anyway as the user might already exist
        }
      } catch (profileErr) {
        console.warn('Could not ensure user profile exists:', profileErr);
        // Continue anyway as the user might already exist
      }
      
      // Now add the user to the group in the database
      const { error } = await supabase
        .functions.invoke('add_group_member', {
          body: {
            p_group_id: groupId,
            p_user_id: userId
          }
        });

      if (error) {
        console.error('Error adding user to group:', error);
        toast({
          title: "Error",
          description: "Failed to add user to group. Database error occurred.",
          variant: "destructive",
        });
        return;
      }

      // If we got here, the user was added to the group successfully
      // Now send email notification if the user has an email
      if (user.email) {
        try {
          console.log('Sending email notification to:', user.email);
          const emailResponse = await supabase.functions.invoke('send-group-invite', {
            body: {
              friendName: user.name || 'there',
              friendEmail: user.email,
              groupName: group.name,
              inviterName: currentUser.name || 'Someone'
            }
          });
          
          if (emailResponse.error) {
            console.error('Error sending invitation email:', emailResponse.error);
            toast({
              title: "Warning",
              description: "User added to group but invitation email could not be sent",
              variant: "destructive",
            });
          } else {
            console.log('Email notification sent successfully');
          }
        } catch (emailError) {
          console.error('Exception sending invitation email:', emailError);
          toast({
            title: "Warning",
            description: "User added to group but invitation email could not be sent",
            variant: "destructive",
          });
        }
      } else {
        console.log('No email available for user, skipping notification');
      }

      // Update local state
      set((state) => ({
        groups: state.groups.map(g => {
          if (g.id === groupId && !g.members.some(m => m.id === userId)) {
            return { ...g, members: [...g.members, user] };
          }
          return g;
        }),
      }));

      toast({
        title: "Success",
        description: `${user.name} has been added to the group`,
      });
    } catch (error) {
      console.error('Error in addUserToGroup:', error);
      toast({
        title: "Error",
        description: "Failed to add user to group",
        variant: "destructive",
      });
    }
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
      // Clear existing groups first to avoid stale data
      set({ groups: [] });
      
      console.log("Loading groups for user:", currentUser.id);
      
      const { data: groupsData, error: groupsError } = await supabase.functions.invoke('get_user_groups', {
        body: { p_user_id: currentUser.id }
      });
  
      if (groupsError) {
        console.error('Error loading groups:', groupsError);
        toast({
          title: "Error",
          description: "Failed to load groups",
          variant: "destructive",
        });
        return;
      }
  
      if (!groupsData || !Array.isArray(groupsData)) {
        console.log("No groups found or invalid data format");
        set({ groups: [] });
        return;
      }
      
      // Filter out any deleted groups
      const activeGroupsData = groupsData.filter(group => group && !group.deleted_at);
      console.log(`Found ${groupsData.length} groups, ${activeGroupsData.length} active`);
  
      const groups = await Promise.all(activeGroupsData.map(async (groupData) => {
        const { data: membersData, error: membersError } = await supabase.functions.invoke('get_group_members', {
          body: { p_group_id: groupData.id }
        });
  
        if (membersError) {
          console.error(`Error loading members for group ${groupData.id}:`, membersError);
          return null;
        }

        // Add all group members to the users list for global access
        if (membersData && Array.isArray(membersData)) {
          membersData.forEach(member => {
            if (member && member.id) {
              get().addUserToList(member);
            }
          });
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
      console.log("Loaded groups:", validGroups.length);
      set({ groups: validGroups });
    } catch (error) {
      console.error('Error in loadGroups:', error);
      toast({
        title: "Error",
        description: "Failed to load groups",
        variant: "destructive",
      });
    }
  },
  getGroupUsers: (groupId) => {
    const { groups } = get();
    const group = groups.find(g => g.id === groupId);
    return group ? group.members : [];
  },
  deleteGroup: async (groupId: string) => {
    try {
      // First update the database
      const { error: deleteError } = await supabase.functions.invoke('soft_delete_group', {
        body: { 
          group_id: groupId,
          deleted_at: new Date().toISOString()
        }
      });

      if (deleteError) {
        console.error('Error deleting group:', deleteError);
        toast({
          title: "Error",
          description: "Failed to delete group",
          variant: "destructive",
        });
        throw deleteError;
      }

      // Immediately update local state
      set((state) => ({
        groups: state.groups.filter(g => g.id !== groupId),
        activeGroupId: state.activeGroupId === groupId ? null : state.activeGroupId
      }));

      // Trigger a fresh load of groups to ensure sync
      await get().loadGroups();

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
