
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/store/useAppStore";
import { FormEvent, useState } from "react";

interface CreateGroupFormProps {
  onComplete?: () => void;
}

export function CreateGroupForm({ onComplete }: CreateGroupFormProps) {
  const createGroup = useAppStore((state) => state.createGroup);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!name) return;

    createGroup(name, description);

    // Reset form
    setName("");
    setDescription("");

    if (onComplete) {
      onComplete();
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
            />
          </div>
          
          <Button type="submit" className="w-full bg-purple-500 hover:bg-purple-600">
            Create Group
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
