
import { create } from 'zustand';
import { Group, User, Expense, Payment, DebtSummary } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { calculateBalances, calculateDebts } from '@/utils/expenseCalculator';

interface AppState {
  // Data
  currentUser: User;
  users: User[];
  groups: Group[];
  expenses: Expense[];
  payments: Payment[];
  
  // Active states
  activeGroupId: string | null;
  
  // Actions
  setCurrentUser: (user: User) => void;
  addUser: (name: string, email?: string, avatarUrl?: string) => void;
  createGroup: (name: string, description?: string) => void;
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
  
  // Computed
  getGroupExpenses: (groupId: string) => Expense[];
  getGroupUsers: (groupId: string) => User[];
  getGroupDebts: (groupId: string) => DebtSummary[];
  getUserById: (userId: string) => User | undefined;
}

// Create sample user as a placeholder
const demoUser: User = {
  id: 'user-1',
  name: 'Demo User',
  email: 'demo@example.com',
  avatarUrl: '',
};

// Create sample friend
const demoFriend: User = {
  id: 'user-2',
  name: 'Friend',
  email: 'friend@example.com',
  avatarUrl: '',
};

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  currentUser: demoUser,
  users: [demoUser, demoFriend],
  groups: [],
  expenses: [],
  payments: [],
  activeGroupId: null,
  
  // Actions
  setCurrentUser: (user) => set({ currentUser: user }),
  
  addUser: (name, email, avatarUrl) => {
    const newUser: User = {
      id: uuidv4(),
      name,
      email,
      avatarUrl,
    };
    
    set((state) => ({
      users: [...state.users, newUser],
    }));
    
    return newUser;
  },
  
  createGroup: (name, description) => {
    const { currentUser, users } = get();
    
    const newGroup: Group = {
      id: uuidv4(),
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
