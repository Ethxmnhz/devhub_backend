import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { auth } from "./main";
import { User, onAuthStateChanged } from "firebase/auth";

// Loading component
const LoadingScreen = () => (
  <div className="h-screen flex items-center justify-center bg-[#0d1117] text-white">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#58a6ff]"></div>
  </div>
);

// Auth Wrapper component
const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [, navigate] = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPath] = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      
      // Redirect if needed
      if (!currentUser && currentPath !== '/login') {
        navigate('/login');
      } else if (currentUser && currentPath === '/login') {
        navigate('/');
      }
    });

    return () => unsubscribe();
  }, [navigate, currentPath]);

  if (loading) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
};

// App component - this just exports the AuthProvider
const App = ({ children }: { children: React.ReactNode }) => {
  return <AuthProvider>{children}</AuthProvider>;
};

export default App;
