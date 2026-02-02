"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  getAdditionalUserInfo,
  sendPasswordResetEmail,
  UserCredential,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, googleProvider, db, isFirebaseConfigured } from "@/lib/firebase/clientApp";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { Logo } from "@/components/logo";
import { ArrowLeft } from "lucide-react";
import { GoogleIcon } from "@/components/icons/google-icon";
import { Label } from "@/components/ui/label";

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

const signupSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  phone: z.string().min(10, { message: "Enter a valid 10-digit phone number." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
});

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState<"customer" | "business">("customer");
  
  useEffect(() => {
    if(!authLoading && user) {
        // If user is already logged in, redirect them.
        // The AuthProvider will fetch the profile, so we can't redirect here reliably.
        // Let's redirect to a neutral page and let the layouts/pages handle role-based redirection.
        router.push('/');
    }
  }, [user, authLoading, router]);

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const signupForm = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", phone: "", password: "" },
  });

  async function handleLoginSuccess(userCredential: UserCredential) {
    const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
    if (userDoc.exists() && userDoc.data().role === 'business') {
      router.push("/dashboard");
    } else {
      router.push("/");
    }
  }

  async function onLoginSubmit(values: z.infer<typeof loginSchema>) {
    if (!isFirebaseConfigured) {
      toast({
        variant: "destructive",
        title: "Firebase Not Configured",
        description: "Please set up your Firebase credentials in .env.local to enable login.",
      });
      return;
    }
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      toast({ title: "Success", description: "Logged in successfully." });
      await handleLoginSuccess(userCredential);
    } catch (error: any) {
      let description = "An unexpected error occurred. Please try again.";
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        description = "Invalid email or password. Please check your credentials and try again.";
      } else if (error.message) {
        description = error.message;
      }
      toast({ variant: "destructive", title: "Login Failed", description });
    } finally {
      setIsLoading(false);
    }
  }
  
  async function handleSignupSuccess(selectedRole: "customer" | "business") {
      if (selectedRole === 'business') {
          router.push('/setup-business');
      } else {
          router.push('/');
      }
  }

  async function onSignupSubmit(values: z.infer<typeof signupSchema>) {
    if (!isFirebaseConfigured) {
      toast({
        variant: "destructive",
        title: "Firebase Not Configured",
        description: "Please set up your Firebase credentials in .env.local to enable sign up.",
      });
      return;
    }
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: values.name,
        email: values.email,
        phone: values.phone,
        role: role,
        createdAt: new Date().toISOString(),
      });

      toast({ title: "Success", description: "Account created successfully." });
      await handleSignupSuccess(role);
    } catch (error: any) {
      let description = "An unexpected error occurred. Please try again.";
      if (error.code === 'auth/email-already-in-use') {
        description = "An account with this email address already exists. Please try logging in.";
      } else if (error.code === 'auth/weak-password') {
        description = "The password is too weak. Please choose a stronger password of at least 8 characters.";
      } else if (error.code === 'permission-denied') {
        description = "Could not save user data. Please check your Firestore security rules.";
      } else if (error.message) {
        description = error.message;
      }
      toast({ variant: "destructive", title: "Sign Up Failed", description });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    if (!isFirebaseConfigured) {
      toast({
        variant: "destructive",
        title: "Firebase Not Configured",
        description: "Please set up your Firebase credentials in .env.local to enable Google sign in.",
      });
      return;
    }
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const additionalUserInfo = getAdditionalUserInfo(result);
      const user = result.user;

      if (additionalUserInfo?.isNewUser) {
        await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            name: user.displayName || 'New User',
            email: user.email || '',
            photoURL: user.photoURL || '',
            phone: user.phoneNumber || '',
            role: role,
            createdAt: new Date().toISOString(),
        });
        toast({ title: "Success", description: "Account created successfully." });
        await handleSignupSuccess(role);
      } else {
        toast({ title: "Success", description: "Logged in successfully." });
        await handleLoginSuccess(result);
      }
    } catch (error: any