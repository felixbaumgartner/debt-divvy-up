import { Group, User, Expense, Payment, DebtSummary } from '@/types';

export interface AuthSlice {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  getUserById: (userId: string) => User | undefined;
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
  deleteGroup: (groupId: string) => Promise<void>;
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
  ) => Promise<Expense | undefined>;
  addPayment: (
    groupId: string,
    fromUserId: string,
    toUserId: string,
    amount: number
  ) => Promise<Payment | undefined>;
  settlePayment: (paymentId: string) => Promise<void>;
  getGroupExpenses: (groupId: string | null) => Promise<Expense[]>;
  getGroupDebts: (groupId: string) => DebtSummary[];
}

export interface FriendsSlice {
  users: User[];
  friends: User[];  // Add this new array for actual friends
  addUser: (name: string, email?: string, avatarUrl?: string) => void;
  loadFriends: () => Promise<void>;
  getUserById: (userId: string) => User | undefined;
  addUserToList: (user: User) => void;
  deleteFriend: (friendId: string) => Promise<void>;
}

export interface AppState extends 
  AuthSlice,
  GroupsSlice,
  ExpensesSlice,
  FriendsSlice {}
