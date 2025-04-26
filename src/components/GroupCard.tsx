
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Group } from "@/types";
import { useAppStore } from "@/store/useAppStore";
import { useNavigate } from "react-router-dom";

interface GroupCardProps {
  group: Group;
}

export function GroupCard({ group }: GroupCardProps) {
  const setActiveGroup = useAppStore((state) => state.setActiveGroup);
  const navigate = useNavigate();

  const handleSelectGroup = () => {
    console.log("Selecting group:", group.id);
    setActiveGroup(group.id);
    
    // Force a re-render by navigating to the same page
    navigate("/", { replace: true });
  };

  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer" 
      onClick={handleSelectGroup}
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
            e.stopPropagation(); // Prevent triggering both card and button click
            handleSelectGroup();
          }}
        >
          View Group
        </Button>
      </CardContent>
    </Card>
  );
}
