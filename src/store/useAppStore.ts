
import { create } from 'zustand';
import { Group, User, Expense, Payment, DebtSummary } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { calculateBalances, calculateDebts } from '@/utils/expenseCalculator';
import { supabase } from '@/integrations/supabase/client';

interface AppState {
  currentUser: User | null;
  users: User[];
  groups: Group[];
  expenses: Expense[];
  payments: Payment[];
  
  // Active states
  activeGroupId: string | null;
  
  // Actions
  setCurrentUser: (user: User | null) => void;
  addUser: (name: string, email?: string, avatarUrl?: string) => void;
  createGroup: (name: string, description?: string) => Promise<Group | undefined>;
  addUserToGroup: (groupId: string, userId: string) => void;
  removeUserFromGroup: (groupId: string, userId: string) => void;
  addExpense: (
    groupId: string,
    description: string,
    amount: number,
    paidById: string,
    participantIds: string[],
    split?: "equal" | "custom",
    shares?: Record<string, number>
  ) => void;
  addPayment: (
    groupId: string,
    fromUserId: string,
    toUserId: string,
    amount: number
  ) => void;
  settlePayment: (paymentId: string) => void;
  setActiveGroup: (groupId: string | null) => void;
  loadFriends: () => Promise<void>;
  loadGroups: () => Promise<void>;
  
  // Computed
  getGroupExpenses: (groupId: string) => Expense[];
  getGroupUsers: (groupId: string) => User[];
  getGroupDebts: (groupId: string) => DebtSummary[];
  getUserById: (userId: string) => User | undefined;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: null,
  users: [],
  groups: [],
  expenses: [],
  payments: [],
  activeGroupId: null,
  
  // Actions
  setCurrentUser: (user) => set({ currentUser: user }),
  
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
  
  createGroup: async (name, description) => {
    const { currentUser } = get();
    
    if (!currentUser) return;
    
    try {
      console.log("Creating group:", name, description);
      
      // Create group with a generated UUID
      const groupId = uuidv4();
      
      // Create the group
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
      
      console.log("Group created successfully");
      
      // Add creator as member
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
      
      console.log("Added creator as member");
      
      // Prepare group object for the local state
      const newGroup: Group = {
        id: groupId,
        name,
        description,
        members: [currentUser],
        createdAt: new Date(),
      };
      
      // Update local state
      set((state) => ({
        groups: [...state.groups, newGroup],
      }));
      
      // Reload all groups to ensure consistency with server
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
            return {
              ...g,
              members: [...g.members, user],
            };
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
  
  addExpense: (
    groupId,
    description,
    amount,
    paidById,
    participantIds,
    split = "equal",
    shares
  ) => {
    const newExpense: Expense = {
      id: uuidv4(),
      groupId,
      description,
      amount,
      paidBy: paidById,
      participants: participantIds,
      date: new Date(),
      split,
      shares,
    };
    
    set((state) => ({
      expenses: [...state.expenses, newExpense],
    }));
    
    return newExpense;
  },
  
  addPayment: (groupId, fromUserId, toUserId, amount) => {
    const newPayment: Payment = {
      id: uuidv4(),
      groupId,
      fromUserId,
      toUserId,
      amount,
      date: new Date(),
      settled: false,
    };
    
    set((state) => ({
      payments: [...state.payments, newPayment],
    }));
    
    return newPayment;
  },
  
  settlePayment: (paymentId) => {
    set((state) => ({
      payments: state.payments.map(p => {
        if (p.id === paymentId) {
          return { ...p, settled: true };
        }
        return p;
      }),
    }));
  },
  
  setActiveGroup: (groupId) => set({ activeGroupId: groupId }),
  
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
  
  loadGroups: async () => {
    const { currentUser } = get();
    if (!currentUser) return;

    try {
      console.log("Loading groups for user:", currentUser.id);
      
      // Get user's groups using Edge Function
      const { data: groupsData, error: groupsError } = await supabase.functions.invoke('get_user_groups', {
        body: { p_user_id: currentUser.id }
      });
  
      if (groupsError) {
        console.error('Error loading groups:', groupsError);
        return;
      }
      
      console.log("Raw groups data:", groupsData);
  
      if (!groupsData || !Array.isArray(groupsData)) {
        console.log("No groups found for user");
        set({ groups: [] });
        return;
      }
  
      // Transform the data into the expected format
      const groups = await Promise.all(groupsData.map(async (groupData) => {
        console.log("Processing group data:", groupData);
        
        // Get group members using Edge Function
        const { data: membersData, error: membersError } = await supabase.functions.invoke('get_group_members', {
          body: { p_group_id: groupData.id }
        });
  
        if (membersError) {
          console.error(`Error loading members for group ${groupData.id}:`, membersError);
          return null;
        }
        
        console.log("Group members:", membersData);
  
        return {
          id: groupData.id,
          name: groupData.name,
          description: groupData.description,
          members: membersData || [],
          createdAt: new Date(groupData.created_at),
        } as Group;
      }));
  
      const validGroups = groups.filter(Boolean) as Group[];
      console.log("Final groups to set in store:", validGroups);
      set({ groups: validGroups });
    } catch (error) {
      console.error('Error in loadGroups:', error);
    }
  },
  
  // Computed values
  getGroupExpenses: (groupId) => {
    const { expenses } = get();
    return expenses.filter(e => e.groupId === groupId);
  },
  
  getGroupUsers: (groupId) => {
    const { groups } = get();
    const group = groups.find(g => g.id === groupId);
    return group ? group.members : [];
  },
  
  getGroupDebts: (groupId) => {
    const { getGroupExpenses, getGroupUsers } = get();
    const groupExpenses = getGroupExpenses(groupId);
    const groupUsers = getGroupUsers(groupId);
    
    const balances = calculateBalances(groupExpenses, groupUsers);
    return calculateDebts(balances, groupUsers);
  },
  
  getUserById: (userId) => {
    const { users } = get();
    return users.find(u => u.id === userId);
  },
}));

supabase.auth.onAuthStateChange((event, session) => {
  if (session?.user) {
    const user: User = {
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
