
// Define core types for our expense splitting app

export type User = {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
};

export type Group = {
  id: string;
  name: string;
  members: User[];
  createdAt: Date;
  description?: string;
};

export type Expense = {
  id: string;
  groupId: string;
  description: string;
  amount: number;
  paidBy: string; // User ID
  participants: string[]; // User IDs
  date: Date;
  split: "equal" | "custom"; // For future support of custom splits
  shares?: Record<string, number>; // For custom splits
};

export type Payment = {
  id: string;
  groupId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  date: Date;
  settled: boolean;
};

export type Balance = {
  userId: string;
  amount: number; // Positive means they're owed money, negative means they owe
};

export type DebtSummary = {
  fromUserId: string;
  toUserId: string;
  amount: number;
};
