
import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, User } from "lucide-react";
import { Avatar, AvatarFallback } from "./ui/avatar";

export function FriendsList() {
  const users = useAppStore((state) => state.users);
  const currentUser = useAppStore((state) => state.currentUser);
  const addUser = useAppStore((state) => state.addUser);
  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false);
  const [newFriendName, setNewFriendName] = useState("");
  const [newFriendEmail, setNewFriendEmail] = useState("");

  const friends = users.filter(user => user.id !== currentUser.id);

  const handleAddFriend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFriendName) return;
    
    addUser(newFriendName, newFriendEmail);
    setNewFriendName("");
    setNewFriendEmail("");
    setIsAddFriendOpen(false);
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
              className="flex items-center space-x-3 p-4 bg-white rounded-lg shadow-sm border border-gray-100"
            >
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
          ))}
        </div>
      )}
    </div>
  );
}
