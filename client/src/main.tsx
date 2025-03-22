import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import IDE from "./pages/IDE";
import SimpleAuth from "./components/SimpleAuth";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDX25nwzQc-STovWztgtw2aCycvWXJxA3Y",
  authDomain: "dash-13064.firebaseapp.com",
  databaseURL: "https://dash-13064-default-rtdb.firebaseio.com",
  projectId: "dash-13064",
  storageBucket: "dash-13064.appspot.com",
  messagingSenderId: "409540597555",
  appId: "1:409540597555:web:5cc48d3ab4046fbd309046",
  measurementId: "G-78JL7PXFPJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);

// Main App Component with Auth Flow
function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("Auth state changed:", currentUser?.email);
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0d1117] text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#58a6ff]"></div>
      </div>
    );
  }

  return user ? <IDE /> : <SimpleAuth />;
}

// Mount the application
document.addEventListener('DOMContentLoaded', () => {
  const rootElement = document.getElementById("app-root");
  
  if (rootElement) {
    ReactDOM.render(
      <React.StrictMode>
        <QueryClientProvider client={queryClient}>
          <App />
          <Toaster />
        </QueryClientProvider>
      </React.StrictMode>,
      rootElement
    );
  }
});
