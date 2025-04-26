
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DebtSummary } from "@/types";
import { useAppStore } from "@/store/useAppStore";
import { useState } from "react";
import { HandCoins } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface DebtSummaryItemProps {
  debt: DebtSummary;
}

export function DebtSummaryItem({ debt }: DebtSummaryItemProps) {
  const getUserById = useAppStore((state) => state.getUserById);
  const addPayment = useAppStore((state) => state.addPayment);
  const activeGroupId = useAppStore((state) => state.activeGroupId);
  const [isSettling, setIsSettling] = useState(false);

  const fromUser = getUserById(debt.fromUserId);
  const toUser = getUserById(debt.toUserId);
  
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  const handleSettle = async () => {
    if (!activeGroupId) return;
    
    setIsSettling(true);
    try {
      await addPayment(
        activeGroupId,
        debt.fromUserId,
        debt.toUserId,
        debt.amount
      );
      
      toast({
        title: "Success",
        description: "Payment has been recorded.",
      });
    } catch (error) {
      console.error("Error settling payment:", error);
      toast({
        title: "Error",
        description: "Failed to record the payment.",
        variant: "destructive",
      });
    } finally {
      setIsSettling(false);
    }
  };

  const fromUserDisplay = fromUser?.name || fromUser?.email || 'Unknown user';
  const toUserDisplay = toUser?.name || toUser?.email || 'Unknown person';

  return (
    <Card className="mb-2">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-gray-600">
              {fromUserDisplay} owes {formatter.format(debt.amount)} to {toUserDisplay}
            </span>
            <Button 
              size="sm"
              variant="outline"
              onClick={handleSettle}
              disabled={isSettling}
              className="flex items-center gap-2 bg-purple-50 text-purple-600 hover:bg-purple-100 hover:text-purple-700 border-purple-200 ml-2"
            >
              <HandCoins className="h-4 w-4" />
              {isSettling ? "Settling..." : "Settle Up"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
