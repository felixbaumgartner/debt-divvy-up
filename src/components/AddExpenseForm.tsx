import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAppStore } from "@/store/useAppStore";
import { FormEvent, useState, useEffect } from "react";
import { Group } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";

interface AddExpenseFormProps {
  group: Group;
  onComplete?: () => void;
}

export function AddExpenseForm({ group, onComplete }: AddExpenseFormProps) {
  const currentUser = useAppStore((state) => state.currentUser);
  const addExpense = useAppStore((state) => state.addExpense);
  const users = useAppStore((state) => state.users);
  const loadFriends = useAppStore((state) => state.loadFriends);

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState(currentUser?.id || "");
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(
    group.members.map((m) => m.id)
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchFriends = async () => {
      await loadFriends();
    };
    
    fetchFriends();
  }, [loadFriends]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!description || !amount) {
      toast({
        title: "Error",
        description: "Please fill out all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await addExpense(
        group.id,
        description,
        parseFloat(amount),
        paidBy,
        selectedParticipants
      );

      setDescription("");
      setAmount("");
      setPaidBy(currentUser?.id || "");
      setSelectedParticipants(group.members.map((m) => m.id));

      toast({
        title: "Success",
        description: "Expense added successfully!",
      });

      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Error adding expense:', error);
      toast({
        title: "Error",
        description: "Failed to add expense. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleParticipant = (userId: string) => {
    if (selectedParticipants.includes(userId)) {
      setSelectedParticipants(selectedParticipants.filter((id) => id !== userId));
    } else {
      setSelectedParticipants([...selectedParticipants, userId]);
    }
  };

  const calculateSplitAmount = () => {
    if (!amount || selectedParticipants.length === 0) return 0;
    return parseFloat(amount) / selectedParticipants.length;
  };

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  const allParticipants = [
    ...(currentUser ? [currentUser] : []),
    ...users.filter(user => 
      user.id !== currentUser?.id
    )
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl text-purple-700">Add New Expense</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="What was this expense for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="paid-by">Paid by</Label>
            <Select value={paidBy} onValueChange={(value) => setPaidBy(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Who paid?" />
              </SelectTrigger>
              <SelectContent>
                {allParticipants.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Split between</Label>
            <div className="border rounded-md p-3 space-y-2">
              {allParticipants.map((member) => (
                <div key={member.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`user-${member.id}`}
                      checked={selectedParticipants.includes(member.id)}
                      onCheckedChange={() => toggleParticipant(member.id)}
                    />
                    <Label htmlFor={`user-${member.id}`} className="cursor-pointer">
                      {member.name}
                    </Label>
                  </div>
                  {selectedParticipants.includes(member.id) && amount && (
                    <span className="text-sm text-purple-600 font-medium">
                      {formatter.format(calculateSplitAmount())}
                    </span>
                  )}
                </div>
              ))}
              {selectedParticipants.length > 0 && amount && (
                <div className="pt-2 mt-2 border-t text-sm text-gray-500">
                  Split equally: {formatter.format(calculateSplitAmount())} per person
                </div>
              )}
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-purple-500 hover:bg-purple-600"
            disabled={isLoading}
          >
            {isLoading ? "Adding..." : "Add Expense"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
