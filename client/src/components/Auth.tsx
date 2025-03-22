import { useState } from "react";
import { auth, database } from "../main";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { ref, set, get } from "firebase/database";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
  const [isSignUp, setIsSignUp] = useState(!isLogin);
  const { toast } = useToast();

  // Function to store user data in Firebase Database
  const storeUserInDatabase = async (userId: string, email: string, name: string = "") => {
    const userRef = ref(database, `users/${userId}`);

    // Check if user already exists
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      console.log("User already exists in database:", snapshot.val());
      return;
    }

    await set(userRef, {
      userId,
      email: email.toLowerCase(), // Store email in lowercase
      name: name || "",
      createdAt: Date.now(),
    });

    console.log("User successfully stored in Firebase:", { userId, email });
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let userCredential;
      if (!isSignUp) {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } else {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const userId = userCredential.user.uid;

        console.log("New user created:", userId, "with email:", email);

        await storeUserInDatabase(userId, email);
      }
    } catch (error: any) {
      console.error("Authentication error:", error);
      toast({
        title: "Authentication Error",
        description: error.message || "Failed to authenticate. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      console.log("Google Sign-in user:", user);

      await storeUserInDatabase(user.uid, user.email || "", user.displayName || "");
    } catch (error: any) {
      console.error("Google authentication error:", error);
      toast({
        title: "Authentication Error",
        description: error.message || "Failed to authenticate with Google. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsSignUp(!isSignUp);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d1117] p-4">
      <Card className="w-full max-w-md bg-[#161b22] border-[#30363d] text-[#c9d1d9]">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl text-center">
            {!isSignUp ? "Sign in to DevHub" : "Create a DevHub Account"}
          </CardTitle>
          <CardDescription className="text-center text-[#8b949e]">
            {!isSignUp
              ? "Enter your credentials to access your account"
              : "Fill in the form below to create your account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm text-[#8b949e]">
                Email
              </Label>
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
              <Label htmlFor="password" className="text-sm text-[#8b949e]">
                Password
              </Label>
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

            {!isSignUp && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember-me"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                  />
                  <Label htmlFor="remember-me" className="text-sm text-[#8b949e]">
                    Remember me
                  </Label>
                </div>
                <a href="#" className="text-sm text-[#58a6ff] hover:underline">
                  Forgot password?
                </a>
              </div>
            )}

            <Button type="submit" className="w-full bg-[#58a6ff] hover:bg-[#58a6ff]/90" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                  {!isSignUp ? "Signing in..." : "Creating account..."}
                </span>
              ) : !isSignUp ? (
                "Sign in"
              ) : (
                "Create account"
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

            <Button type="button" variant="outline" className="w-full border-[#30363d] bg-[#0d1117] hover:bg-[#161b22] text-[#c9d1d9]" onClick={handleGoogleSignIn} disabled={isLoading}>
              <FcGoogle className="h-5 w-5 mr-2" />
              Google
            </Button>

            <div className="text-center text-sm text-[#8b949e]">
              {!isSignUp ? "Don't have an account? " : "Already have an account? "}
              <a href="#" onClick={(e) => { e.preventDefault(); toggleAuthMode(); }} className="text-[#58a6ff] hover:underline">
                {!isSignUp ? "Sign up" : "Sign in"}
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
