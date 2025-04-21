
import { useAppStore } from "@/store/useAppStore";
import Dashboard from "./Dashboard";
import { GroupDetails } from "@/components/GroupDetails";

const Index = () => {
  const activeGroupId = useAppStore((state) => state.activeGroupId);
  const groups = useAppStore((state) => state.groups);
  const setActiveGroup = useAppStore((state) => state.setActiveGroup);
  
  const activeGroup = groups.find(g => g.id === activeGroupId);
  
  return (
    <div className="min-h-screen bg-gray-50">
      {activeGroup ? (
        <GroupDetails 
          group={activeGroup}
          onBack={() => setActiveGroup(null)}
        />
      ) : (
        <Dashboard />
      )}
    </div>
  );
};

export default Index;
