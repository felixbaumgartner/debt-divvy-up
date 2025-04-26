
import { useState } from "react";
import { AuthForm } from "@/components/AuthForm";
import { Navigate } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";

export default function Auth() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const currentUser = useAppStore((state) => state.currentUser);

  // Redirect if user is already logged in
  if (currentUser) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-3xl font-bold text-center text-purple-700 mb-2">
          Debt Divvy-Up
        </h1>
        <h2 className="mt-6 text-center text-2xl font-semibold text-gray-900">
          {mode === "login" ? "Sign in to your account" : "Create your account"}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <AuthForm mode={mode} />
          
          <div className="mt-6">
            <button
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="w-full text-center text-sm text-purple-600 hover:text-purple-500"
            >
              {mode === "login"
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
