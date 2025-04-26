
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DebtSummary } from "@/types";
import { useAppStore } from "@/store/useAppStore";
import { useState } from "react";
import { CheckCircle } from "lucide-react";
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
        title: "Payment recorded",
        description: "The debt has been marked as settled.",
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

  return (
    <Card className="mb-2">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-medium">{fromUser?.name}</span>
            <span className="text-gray-500">owes</span>
            <span className="font-medium">{toUser?.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-bold text-purple-600">
              {formatter.format(debt.amount)}
            </span>
            <Button 
              size="sm"
              variant="outline"
              onClick={handleSettle}
              disabled={isSettling}
              className="flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              {isSettling ? "Settling..." : "Settle"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
