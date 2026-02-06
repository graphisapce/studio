
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { useAuth as useFirebaseAuth, useFirestore } from "@/firebase";
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
  
  const auth = useFirebaseAuth();
  const db = useFirestore();

  useEffect(() => {
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

      // Important: We keep loading = true until the profile is fetched from Firestore
      setIsSyncing(true);
      const userDocRef = doc(db, "users", firebaseUser.uid);
      
      unsubscribeProfile = onSnapshot(userDocRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as UserProfile;
          setUserProfile({ ...data, id: snapshot.id });
        } else {
          // If Auth exists but profile doesn't, we still set profile to null
          // but allow the system to stop loading so registration can happen
          setUserProfile(null);
        }
        setLoading(false);
        setIsSyncing(false);
      }, (error) => {
        console.warn("Profile sync error:", error.message);
        setUserProfile(null);
        setLoading(false);
        setIsSyncing(false);
      });
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, [auth, db]);

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, isSyncing }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
