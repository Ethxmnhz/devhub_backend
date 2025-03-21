import Auth from "@/components/Auth";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { auth } from "../main";

export default function Login() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Redirect to IDE if already logged in
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setLocation("/");
      }
    });

    return () => unsubscribe();
  }, [setLocation]);

  return <Auth isLogin={true} />;
}
