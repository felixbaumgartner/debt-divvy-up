
import { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExpenseItem } from "@/components/ExpenseItem";
import { DebtSummaryItem } from "@/components/DebtSummaryItem";
import { AddExpenseForm } from "@/components/AddExpenseForm";
import { Group, Expense } from "@/types";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { PlusIcon } from "lucide-react";

interface GroupDetailsProps {
  group: Group;
  onBack: () => void;
}

export function GroupDetails({ group, onBack }: GroupDetailsProps) {
  const getGroupExpenses = useAppStore((state) => state.getGroupExpenses);
  const getGroupDebts = useAppStore((state) => state.getGroupDebts);
  
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddExpenseDialogOpen, setIsAddExpenseDialogOpen] = useState(false);

  useEffect(() => {
    const fetchExpenses = async () => {
      setIsLoading(true);
      try {
        const groupExpenses = await getGroupExpenses(group.id);
        setExpenses(groupExpenses);
      } catch (error) {
        console.error("Failed to fetch expenses:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchExpenses();
  }, [group.id, getGroupExpenses]);
  
  const debts = getGroupDebts(group.id);
  const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const hasSingleMember = group.members.length <= 1;
  
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  const handleExpenseAdded = async () => {
    setIsAddExpenseDialogOpen(false);
    // Refresh expenses
    const groupExpenses = await getGroupExpenses(group.id);
    setExpenses(groupExpenses);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button 
        variant="ghost" 
        className="mb-4" 
        onClick={onBack}
      >
        ← Back to Groups
      </Button>
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-purple-700">{group.name}</h1>
          {group.description && (
            <p className="text-gray-600">{group.description}</p>
          )}
        </div>
        
        <Dialog open={isAddExpenseDialogOpen} onOpenChange={setIsAddExpenseDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-500 hover:bg-purple-600">
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent>
            <AddExpenseForm 
              group={group} 
              onComplete={handleExpenseAdded} 
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-gray-500 text-sm">Total Group Spend</p>
          <p className="text-2xl font-bold text-purple-700">
            {formatter.format(totalSpent)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-gray-500 text-sm">Group Members</p>
          <p className="text-2xl font-bold text-purple-700">
            {group.members.length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-gray-500 text-sm">Expenses</p>
          <p className="text-2xl font-bold text-purple-700">
            {expenses.length}
          </p>
        </div>
      </div>
      
      <Tabs defaultValue="expenses" className="w-full">
        <TabsList className="w-full mb-6">
          <TabsTrigger value="expenses" className="flex-1">Expenses</TabsTrigger>
          <TabsTrigger value="balances" className="flex-1">Balances</TabsTrigger>
        </TabsList>
        
        <TabsContent value="expenses" className="space-y-4">
          {isLoading ? (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <p className="text-gray-600">Loading expenses...</p>
            </div>
          ) : expenses.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <p className="text-gray-600 mb-4">No expenses recorded yet.</p>
              <Button 
                className="bg-purple-500 hover:bg-purple-600"
                onClick={() => setIsAddExpenseDialogOpen(true)}
              >
                Add First Expense
              </Button>
            </div>
          ) : (
            <div>
              {expenses.map((expense) => (
                <ExpenseItem key={expense.id} expense={expense} />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="balances" className="space-y-4">
          {debts.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <p className="text-gray-600">
                {expenses.length === 0 
                  ? "No expenses recorded yet." 
                  : hasSingleMember
                    ? "This group has only one member. Add more members to split expenses."
                    : "Everyone is settled up!"}
              </p>
            </div>
          ) : (
            <div>
              {debts.map((debt, index) => (
                <DebtSummaryItem key={index} debt={debt} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
