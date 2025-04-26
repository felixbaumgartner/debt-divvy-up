
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
    
    // Use RPC for inserting into groups table to bypass type checks
    const { error: groupError } = await supabase.rpc('create_group', {
      group_id: groupId,
      group_name: name,
      group_description: description || null,
      creator_id: currentUser.id
    });
      
    if (groupError) {
      console.error('Error creating group:', groupError);
      return;
    }
    
    // Use RPC for inserting members to bypass type checks
    const { error: memberError } = await supabase.rpc('add_group_member', {
      p_group_id: groupId,
      p_user_id: currentUser.id
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

    // Use RPC for fetching groups to bypass type checks
    const { data: userGroups, error: groupsError } = await supabase.rpc('get_user_groups', {
      p_user_id: currentUser.id
    });

    if (groupsError) {
      console.error('Error loading groups:', groupsError);
      return;
    }

    if (!userGroups || userGroups.length === 0) {
      set({ groups: [] });
      return;
    }

    // Transform the data into the expected format
    const groups = await Promise.all(userGroups.map(async (groupData) => {
      // Use RPC for fetching group members to bypass type checks
      const { data: groupMembers, error: membersError } = await supabase.rpc('get_group_members', {
        p_group_id: groupData.id
      });

      if (membersError) {
        console.error(`Error loading members for group ${groupData.id}:`, membersError);
        return null;
      }

      const memberUsers: User[] = [];
      
      // Always add current user
      memberUsers.push(currentUser);

      // Add other members (friends)
      if (groupMembers && groupMembers.length > 0) {
        const otherMemberIds = groupMembers
          .filter(m => m.user_id !== currentUser.id)
          .map(m => m.user_id);

        if (otherMemberIds.length > 0) {
          const { data: friends, error: friendsError } = await supabase
            .from('friends')
            .select('*')
            .eq('user_id', currentUser.id)
            .in('id', otherMemberIds);

          if (!friendsError && friends && friends.length > 0) {
            const friendUsers = friends.map(friend => ({
              id: friend.id,
              name: friend.friend_name,
              email: friend.friend_email,
              avatarUrl: friend.friend_avatar_url,
            }));
            memberUsers.push(...friendUsers);
          }
        }
      }

      return {
        id: groupData.id,
        name: groupData.name,
        description: groupData.description,
        members: memberUsers,
        createdAt: new Date(groupData.created_at),
      } as Group;
    }));

    const validGroups = groups.filter(Boolean) as Group[];
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
