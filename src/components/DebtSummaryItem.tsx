
import { Card, CardContent } from "@/components/ui/card";
import { DebtSummary } from "@/types";
import { useAppStore } from "@/store/useAppStore";

interface DebtSummaryItemProps {
  debt: DebtSummary;
}

export function DebtSummaryItem({ debt }: DebtSummaryItemProps) {
  const getUserById = useAppStore((state) => state.getUserById);
  const fromUser = getUserById(debt.fromUserId);
  const toUser = getUserById(debt.toUserId);
  
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  return (
    <Card className="mb-2">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-medium">{fromUser?.name}</span>
            <span className="text-gray-500">owes</span>
            <span className="font-medium">{toUser?.name}</span>
          </div>
          <span className="font-bold text-purple-600">
            {formatter.format(debt.amount)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
