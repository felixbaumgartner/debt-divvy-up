
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAppStore } from "@/store/useAppStore";
import { FormEvent, useState } from "react";
import { Group, User } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AddExpenseFormProps {
  group: Group;
  onComplete?: () => void;
}

export function AddExpenseForm({ group, onComplete }: AddExpenseFormProps) {
  const currentUser = useAppStore((state) => state.currentUser);
  const addExpense = useAppStore((state) => state.addExpense);

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState(currentUser.id);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(
    group.members.map((m) => m.id)
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!description || !amount) return;

    addExpense(
      group.id,
      description,
      parseFloat(amount),
      paidBy,
      selectedParticipants
    );

    // Reset form
    setDescription("");
    setAmount("");
    setPaidBy(currentUser.id);
    setSelectedParticipants(group.members.map((m) => m.id));

    if (onComplete) {
      onComplete();
    }
  };

  const toggleParticipant = (userId: string) => {
    if (selectedParticipants.includes(userId)) {
      setSelectedParticipants(selectedParticipants.filter((id) => id !== userId));
    } else {
      setSelectedParticipants([...selectedParticipants, userId]);
    }
  };

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
                {group.members.map((member) => (
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
              {group.members.map((member) => (
                <div key={member.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`user-${member.id}`}
                    checked={selectedParticipants.includes(member.id)}
                    onCheckedChange={() => toggleParticipant(member.id)}
                  />
                  <Label htmlFor={`user-${member.id}`} className="cursor-pointer">
                    {member.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          
          <Button type="submit" className="w-full bg-purple-500 hover:bg-purple-600">
            Add Expense
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
