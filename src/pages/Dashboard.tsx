
import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";
import { GroupCard } from "@/components/GroupCard";
import { CreateGroupForm } from "@/components/CreateGroupForm";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { PlusIcon } from "lucide-react";

export default function Dashboard() {
  const groups = useAppStore((state) => state.groups);
  const currentUser = useAppStore((state) => state.currentUser);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-purple-700">Debt Divvy-Up</h1>
          <p className="text-gray-600">Welcome back, {currentUser.name}</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-500 hover:bg-purple-600">
              <PlusIcon className="h-4 w-4 mr-2" />
              New Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <CreateGroupForm onComplete={() => setIsCreateDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">My Groups</h2>
        
        {groups.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <p className="text-gray-600 mb-4">You don't have any groups yet.</p>
            <Button 
              className="bg-purple-500 hover:bg-purple-600"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              Create Your First Group
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groups.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        )}
      </div>

      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Split expenses with friends and family
        </h2>
        <p className="text-gray-600 mb-4">
          Track bills, split costs evenly, and settle up with ease.
        </p>
      </div>
    </div>
  );
}
