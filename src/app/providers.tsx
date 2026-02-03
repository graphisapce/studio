"use client";

import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseClientProvider>
      <AuthProvider>
        {children}
        <Toaster />
      </AuthProvider>
    </FirebaseClientProvider>
  );
}
