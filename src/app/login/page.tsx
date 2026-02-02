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
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
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
        router.push('/dashboard');
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
      await signInWithEmailAndPassword(auth, values.email, values.password);
      toast({ title: "Success", description: "Logged in successfully." });
      router.push("/dashboard");
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
      router.push("/dashboard");
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
      }
      
      toast({ title: "Success", description: "Logged in successfully." });
      router.push("/dashboard");
    } catch (error: any) {
      let description = "Could not sign in with Google. Please try again.";
      if (error.code === 'auth/popup-closed-by-user') {
          description = "The sign-in window was closed. Please try again.";
      } else if (error.code === 'auth/account-exists-with-different-credential') {
          description = "An account already exists with the same email address but different sign-in credentials. Please sign in using the original method.";
      } else if (error.code === 'auth/operation-not-allowed') {
          description = "Google Sign-In is not enabled for this project. Please enable it in the Firebase Console under Authentication > Sign-in method.";
      } else if (error.code === 'permission-denied') {
          description = "Could not save new user data to the database. Please check your Firestore security rules.";
      } else if (error.message) {
          description = error.message;
      }
      toast({ variant: "destructive", title: "Google Sign-In Failed", description });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!isFirebaseConfigured) {
      toast({
        variant: "destructive",
        title: "Firebase Not Configured",
        description: "Please set up your Firebase credentials in .env.local to use this feature.",
      });
      return;
    }

    const email = loginForm.getValues("email");
    if (!email) {
        loginForm.trigger("email");
        return;
    }
    const isEmailValid = await loginForm.trigger("email");
    if (!isEmailValid) return;

    setIsLoading(true);
    try {
        await sendPasswordResetEmail(auth, email);
        toast({
            title: "Password Reset Email Sent",
            description: `If an account exists for ${email}, you will receive a password reset link shortly. Please check your spam folder too.`,
        });
    } catch (error) {
        // For security, always show a success message to prevent user enumeration
        toast({
            title: "Password Reset Email Sent",
            description: `If an account exists for ${email}, you will receive a password reset link shortly. Please check your spam folder too.`,
        });
    } finally {
        setIsLoading(false);
    }
  }


  if (authLoading || user) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <p>Loading...</p>
        </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/20 p-4 relative">
       <Button variant="ghost" className="absolute top-4 left-4" asChild>
        <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4"/>
            Back to Home
        </Link>
       </Button>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Logo className="justify-center mb-2"/>
          <CardTitle className="text-2xl font-headline">Welcome to LocalVyapar</CardTitle>
          <CardDescription>Your one-stop shop for everything local</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="space-y-3 mb-6 text-center">
              <Label className="font-semibold">I am a...</Label>
              <RadioGroup
                onValueChange={(value: "customer" | "business") => setRole(value)}
                defaultValue={role}
                className="flex space-x-4 justify-center"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="customer" id="role-customer" />
                  <Label htmlFor="role-customer" className="font-normal cursor-pointer">
                    Customer
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="business" id="role-business" />
                  <Label htmlFor="role-business" className="font-normal cursor-pointer">
                    Business Owner
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login">Sign In</TabsTrigger>
                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
                <TabsContent value="login" className="pt-4">
                <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <fieldset disabled={isLoading} className="space-y-4">
                        <FormField control={loginForm.control} name="email" render={({ field }) => (
                            <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl><Input placeholder="you@example.com" {...field} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={loginForm.control} name="password" render={({ field }) => (
                            <FormItem>
                              <div className="flex items-center justify-between">
                                <FormLabel>Password</FormLabel>
                                <Button
                                    type="button"
                                    variant="link"
                                    className="p-0 h-auto text-sm font-medium text-primary/90 hover:text-primary"
                                    onClick={handleForgotPassword}
                                    disabled={isLoading}
                                >
                                    Forgot Password?
                                </Button>
                              </div>
                            <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )} />
                    </fieldset>
                    <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? 'Signing In...' : 'Sign In'}</Button>
                    </form>
                </Form>
                <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                    </div>
                </div>
                <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading}>
                    <GoogleIcon className="mr-2 h-5 w-5" />
                    Sign in with Google
                </Button>
                </TabsContent>
                <TabsContent value="signup" className="pt-4">
                <Form {...signupForm}>
                    <form onSubmit={signupForm.handleSubmit(onSignupSubmit)} className="space-y-4">
                    <fieldset disabled={isLoading} className="space-y-4">
                        <FormField control={signupForm.control} name="name" render={({ field }) => (
                            <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={signupForm.control} name="email" render={({ field }) => (
                            <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl><Input placeholder="you@example.com" {...field} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={signupForm.control} name="phone" render={({ field }) => (
                            <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl><Input placeholder="e.g., 9876543210" {...field} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={signupForm.control} name="password" render={({ field }) => (
                            <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl><Input type="password" placeholder="Minimum 8 characters" {...field} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )} />
                    </fieldset>
                    <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? 'Creating Account...' : 'Create Account'}</Button>
                    </form>
                </Form>
                <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                    </div>
                </div>
                <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading}>
                    <GoogleIcon className="mr-2 h-5 w-5" />
                    Sign up with Google
                </Button>
                </TabsContent>
            </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
