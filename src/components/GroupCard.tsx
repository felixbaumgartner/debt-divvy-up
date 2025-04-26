
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Group } from "@/types";
import { useAppStore } from "@/store/useAppStore";
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
import { Trash2 } from "lucide-react";

interface GroupCardProps {
  group: Group;
}

export function GroupCard({ group }: GroupCardProps) {
  const setActiveGroup = useAppStore((state) => state.setActiveGroup);
  const deleteGroup = useAppStore((state) => state.deleteGroup);

  const handleSelectGroup = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log("Selecting group:", group.id);
    setActiveGroup(group.id);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteGroup(group.id);
    } catch (error) {
      console.error('Error deleting group:', error);
    }
  };

  return (
    <Card 
      onClick={handleSelectGroup}
      className="hover:shadow-md transition-shadow cursor-pointer relative"
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-xl text-purple-700">{group.name}</CardTitle>
        <CardDescription>{group.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">
          {group.members.length} members • Created{" "}
          {new Date(group.createdAt).toLocaleDateString()}
        </p>
        <div className="flex gap-2">
          <Button 
            className="flex-1 bg-purple-500 hover:bg-purple-600"
            onClick={(e) => {
              e.stopPropagation();
              handleSelectGroup(e);
            }}
          >
            View Group
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="outline" 
                className="px-3 border-red-200 hover:bg-red-50 hover:text-red-600"
                onClick={(e) => e.stopPropagation()}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Group</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{group.name}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-500 hover:bg-red-600"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
