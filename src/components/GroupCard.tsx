
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Group } from "@/types";
import { useAppStore } from "@/store/useAppStore";

interface GroupCardProps {
  group: Group;
}

export function GroupCard({ group }: GroupCardProps) {
  const setActiveGroup = useAppStore((state) => state.setActiveGroup);

  const handleSelectGroup = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log("Selecting group:", group.id);
    setActiveGroup(group.id);
  };

  return (
    <Card 
      onClick={handleSelectGroup}
      className="hover:shadow-md transition-shadow cursor-pointer"
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
        <Button 
          className="w-full bg-purple-500 hover:bg-purple-600"
          onClick={(e) => {
            e.stopPropagation();
            handleSelectGroup(e);
          }}
        >
          View Group
        </Button>
      </CardContent>
    </Card>
  );
}
