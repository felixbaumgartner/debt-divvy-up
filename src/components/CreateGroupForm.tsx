
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/store/useAppStore";
import { FormEvent, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface CreateGroupFormProps {
  onComplete?: () => void;
}

export function CreateGroupForm({ onComplete }: CreateGroupFormProps) {
  const createGroup = useAppStore((state) => state.createGroup);
  const loadGroups = useAppStore((state) => state.loadGroups);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!name) {
      toast({
        title: "Error",
        description: "Group name is required",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log("Creating group:", name, description);
      const group = await createGroup(name, description);
      console.log("Group created:", group);
      
      // Explicitly reload groups to ensure we have the latest data
      await loadGroups();
      
      // Reset form
      setName("");
      setDescription("");
      
      toast({
        title: "Success",
        description: "Group created successfully",
      });

      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error("Error creating group:", error);
      toast({
        title: "Error",
        description: "Failed to create group",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl text-purple-700">Create New Group</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Group Name</Label>
            <Input
              id="name"
              placeholder="e.g., Roommates, Trip to Paris"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="What's this group for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              disabled={isLoading}
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-purple-500 hover:bg-purple-600"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Group"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
