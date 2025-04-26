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
    
    const groupId = uuidv4();
    
    // Create the group in Supabase
    const { data: groupData, error } = await supabase
      .from('groups')
      .insert({
        id: groupId,
        name,
        description,
        created_by: currentUser.id,
      })
      .select()
      .single();
      
    if (error) {
      console.error('Error creating group:', error);
      return;
    }
    
    // Add the current user as a member of the group
    const { error: memberError } = await supabase
      .from('group_members')
      .insert({
        group_id: groupId,
        user_id: currentUser.id
      });
      
    if (memberError) {
      console.error('Error adding member to group:', memberError);
      return;
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
      activeGroupId: newGroup.id,
    }));
    
    return newGroup;
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
    split: "equal" | "custom" = "equal",
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
  },
  
  loadGroups: async () => {
    const { currentUser } = get();
    if (!currentUser) return;

    // Get groups where the user is a member
    const { data: groupMembers, error: memberError } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', currentUser.id);

    if (memberError) {
      console.error('Error loading group members:', memberError);
      return;
    }

    if (!groupMembers.length) {
      set({ groups: [] });
      return;
    }

    const groupIds = groupMembers.map(member => member.group_id);

    // Get group details
    const { data: groups, error: groupsError } = await supabase
      .from('groups')
      .select('*')
      .in('id', groupIds);

    if (groupsError) {
      console.error('Error loading groups:', groupsError);
      return;
    }

    // For each group, get its members
    const groupsWithMembers = await Promise.all(groups.map(async (group) => {
      const { data: members, error: membersError } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', group.id);

      if (membersError) {
        console.error(`Error loading members for group ${group.id}:`, membersError);
        return null;
      }

      // Get user details for each member
      const memberIds = members.map(m => m.user_id);
      let memberUsers: User[] = [currentUser];

      if (memberIds.length > 1) {
        // Get friends who are members of this group
        const { data: friends, error: friendsError } = await supabase
          .from('friends')
          .select('*')
          .eq('user_id', currentUser.id)
          .in('id', memberIds.filter(id => id !== currentUser.id));

        if (!friendsError && friends) {
          const friendUsers = friends.map(friend => ({
            id: friend.id,
            name: friend.friend_name,
            email: friend.friend_email,
            avatarUrl: friend.friend_avatar_url,
          }));
          memberUsers = [...memberUsers, ...friendUsers];
        }
      }

      return {
        id: group.id,
        name: group.name,
        description: group.description,
        members: memberUsers,
        createdAt: new Date(group.created_at),
      } as Group;
    }));

    const validGroups = groupsWithMembers.filter(Boolean) as Group[];
    set({ groups: validGroups });
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
