
import { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";
import { GroupCard } from "@/components/GroupCard";
import { CreateGroupForm } from "@/components/CreateGroupForm";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { PlusIcon, Loader2, RefreshCw } from "lucide-react";
import { FriendsList } from "@/components/FriendsList";
import { toast } from "@/components/ui/use-toast";

export default function Dashboard() {
  const groups = useAppStore((state) => state.groups);
  const currentUser = useAppStore((state) => state.currentUser);
  const loadGroups = useAppStore((state) => state.loadGroups);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      await loadGroups();
      console.log("Groups loaded:", groups);
    } catch (error) {
      console.error("Error loading groups:", error);
      toast({
        title: "Error",
        description: "Failed to load groups",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  // Load groups on initial render
  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  // Reload groups when dialog closes (e.g., after creating a group)
  useEffect(() => {
    if (!isCreateDialogOpen && currentUser) {
      loadData();
    }
  }, [isCreateDialogOpen]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-purple-700">Debt Divvy-Up</h1>
          <p className="text-gray-600">Welcome back, {currentUser?.name}</p>
        </div>
      </div>

      <FriendsList />
      
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">My Groups</h2>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
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
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          </div>
        ) : groups.length === 0 ? (
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
    </div>
  );
}
