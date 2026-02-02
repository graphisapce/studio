
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
  const { user, userProfile, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState<"customer" | "business">("customer");
  
  useEffect(() => {
    if(!authLoading && user) {
        if(userProfile?.role === 'business') {
            router.push('/dashboard');
        } else if (userProfile) {
            router.push('/');
        }
    }
  }, [user, userProfile, authLoading, router]);

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

  async function handleLoginSuccess(userCredential: UserCredential) {
    try {
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
      if (userDoc.exists() && userDoc.data().role === 'business') {
        router.push("/dashboard");
      } else {
        router.push("/");
      }
    } catch (error) {
      console.error("Profile check error, defaulting to home:", error);
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
      // Don't await this to avoid blocking the UI if Firestore is flaky
      handleLoginSuccess(userCredential);
    } catch (error: any) {
      let description = "An unexpected error occurred. Please try again.";
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
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
        description = "Could not save user data. Your account was created, but we couldn't save your profile. Please check Firestore security rules.";
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
        handleLoginSuccess(result);
      }
    } catch (error: any) {
      let description = "An unexpected error occurred. Please try again.";
      if (error.code === 'auth/account-exists-with-different-credential') {
        description = "An account with this email already exists with a different sign-in method.";
      } else if (error.code === 'permission-denied') {
        description = "Could not save user data. Your account was created, but we couldn't save your profile. Please check Firestore security rules.";
      } else if (error.message) {
        description = error.message;
      }
      toast({ variant: "destructive", title: "Google Sign-In Failed", description });
    } finally {
      setIsLoading(false);
    }
  }

    async function onForgotPasswordSubmit(values: z.infer<typeof forgotPasswordSchema>) {
        if (!isFirebaseConfigured) {
            toast({
                variant: "destructive",
                title: "Firebase Not Configured",
                description: "Firebase is not set up, so we cannot send a reset email.",
            });
            return;
        }
        setIsLoading(true);
        try {
            await sendPasswordResetEmail(auth, values.email);
            toast({
                title: "Password Reset Email Sent",
                description: "If an account with this email exists, a password reset link has been sent. Please also check your spam folder.",
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error Sending Email",
                description: "An unexpected error occurred. Please try again later.",
            });
        } finally {
            setIsLoading(false);
        }
    }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/50 p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Logo />
        </div>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Welcome Back</CardTitle>
                <CardDescription>
                  Enter your credentials to access your account.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="name@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Signing In..." : "Sign In"}
                    </Button>
                  </form>
                </Form>
                 <div className="mt-2 text-right">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="link" className="p-0 h-auto font-normal">Forgot Password?</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Forgot Your Password?</AlertDialogTitle>
                          <AlertDialogDescription>
                            No problem. Enter your email address below and we'll send you a link to reset it.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <Form {...forgotPasswordForm}>
                            <form id="forgot-password-form" onSubmit={forgotPasswordForm.handleSubmit(onForgotPasswordSubmit)}>
                                 <FormField
                                    control={forgotPasswordForm.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input placeholder="name@example.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </form>
                        </Form>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <Button type="submit" form="forgot-password-form" disabled={isLoading}>
                            {isLoading ? "Sending..." : "Send Reset Link"}
                          </Button>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                </div>
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>
                 <div className="mb-4">
                    <p className="text-sm font-medium mb-2 text-center">I am a...</p>
                    <RadioGroup defaultValue={role} onValueChange={(value: "customer" | "business") => setRole(value)} className="flex items-center justify-center space-x-4">
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="customer" id="role-customer-login" />
                            <Label htmlFor="role-customer-login">Customer</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="business" id="role-business-login" />
                            <Label htmlFor="role-business-login">Business Owner</Label>
                        </div>
                    </RadioGroup>
                </div>
                <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading}>
                  <GoogleIcon className="mr-2 h-5 w-5" />
                  Sign in with Google
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>Create an Account</CardTitle>
                <CardDescription>
                  Enter your details to get started.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...signupForm}>
                  <form onSubmit={signupForm.handleSubmit(onSignupSubmit)} className="space-y-3">
                    <FormField
                      control={signupForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signupForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="name@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={signupForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="9876543210" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signupForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="pt-2">
                        <p className="text-sm font-medium mb-2">I am a...</p>
                         <RadioGroup defaultValue={role} onValueChange={(value: "customer" | "business") => setRole(value)} className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="customer" id="role-customer-signup" />
                                <Label htmlFor="role-customer-signup">Customer</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="business" id="role-business-signup" />
                                <Label htmlFor="role-business-signup">Business Owner</Label>
                            </div>
                        </RadioGroup>
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                       {isLoading ? "Creating Account..." : "Create Account"}
                    </Button>
                  </form>
                </Form>
                 <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>
                <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading}>
                  <GoogleIcon className="mr-2 h-5 w-5" />
                  Sign up with Google
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        <p className="px-8 text-center text-sm text-muted-foreground mt-4">
          <Link href="/" className="underline underline-offset-4 hover:text-primary flex items-center justify-center">
            <ArrowLeft className="mr-2 h-4 w-4" /> Go back to Home
          </Link>
        </p>
      </div>
    </div>
  );
}
