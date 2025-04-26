import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Expense } from "@/types";
import { useAppStore } from "@/store/useAppStore";
import { useEffect, useState } from "react";

interface ExpenseItemProps {
  expense: Expense;
}

export function ExpenseItem({ expense }: ExpenseItemProps) {
  const getUserById = useAppStore((state) => state.getUserById);
  const currentUser = useAppStore((state) => state.currentUser);
  const [payer, setPayer] = useState<any>(null);
  
  useEffect(() => {
    // Check if the expense was paid by the current user
    if (expense.paidBy === currentUser?.id) {
      setPayer(currentUser);
    } else {
      // Otherwise try to get the user from the store
      const user = getUserById(expense.paidBy);
      setPayer(user);
    }
  }, [expense.paidBy, getUserById, currentUser]);
  
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  return (
    <Card className="mb-2">
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center">
          <Avatar className="h-10 w-10 mr-3">
            <AvatarImage src={payer?.avatarUrl} />
            <AvatarFallback className="bg-purple-200 text-purple-800">
              {payer?.name ? payer.name.substring(0, 2).toUpperCase() : 'UN'}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{expense.description}</p>
            <p className="text-sm text-gray-500">
              Paid by {payer?.name || 'Unknown'} • {new Date(expense.date).toLocaleDateString()}
            </p>
          </div>
        </div>
        <p className="font-semibold text-lg">
          {formatter.format(expense.amount)}
        </p>
      </CardContent>
    </Card>
  );
}
