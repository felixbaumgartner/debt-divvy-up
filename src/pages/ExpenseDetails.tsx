
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Expense } from "@/types";

export default function ExpenseDetails() {
  const { expenseId } = useParams<{ expenseId: string }>();
  const navigate = useNavigate();
  
  const [expense, setExpense] = useState<Expense | null>(null);
  const [payer, setPayer] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  
  const expenses = useAppStore((state) => state.expenses);
  const getUserById = useAppStore((state) => state.getUserById);
  const activeGroupId = useAppStore((state) => state.activeGroupId);
  const setActiveGroup = useAppStore((state) => state.setActiveGroup);
  
  useEffect(() => {
    // Find the expense
    const foundExpense = expenses.find(e => e.id === expenseId);
    if (foundExpense) {
      setExpense(foundExpense);
      
      // Make sure we're in the correct group context
      if (activeGroupId !== foundExpense.groupId) {
        setActiveGroup(foundExpense.groupId);
      }
      
      // Get the payer
      const user = getUserById(foundExpense.paidBy);
      if (user) {
        setPayer(user);
      }
      
      // Get participants
      const parts = foundExpense.participants.map(userId => getUserById(userId)).filter(Boolean);
      setParticipants(parts);
    }
  }, [expenseId, expenses, getUserById, activeGroupId, setActiveGroup]);
  
  if (!expense) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button 
          variant="ghost" 
          className="mb-4" 
          onClick={() => navigate(-1)}
        >
          ← Back
        </Button>
        <div className="text-center py-12">
          <h2 className="text-xl font-medium">Expense not found</h2>
        </div>
      </div>
    );
  }
  
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });
  
  const date = new Date(expense.date);
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button 
        variant="ghost" 
        className="mb-4" 
        onClick={() => navigate(-1)}
      >
        ← Back
      </Button>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl text-purple-700">{expense.description}</CardTitle>
          <p className="text-gray-500">{formattedDate}</p>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Amount</h3>
              <p className="text-2xl font-bold text-purple-700">{formatter.format(expense.amount)}</p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Paid by</h3>
              <div className="flex items-center">
                {payer && (
                  <>
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarImage src={payer?.avatarUrl} />
                      <AvatarFallback className="bg-purple-200 text-purple-800">
                        {payer?.name ? payer.name.substring(0, 2).toUpperCase() : 'UN'}
                      </AvatarFallback>
                    </Avatar>
                    <span>{payer.name}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-8">
            <h3 className="text-lg font-medium mb-2">Split between</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {participants.map((participant) => (
                <div key={participant.id} className="flex items-center p-3 border rounded-md">
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarImage src={participant.avatarUrl} />
                    <AvatarFallback className="bg-purple-200 text-purple-800">
                      {participant.name ? participant.name.substring(0, 2).toUpperCase() : 'UN'}
                    </AvatarFallback>
                  </Avatar>
                  <span>{participant.name}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
