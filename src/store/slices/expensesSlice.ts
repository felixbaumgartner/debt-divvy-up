
import { StateCreator } from 'zustand';
import { AppState, ExpensesSlice } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { calculateBalances, calculateDebts } from '@/utils/expenseCalculator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

export const createExpensesSlice: StateCreator<
  AppState,
  [],
  [],
  ExpensesSlice
> = (set, get) => ({
  expenses: [],
  payments: [],
  addExpense: async (groupId, description, amount, paidById, participantIds, split = "equal", shares) => {
    try {
      const expenseId = uuidv4();
      
      // Insert the expense into Supabase
      const { error: expenseError } = await supabase
        .from('expenses')
        .insert({
          id: expenseId,
          group_id: groupId,
          description,
          amount,
          paid_by: paidById,
          split
        });

      if (expenseError) {
        console.error('Error creating expense:', expenseError);
        toast({
          title: "Error",
          description: "Failed to create expense",
          variant: "destructive",
        });
        throw expenseError;
      }

      // Insert expense participants
      const participantRecords = participantIds.map(userId => ({
        expense_id: expenseId,
        user_id: userId,
        share: shares ? shares[userId] : amount / participantIds.length
      }));

      const { error: participantsError } = await supabase
        .from('expense_participants')
        .insert(participantRecords);

      if (participantsError) {
        console.error('Error adding participants:', participantsError);
        toast({
          title: "Error",
          description: "Failed to add participants",
          variant: "destructive",
        });
        throw participantsError;
      }

      const newExpense = {
        id: expenseId,
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
      
      toast({
        title: "Success",
        description: "Expense added successfully",
      });
      
      return newExpense;
    } catch (error) {
      console.error('Error in addExpense:', error);
      throw error;
    }
  },
  addPayment: async (groupId, fromUserId, toUserId, amount) => {
    try {
      const paymentId = uuidv4();
      
      const { error } = await supabase
        .from('payments')
        .insert({
          id: paymentId,
          group_id: groupId,
          from_user_id: fromUserId,
          to_user_id: toUserId,
          amount
        });

      if (error) {
        console.error('Error creating payment:', error);
        toast({
          title: "Error",
          description: "Failed to create payment",
          variant: "destructive",
        });
        throw error;
      }

      const newPayment = {
        id: paymentId,
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
    } catch (error) {
      console.error('Error in addPayment:', error);
      throw error;
    }
  },
  settlePayment: async (paymentId) => {
    try {
      const { error } = await supabase
        .from('payments')
        .update({ settled: true })
        .eq('id', paymentId);

      if (error) {
        console.error('Error settling payment:', error);
        toast({
          title: "Error",
          description: "Failed to settle payment",
          variant: "destructive",
        });
        throw error;
      }

      set((state) => ({
        payments: state.payments.map(p => {
          if (p.id === paymentId) {
            return { ...p, settled: true };
          }
          return p;
        }),
      }));
    } catch (error) {
      console.error('Error in settlePayment:', error);
      throw error;
    }
  },
  getGroupExpenses: async (groupId) => {
    try {
      // Build query for expenses
      let query = supabase
        .from('expenses')
        .select(`
          *,
          expense_participants (
            user_id,
            share
          )
        `);
      
      // If groupId is provided, filter by it, otherwise get all expenses
      if (groupId) {
        query = query.eq('group_id', groupId);
      }
      
      const { data: expenses, error: expensesError } = await query;

      if (expensesError) {
        console.error('Error fetching expenses:', expensesError);
        return [];
      }

      console.log(`Fetched ${expenses.length} expenses ${groupId ? 'for group ' + groupId : 'across all groups'}`);

      // Transform the data to match our app's format
      const transformedExpenses = expenses.map(expense => ({
        id: expense.id,
        groupId: expense.group_id,
        description: expense.description,
        amount: expense.amount,
        paidBy: expense.paid_by,
        participants: expense.expense_participants.map(p => p.user_id),
        date: new Date(expense.created_at),
        // Ensure split is either "equal" or "custom", defaulting to "equal" if it doesn't match
        split: (expense.split === "equal" || expense.split === "custom") ? expense.split : "equal" as "equal" | "custom",
        shares: expense.expense_participants.reduce((acc, p) => {
          acc[p.user_id] = p.share;
          return acc;
        }, {} as Record<string, number>)
      }));

      // Update the store with these expenses
      if (groupId) {
        // Only update the stored expenses for the specific group
        set((state) => ({
          expenses: [
            ...state.expenses.filter(e => e.groupId !== groupId),
            ...transformedExpenses
          ]
        }));
      } else {
        // Update all expenses in the store
        set({ expenses: transformedExpenses });
      }

      return transformedExpenses;
    } catch (error) {
      console.error('Error in getGroupExpenses:', error);
      return [];
    }
  },
  getGroupDebts: (groupId) => {
    // We can't make this function async directly since it would change its signature
    // Instead, we'll use the cached expenses and handle the async part elsewhere
    const { users } = get();
    const groupUsers = users.filter(user => {
      // In a real implementation, this would filter by group membership
      return true; // For now, we include all users
    });
    
    // Use the cached expenses instead of fetching them again
    const expenses = get().expenses.filter(expense => expense.groupId === groupId);
    
    const balances = calculateBalances(expenses, groupUsers);
    return calculateDebts(balances, groupUsers);
  },
});
