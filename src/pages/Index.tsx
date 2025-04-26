
import { useAppStore } from "@/store/useAppStore";
import { Navigate } from "react-router-dom";
import Dashboard from "./Dashboard";
import { GroupDetails } from "@/components/GroupDetails";

const Index = () => {
  const currentUser = useAppStore((state) => state.currentUser);
  const activeGroupId = useAppStore((state) => state.activeGroupId);
  const groups = useAppStore((state) => state.groups);
  const setActiveGroup = useAppStore((state) => state.setActiveGroup);
  
  // Redirect to auth page if not logged in
  if (!currentUser) {
    return <Navigate to="/auth" replace />;
  }
  
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
