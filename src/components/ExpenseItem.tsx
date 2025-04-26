
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Expense } from "@/types";
import { useAppStore } from "@/store/useAppStore";

interface ExpenseItemProps {
  expense: Expense;
}

export function ExpenseItem({ expense }: ExpenseItemProps) {
  const getUserById = useAppStore((state) => state.getUserById);
  const payer = getUserById(expense.paidBy);
  
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
              {payer?.name?.substring(0, 2).toUpperCase() || 'UN'}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{expense.description}</p>
            <p className="text-sm text-gray-500">
              Paid by {payer?.name || 'Unknown'} • {expense.date.toLocaleDateString()}
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
