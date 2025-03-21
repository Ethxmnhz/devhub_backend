import { useState } from "react";
import { useLocation } from "wouter";
import { auth } from "../main";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { FcGoogle } from "react-icons/fc";

interface AuthProps {
  isLogin?: boolean;
}

export default function Auth({ isLogin = true }: AuthProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }

      setLocation("/");
    } catch (error: any) {
      console.error("Authentication error:", error);
      toast({
        title: "Authentication Error",
        description: error.message || "Failed to authenticate. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setLocation("/");
    } catch (error: any) {
      console.error("Google authentication error:", error);
      toast({
        title: "Authentication Error",
        description: error.message || "Failed to authenticate with Google. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setLocation(isLogin ? "/signup" : "/login");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center login-backdrop bg-black/70 backdrop-blur-sm">
      <Card className="w-full max-w-md bg-[#161b22] border-[#30363d] text-[#c9d1d9]">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl text-center">
            {isLogin ? "Sign in to DevHub" : "Create a DevHub Account"}
          </CardTitle>
          <CardDescription className="text-center text-[#8b949e]">
            {isLogin 
              ? "Enter your credentials to access your account" 
              : "Fill in the form below to create your account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm text-[#8b949e]">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="bg-[#0d1117] border-[#30363d] text-[#c9d1d9]"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm text-[#8b949e]">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-[#0d1117] border-[#30363d] text-[#c9d1d9]"
                required
              />
            </div>
            
            {isLogin && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="remember-me" 
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                  />
                  <Label htmlFor="remember-me" className="text-sm text-[#8b949e]">Remember me</Label>
                </div>
                <a href="#" className="text-sm text-[#58a6ff] hover:underline">
                  Forgot password?
                </a>
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full bg-[#58a6ff] hover:bg-[#58a6ff]/90"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                  {isLogin ? "Signing in..." : "Creating account..."}
                </span>
              ) : (
                isLogin ? "Sign in" : "Create account"
              )}
            </Button>
            
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-[#30363d]"></span>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-[#161b22] px-2 text-xs text-[#8b949e]">OR CONTINUE WITH</span>
              </div>
            </div>
            
            <Button 
              type="button" 
              variant="outline" 
              className="w-full border-[#30363d] bg-[#0d1117] hover:bg-[#161b22] text-[#c9d1d9]"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              <FcGoogle className="h-5 w-5 mr-2" />
              Google
            </Button>
            
            <div className="text-center text-sm text-[#8b949e]">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  toggleAuthMode();
                }}
                className="text-[#58a6ff] hover:underline"
              >
                {isLogin ? "Sign up" : "Sign in"}
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
