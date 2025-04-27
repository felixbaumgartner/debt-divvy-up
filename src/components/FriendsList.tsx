
import { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { toast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function FriendsList() {
  const friends = useAppStore((state) => state.friends);
  const currentUser = useAppStore((state) => state.currentUser);
  const addUser = useAppStore((state) => state.addUser);
  const deleteFriend = useAppStore((state) => state.deleteFriend);
  const loadFriends = useAppStore((state) => state.loadFriends);
  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false);
  const [newFriendName, setNewFriendName] = useState("");
  const [newFriendEmail, setNewFriendEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadFriends();
    }
  }, [currentUser, loadFriends]);

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFriendName) return;
    
    setIsLoading(true);
    try {
      await addUser(newFriendName, newFriendEmail);
      toast({
        title: "Success",
        description: "Friend added successfully!",
      });
      setNewFriendName("");
      setNewFriendEmail("");
      setIsAddFriendOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add friend. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFriend = async (friendId: string, friendName: string) => {
    try {
      await deleteFriend(friendId);
    } catch (error) {
      console.error('Error deleting friend:', error);
    }
  };

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Friends</h2>
        <Dialog open={isAddFriendOpen} onOpenChange={setIsAddFriendOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-500 hover:bg-purple-600">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Friend
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleAddFriend} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="friendName">Friend's Name</Label>
                <Input
                  id="friendName"
                  value={newFriendName}
                  onChange={(e) => setNewFriendName(e.target.value)}
                  placeholder="Enter friend's name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="friendEmail">Friend's Email (optional)</Label>
                <Input
                  id="friendEmail"
                  type="email"
                  value={newFriendEmail}
                  onChange={(e) => setNewFriendEmail(e.target.value)}
                  placeholder="Enter friend's email"
                />
              </div>
              
              <Button type="submit" className="w-full bg-purple-500 hover:bg-purple-600">
                Add Friend
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {friends.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-600 mb-4">You haven't added any friends yet.</p>
          <Button 
            className="bg-purple-500 hover:bg-purple-600"
            onClick={() => setIsAddFriendOpen(true)}
          >
            Add Your First Friend
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {friends.map((friend) => (
            <div 
              key={friend.id}
              className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-100"
            >
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarFallback className="bg-purple-100 text-purple-700">
                    {friend.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium text-gray-900">{friend.name}</h3>
                  {friend.email && (
                    <p className="text-sm text-gray-500">{friend.email}</p>
                  )}
                </div>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline" 
                    size="icon"
                    className="text-red-500 hover:text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove Friend</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to remove {friend.name} from your friends list? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDeleteFriend(friend.id, friend.name)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Remove
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
