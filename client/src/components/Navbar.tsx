import { useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../main";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { User } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Play, LogOut, User as UserIcon, Settings } from "lucide-react";

interface NavbarProps {
  user: User | null;
  onRunCode: () => void;
  isRunning: boolean;
}

export default function Navbar({ user, onRunCode, isRunning }: NavbarProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [showFullMenu, setShowFullMenu] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Signed out",
        description: "You have been signed out successfully."
      });
      setLocation("/login");
    } catch (error: any) {
      console.error("Sign out error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to sign out. Please try again.",
        variant: "destructive"
      });
    }
  };

  const toggleMenu = () => {
    setShowFullMenu(!showFullMenu);
  };

  return (
    <header className="bg-[#010409] border-b border-[#30363d] h-12 flex items-center px-4">
      <div className="flex items-center">
        <div className="text-[#58a6ff] font-semibold text-lg mr-6">DevHub</div>
        <nav className="hidden md:flex space-x-4">
          <button onClick={toggleMenu} className="text-[#c9d1d9] hover:text-[#58a6ff] text-sm">File</button>
          <button onClick={toggleMenu} className="text-[#c9d1d9] hover:text-[#58a6ff] text-sm">Edit</button>
          <button onClick={toggleMenu} className="text-[#c9d1d9] hover:text-[#58a6ff] text-sm">View</button>
          <button onClick={toggleMenu} className="text-[#c9d1d9] hover:text-[#58a6ff] text-sm">Run</button>
          <button onClick={toggleMenu} className="text-[#c9d1d9] hover:text-[#58a6ff] text-sm">Help</button>
        </nav>
      </div>
      <div className="ml-auto flex items-center space-x-4">
        <Button
          variant="outline"
          className="flex items-center bg-[#56d364] bg-opacity-20 text-[#56d364] border-[#56d364] border-opacity-20 hover:bg-opacity-30 hover:text-[#56d364]"
          onClick={onRunCode}
          disabled={isRunning}
        >
          {isRunning ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#56d364] border-t-transparent mr-1"></div>
              Running
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-1" />
              Run
            </>
          )}
        </Button>

        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 rounded-full p-0">
                <Avatar className="h-8 w-8 border border-[#30363d]">
                  <AvatarImage 
                    src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email?.charAt(0) || 'U'}&background=58a6ff&color=fff`} 
                    alt={user.displayName || user.email || "User avatar"} 
                  />
                  <AvatarFallback className="bg-[#58a6ff] text-white">
                    {user.email?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#161b22] border-[#30363d] text-[#c9d1d9]">
              <div className="px-3 py-2 text-sm border-b border-[#30363d]">
                <div className="font-medium">{user.displayName || "User"}</div>
                <div className="text-xs text-[#8b949e]">{user.email}</div>
              </div>
              <DropdownMenuItem className="flex items-center gap-2 focus:bg-[#0d1117]">
                <UserIcon className="h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-2 focus:bg-[#0d1117]">
                <Settings className="h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="flex items-center gap-2 text-[#f85149] focus:text-[#f85149] focus:bg-[#0d1117]"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
