
import { useAppStore } from "@/store/useAppStore";
import { Navigate, Link } from "react-router-dom";
import Dashboard from "./Dashboard";
import { GroupDetails } from "@/components/GroupDetails";
import { Button } from "@/components/ui/button";
import { UserRound } from "lucide-react";
import { useEffect } from "react";

const Index = () => {
  const currentUser = useAppStore((state) => state.currentUser);
  const activeGroupId = useAppStore((state) => state.activeGroupId);
  const groups = useAppStore((state) => state.groups);
  const setActiveGroup = useAppStore((state) => state.setActiveGroup);
  const loadGroups = useAppStore((state) => state.loadGroups);
  const loadFriends = useAppStore((state) => state.loadFriends);
  
  // Monitor activeGroupId changes
  useEffect(() => {
    console.log("Active group ID changed to:", activeGroupId);
  }, [activeGroupId]);
  
  // Load initial data
  useEffect(() => {
    if (currentUser) {
      console.log("Loading groups and friends");
      const loadData = async () => {
        await loadGroups();
        await loadFriends();
      };
      loadData();
    }
  }, [currentUser, loadGroups, loadFriends]);
  
  // Redirect to auth page if not logged in
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h1 className="text-3xl font-bold text-center text-purple-700 mb-2">
            Debt Divvy-Up
          </h1>
          <p className="mt-2 text-center text-lg text-gray-600 max-w-md">
            Track and split expenses with friends and groups
          </p>
        </div>
        <div className="mt-8">
          <Link to="/auth">
            <Button className="bg-purple-500 hover:bg-purple-600">
              <UserRound className="mr-2" />
              Sign in / Sign up
            </Button>
          </Link>
        </div>
      </div>
    );
  }
  
  const activeGroup = groups.find(g => g.id === activeGroupId);
  console.log("Active group ID:", activeGroupId);
  console.log("Active group found:", activeGroup);
  console.log("All groups:", groups);
  
  return (
    <div className="min-h-screen bg-gray-50">
      {activeGroup ? (
        <GroupDetails 
          group={activeGroup}
          onBack={() => {
            console.log("Setting active group to null");
            setActiveGroup(null);
          }}
        />
      ) : (
        <Dashboard />
      )}
    </div>
  );
}

export default Index;
