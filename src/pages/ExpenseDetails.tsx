
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Expense } from "@/types";
import { Loader2 } from "lucide-react";

export default function ExpenseDetails() {
  const { expenseId } = useParams<{ expenseId: string }>();
  const navigate = useNavigate();
  
  const [expense, setExpense] = useState<Expense | null>(null);
  const [payer, setPayer] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Get store functions and data
  const getGroupExpenses = useAppStore((state) => state.getGroupExpenses);
  const getUserById = useAppStore((state) => state.getUserById);
  const currentUser = useAppStore((state) => state.currentUser);
  const activeGroupId = useAppStore((state) => state.activeGroupId);
  const setActiveGroup = useAppStore((state) => state.setActiveGroup);
  const expenses = useAppStore((state) => state.expenses);
  const loadGroups = useAppStore((state) => state.loadGroups);
  const loadFriends = useAppStore((state) => state.loadFriends);
  
  useEffect(() => {
    // Load necessary data
    const loadData = async () => {
      setIsLoading(true);
      console.log("Loading expense data for ID:", expenseId);
      
      try {
        // Make sure groups and friends are loaded
        await loadGroups();
        await loadFriends();

        // First check if expense is in the store
        let foundExpense = expenses.find(e => e.id === expenseId);
        console.log("Found in store:", foundExpense);
        
        // If not found in store, try to fetch from Supabase
        if (!foundExpense && expenseId) {
          console.log("Expense not found in store, fetching from database");
          
          // Since we don't know which group this expense belongs to yet,
          // we'll need to check all groups the user is part of
          const allExpenses = await getGroupExpenses(null); // null means fetch from all groups
          foundExpense = allExpenses.find(e => e.id === expenseId);
          console.log("Fetched from database:", foundExpense);
        }
        
        if (foundExpense) {
          setExpense(foundExpense);
          
          // Make sure we're in the correct group context
          if (activeGroupId !== foundExpense.groupId) {
            console.log("Setting active group to:", foundExpense.groupId);
            setActiveGroup(foundExpense.groupId);
          }
          
          // Get the payer
          const payerUser = getUserById(foundExpense.paidBy);
          if (payerUser) {
            setPayer(payerUser);
          } else if (foundExpense.paidBy === currentUser?.id) {
            // If payer is current user but not found in users list
            setPayer(currentUser);
          } else {
            console.log("Payer not found for ID:", foundExpense.paidBy);
            // Set default payer info with at least the ID
            setPayer({
              id: foundExpense.paidBy,
              name: "Unknown User",
            });
          }
          
          // Get participants including the current user
          const allParticipants = foundExpense.participants.map(userId => {
            const user = getUserById(userId);
            if (user) return user;
            if (userId === currentUser?.id) return currentUser;
            
            // Create a placeholder for unknown users
            return {
              id: userId,
              name: `Unknown (${userId.substring(0, 6)}...)`,
            };
          }).filter(Boolean);
          
          setParticipants(allParticipants);
        } else {
          console.log("Expense not found after all attempts");
        }
      } catch (error) {
        console.error("Error loading expense details:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (expenseId) {
      loadData();
    }
  }, [expenseId, expenses, getUserById, activeGroupId, setActiveGroup, currentUser, loadGroups, loadFriends, getGroupExpenses]);
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button 
          variant="ghost" 
          className="mb-4" 
          onClick={() => navigate(-1)}
        >
          ← Back
        </Button>
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          <span className="ml-2 text-lg text-purple-700">Loading expense details...</span>
        </div>
      </div>
    );
  }
  
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
          <p className="text-gray-500 mt-2">The expense you're looking for may have been deleted or doesn't exist.</p>
          <Button 
            className="mt-4 bg-purple-500 hover:bg-purple-600"
            onClick={() => navigate("/")}
          >
            Return Home
          </Button>
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

  // Get payer initials for avatar fallback
  const getPayerInitials = () => {
    if (payer?.name) {
      return payer.name.substring(0, 2).toUpperCase();
    }
    return 'UN';
  };

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
                        {getPayerInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{payer.name}</span>
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
