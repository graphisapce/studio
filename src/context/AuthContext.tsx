
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
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured) {
        setLoading(false);
        return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      
      if (!firebaseUser) {
        setUserProfile(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      const userDocRef = doc(db, "users", firebaseUser.uid);
      
      const unsubscribeProfile = onSnapshot(userDocRef, (snapshot) => {
        if (snapshot.exists()) {
          setUserProfile(snapshot.data() as UserProfile);
        } else {
          setUserProfile(null);
        }
        setLoading(false);
      }, (error) => {
        console.error("Profile Sync Error:", error);
        setLoading(false);
      });

      return () => unsubscribeProfile();
    });

    return () => unsubscribeAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, userProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
