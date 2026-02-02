
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "@/lib/firebase/clientApp";
import type { UserProfile } from "@/lib/types";

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isSyncing: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  isSyncing: false,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured) {
        setLoading(false);
        return;
    }

    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      
      if (!firebaseUser) {
        setUserProfile(null);
        setLoading(false);
        setIsSyncing(false);
        if (unsubscribeProfile) unsubscribeProfile();
        return;
      }

      setIsSyncing(true);
      const userDocRef = doc(db, "users", firebaseUser.uid);
      
      // Real-time listener that survives refreshes and session changes
      unsubscribeProfile = onSnapshot(userDocRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as UserProfile;
          setUserProfile(data);
        } else {
          // If profile doc doesn't exist yet, we still finish loading to avoid infinite spinner
          console.warn("User profile document doesn't exist yet.");
        }
        setLoading(false);
        setIsSyncing(false);
      }, (error) => {
        console.error("Profile Sync Error:", error);
        setLoading(false);
        setIsSyncing(false);
      });
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, isSyncing }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
