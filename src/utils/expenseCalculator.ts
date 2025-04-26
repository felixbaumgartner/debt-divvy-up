
import { Balance, DebtSummary, Expense, User } from "@/types";

// Calculate balances for each user in a group
export function calculateBalances(expenses: Expense[], users: User[]): Balance[] {
  const balances: Record<string, number> = {};
  
  // Initialize balances for all users
  users.forEach(user => {
    balances[user.id] = 0;
  });

  // Calculate each expense's effect on balances
  expenses.forEach(expense => {
    const paidBy = expense.paidBy;
    const participants = expense.participants;
    const amount = expense.amount;
    
    if (expense.split === "equal") {
      const share = amount / participants.length;
      
      // Add the full amount to the person who paid
      balances[paidBy] += amount;
      
      // Subtract each participant's share
      participants.forEach(participantId => {
        balances[participantId] -= share;
      });
    } else if (expense.split === "custom" && expense.shares) {
      // Add the full amount to the person who paid
      balances[paidBy] += amount;
      
      // Subtract each participant's custom share
      Object.entries(expense.shares).forEach(([userId, share]) => {
        balances[userId] -= share;
      });
    }
  });
  
  // Convert to Balance array
  return Object.entries(balances).map(([userId, amount]) => ({
    userId,
    amount: Number(amount.toFixed(2)) // Round to 2 decimal places
  }));
}

// Calculate simplified debts (who owes whom)
export function calculateDebts(balances: Balance[], users: User[]): DebtSummary[] {
  const debts: DebtSummary[] = [];
  
  // Create a copy of balances to work with
  const remainingBalances = [...balances];
  
  // Sort by amount (descending for positive, ascending for negative)
  remainingBalances.sort((a, b) => b.amount - a.amount);
  
  // Find the creditors (positive balances) and debtors (negative balances)
  const creditors = remainingBalances.filter(b => b.amount > 0.01); // Use small threshold to avoid floating point issues
  const debtors = remainingBalances.filter(b => b.amount < -0.01); // Use small threshold to avoid floating point issues
  
  // If no debts or only one user, there's nothing to settle
  if (creditors.length === 0 || debtors.length === 0) {
    return [];
  }
  
  // Match debtors with creditors to settle debts
  let creditorIndex = 0;
  let debtorIndex = 0;
  
  while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
    const creditor = creditors[creditorIndex];
    const debtor = debtors[debtorIndex];
    
    // Only process significant amounts (more than 1 cent)
    const amountToSettle = Math.min(creditor.amount, -debtor.amount);
    
    if (amountToSettle > 0.01) {
      debts.push({
        fromUserId: debtor.userId,
        toUserId: creditor.userId,
        amount: Number(amountToSettle.toFixed(2))
      });
    }
    
    creditor.amount -= amountToSettle;
    debtor.amount += amountToSettle;
    
    if (creditor.amount < 0.01) creditorIndex++;
    if (debtor.amount > -0.01) debtorIndex++;
  }
  
  return debts;
}
