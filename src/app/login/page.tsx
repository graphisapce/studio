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
  GoogleAuthProvider,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useAuth as useFirebaseAuth, useFirestore } from "@/firebase";
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
import { ArrowLeft, Loader2 } from "lucide-react";
import { GoogleIcon } from "@/components/icons/google-icon";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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

const forgotPasswordSchema = z.object({
    email: z.string().email({ message: "Please enter a valid email address." }),
});

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const auth = useFirebaseAuth();
  const db = useFirestore();
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState<"customer" | "business">("customer");
  
  useEffect(() => {
    if(!authLoading && user) {
      router.push("/");
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
  
  const forgotPasswordForm = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onLoginSubmit(values: z.infer<typeof loginSchema>) {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      router.push("/");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Login Failed", description: error.message });
    } finally {
      setIsLoading(false);
    }
  }

  async function onSignupSubmit(values: z.infer<typeof signupSchema>) {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const newUser = userCredential.user;

      await setDoc(doc(db, "users", newUser.uid), {
        id: newUser.uid,
        name: values.name,
        email: values.email,
        phone: values.phone,
        role: role,
        createdAt: new Date().toISOString(),
      });

      router.push("/");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Sign Up Failed", description: error.message });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setIsLoading(true);
    try {
      const googleProvider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, googleProvider);
      const additionalUserInfo = getAdditionalUserInfo(result);
      const newUser = result.user;

      if (additionalUserInfo?.isNewUser) {
        await setDoc(doc(db, "users", newUser.uid), {
            id: newUser.uid,
            name: newUser.displayName || 'New User',
            email: newUser.email || '',
            photoURL: newUser.photoURL || '',
            role: role,
            createdAt: new Date().toISOString(),
        });
      }
      router.push("/");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Google Sign-In Failed", description: error.message });
    } finally {
      setIsLoading(false);
    }
  }

  async function onForgotPasswordSubmit(values: z.infer<typeof forgotPasswordSchema>) {
    setIsLoading(true);
    try {
        await sendPasswordResetEmail(auth, values.email);
        toast({
            title: "Success",
            description: "If an account exists, a reset link has been sent. Check your spam folder.",
        });
    } catch (error: any) {
        toast({ variant: "destructive", title: "Error", description: "Failed to send reset email." });
    } finally {
        setIsLoading(false);
    }
  }

  if (authLoading && !user) return (
    <div className="flex h-screen flex-col items-center justify-center gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-muted-foreground">Checking authentication...</p>
    </div>
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/50 p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6"><Logo /></div>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Welcome Back</CardTitle>
                <CardDescription>Enter your credentials to access your account.</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField control={loginForm.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl><Input placeholder="name@example.com" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={loginForm.control} name="password" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? "Signing In..." : "Sign In"}</Button>
                  </form>
                </Form>
                 <div className="mt-2 text-right">
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="link" className="p-0 h-auto font-normal">Forgot Password?</Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Forgot Your Password?</AlertDialogTitle>
                          <AlertDialogDescription>Enter your email and we'll send you a link to reset it.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <Form {...forgotPasswordForm}>
                            <form id="forgot-password-form" onSubmit={forgotPasswordForm.handleSubmit(onForgotPasswordSubmit)}>
                                 <FormField control={forgotPasswordForm.control} name="email" render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl><Input placeholder="name@example.com" {...field} /></FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )} />
                            </form>
                        </Form>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <Button type="submit" form="forgot-password-form" disabled={isLoading}>Send Reset Link</Button>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                </div>
                <div className="relative my-4"><div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or continue with</span></div></div>
                <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading}><GoogleIcon className="mr-2 h-5 w-5" />Sign in with Google</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>Create an Account</CardTitle>
                <CardDescription>Select your role and enter your details.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 space-y-2">
                    <Label>I am a...</Label>
                    <RadioGroup defaultValue={role} onValueChange={(v: any) => setRole(v)} className="flex gap-4">
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="customer" id="customer" />
                            <Label htmlFor="customer">Customer</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="business" id="business" />
                            <Label htmlFor="business">Business Owner</Label>
                        </div>
                    </RadioGroup>
                </div>
                <Form {...signupForm}>
                  <form onSubmit={signupForm.handleSubmit(onSignupSubmit)} className="space-y-3">
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
                        <FormControl><Input placeholder="name@example.com" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                     <FormField control={signupForm.control} name="phone" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl><Input placeholder="9876543210" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={signupForm.control} name="password" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <Button type="submit" className="w-full" disabled={isLoading}>Create Account</Button>
                  </form>
                </Form>
                <div className="relative my-4"><div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or</span></div></div>
                <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading}><GoogleIcon className="mr-2 h-5 w-5" />Sign up with Google</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        <p className="text-center text-sm text-muted-foreground mt-4"><Link href="/" className="underline flex items-center justify-center"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Home</Link></p>
      </div>
    </div>
  );
}
