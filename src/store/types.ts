
import { Group, User, Expense, Payment, DebtSummary } from '@/types';

export interface AuthSlice {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
}

export interface GroupsSlice {
  groups: Group[];
  activeGroupId: string | null;
  createGroup: (name: string, description?: string) => Promise<Group | undefined>;
  addUserToGroup: (groupId: string, userId: string) => void;
  removeUserFromGroup: (groupId: string, userId: string) => void;
  setActiveGroup: (groupId: string | null) => void;
  loadGroups: () => Promise<void>;
  getGroupUsers: (groupId: string) => User[];
}

export interface ExpensesSlice {
  expenses: Expense[];
  payments: Payment[];
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
  getGroupExpenses: (groupId: string) => Expense[];
  getGroupDebts: (groupId: string) => DebtSummary[];
}

export interface FriendsSlice {
  users: User[];
  addUser: (name: string, email?: string, avatarUrl?: string) => void;
  loadFriends: () => Promise<void>;
  getUserById: (userId: string) => User | undefined;
}

export interface AppState extends 
  AuthSlice,
  GroupsSlice,
  ExpensesSlice,
  FriendsSlice {}
