
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DebtSummary } from "@/types";
import { useAppStore } from "@/store/useAppStore";
import { useState, useEffect } from "react";
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
  
  // Log for debugging
  useEffect(() => {
    console.log("Rendering DebtSummaryItem with debt:", debt);
    console.log("FromUser:", fromUser);
    console.log("ToUser:", toUser);
  }, [debt, fromUser, toUser]);
  
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

  return (
    <Card className="mb-2">
      <CardContent className="p-4">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-600">{fromUser?.name || 'Unknown user'}</span>
              <span className="text-sm text-gray-500">needs to pay</span>
              <span className="font-medium text-gray-600">{toUser?.name || 'Unknown user'}</span>
            </div>
            <Button 
              size="sm"
              variant="outline"
              onClick={handleSettle}
              disabled={isSettling}
              className="flex items-center gap-2 bg-purple-50 text-purple-600 hover:bg-purple-100 hover:text-purple-700 border-purple-200"
            >
              <HandCoins className="h-4 w-4" />
              {isSettling ? "Settling..." : "Settle Up"}
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Split amount:</span>
            <span className="font-bold text-lg text-purple-600">
              {formatter.format(debt.amount)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
