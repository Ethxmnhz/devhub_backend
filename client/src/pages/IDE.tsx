import { useEffect, useState } from "react";
import { auth } from "../main";
import { Button } from "@/components/ui/button";
import { User } from "firebase/auth";

export default function IDE() {
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);

  const handleSignOut = () => {
    auth.signOut();
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-white p-4">
      <header className="flex justify-between items-center mb-8 p-4 bg-[#161b22] rounded-lg border border-[#30363d]">
        <h1 className="text-2xl font-bold text-[#58a6ff]">DevHub IDE</h1>
        <div className="flex items-center gap-4">
          <span className="text-[#c9d1d9]">
            Welcome, {currentUser?.email || currentUser?.displayName || "User"}
          </span>
          <Button 
            onClick={handleSignOut}
            variant="outline" 
            className="border-[#30363d] hover:bg-[#30363d] text-[#c9d1d9]"
          >
            Sign Out
          </Button>
        </div>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
        <div className="bg-[#161b22] p-4 rounded-lg border border-[#30363d] lg:col-span-1">
          <h2 className="text-xl mb-4 text-[#c9d1d9]">File Explorer</h2>
          <div className="flex justify-center items-center h-32 border border-dashed border-[#30363d] rounded-md">
            <p className="text-[#8b949e] text-center">File explorer will appear here</p>
          </div>
        </div>
        
        <div className="bg-[#161b22] p-4 rounded-lg border border-[#30363d] lg:col-span-3">
          <h2 className="text-xl mb-4 text-[#c9d1d9]">Code Editor</h2>
          <div className="flex justify-center items-center h-64 border border-dashed border-[#30363d] rounded-md">
            <p className="text-[#8b949e] text-center">Code editor will appear here</p>
          </div>
        </div>
      </div>
      
      <div className="bg-[#161b22] p-4 rounded-lg border border-[#30363d]">
        <h2 className="text-xl mb-4 text-[#c9d1d9]">Terminal</h2>
        <div className="flex justify-center items-center h-32 border border-dashed border-[#30363d] rounded-md">
          <p className="text-[#8b949e] text-center">Terminal output will appear here</p>
        </div>
      </div>
      
      <footer className="mt-8 p-2 bg-[#161b22] rounded-lg border border-[#30363d] text-center text-[#8b949e] text-sm">
        <p>Status: Ready | Python | UTF-8 | Spaces: 4</p>
      </footer>
    </div>
  );
}
