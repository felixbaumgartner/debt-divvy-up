
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Expense } from "@/types";
import { useAppStore } from "@/store/useAppStore";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface ExpenseItemProps {
  expense: Expense;
}

export function ExpenseItem({ expense }: ExpenseItemProps) {
  const getUserById = useAppStore((state) => state.getUserById);
  const [payer, setPayer] = useState<any>(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    const user = getUserById(expense.paidBy);
    if (user) {
      setPayer(user);
      console.log("Found payer:", user);
    } else {
      console.log("No payer found for ID:", expense.paidBy);
    }
  }, [expense.paidBy, getUserById]);
  
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling
    console.log("Expense card clicked:", expense.id);
    // You can navigate to a detailed expense view here if needed
    // For now, just log the click
  };

  return (
    <Card 
      className="mb-2 cursor-pointer hover:bg-gray-50 transition-colors"
      onClick={handleCardClick}
    >
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
