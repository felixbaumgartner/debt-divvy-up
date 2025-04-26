
import { StateCreator } from 'zustand';
import { AppState, ExpensesSlice } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { calculateBalances, calculateDebts } from '@/utils/expenseCalculator';

export const createExpensesSlice: StateCreator<
  AppState,
  [],
  [],
  ExpensesSlice
> = (set, get) => ({
  expenses: [],
  payments: [],
  addExpense: (groupId, description, amount, paidById, participantIds, split = "equal", shares) => {
    const newExpense = {
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
    const newPayment = {
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
  getGroupExpenses: (groupId) => {
    const { expenses } = get();
    return expenses.filter(e => e.groupId === groupId);
  },
  getGroupDebts: (groupId) => {
    const { getGroupExpenses, getGroupUsers } = get();
    const groupExpenses = getGroupExpenses(groupId);
    const groupUsers = getGroupUsers(groupId);
    
    const balances = calculateBalances(groupExpenses, groupUsers);
    return calculateDebts(balances, groupUsers);
  },
});
