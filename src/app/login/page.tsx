
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
  GoogleAuthProvider,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
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
import { UserRole } from "@/lib/types";

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
  const auth = useFirebaseAuth();
  const db = useFirestore();
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState<UserRole>("customer");
  
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

  async function onLoginSubmit(values: z.infer<typeof loginSchema>) {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      toast({ title: "Welcome back!", description: "Aap login ho gaye hain." });
      router.push("/");
    } catch (error: any) {
      console.error(error);
      toast({ variant: "destructive", title: "Login Failed", description: "Email ya Password galat hai." });
    } finally {
      setIsLoading(false);
    }
  }

  async function onSignupSubmit(values: z.infer<typeof signupSchema>) {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const newUser = userCredential.user;

      // Create User Profile - Initial signup always creates doc
      await setDoc(doc(db, "users", newUser.uid), {
        id: newUser.uid,
        name: values.name,
        email: values.email,
        phone: values.phone,
        role: role,
        createdAt: new Date().toISOString(),
        favorites: [],
        areaCode: "Global"
      }, { merge: true });

      if (role === 'business') {
        await setDoc(doc(db, "businesses", newUser.uid), {
          id: newUser.uid,
          ownerId: newUser.uid,
          shopName: `${values.name}'s Shop`,
          category: "Others",
          contactNumber: values.phone,
          whatsappLink: `https://wa.me/${values.phone.replace(/\D/g, '')}`,
          address: "Address not set",
          status: "pending",
          views: 0,
          callCount: 0,
          whatsappCount: 0,
          isPaid: false,
          areaCode: "Global",
          imageUrl: "",
          logoUrl: "",
          openingTime: "09:00",
          closingTime: "21:00",
          createdAt: new Date().toISOString()
        }, { merge: true });
      }

      toast({ title: "Account Created!", description: "Aapka data Firestore mein save ho gaya hai." });
      router.push("/");
    } catch (error: any) {
      console.error(error);
      let errMsg = "Sign Up fail ho gaya.";
      if (error.code === 'auth/email-already-in-use') {
        errMsg = "Ye email pehle se register hai. Kripya Sign In karein.";
      }
      toast({ variant: "destructive", title: "Registration Error", description: errMsg });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setIsLoading(true);
    try {
      const googleProvider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, googleProvider);
      const newUser = result.user;

      // CRITICAL FIX: Check if user document already exists before overwriting defaults
      const userDocRef = doc(db, "users", newUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        // Only set defaults for NEW Google users
        await setDoc(userDocRef, {
            id: newUser.uid,
            name: newUser.displayName || 'New User',
            email: newUser.email || '',
            photoURL: newUser.photoURL || '',
            role: role,
            createdAt: new Date().toISOString(),
            favorites: [],
            areaCode: "Global"
        }, { merge: true });

        if (role === 'business') {
          await setDoc(doc(db, "businesses", newUser.uid), {
            id: newUser.uid,
            ownerId: newUser.uid,
            shopName: `${newUser.displayName || 'New'}'s Shop`,
            category: "Others",
            address: "Address not set",
            status: "pending",
            views: 0,
            callCount: 0,
            whatsappCount: 0,
            isPaid: false,
            areaCode: "Global",
            imageUrl: "",
            logoUrl: "",
            createdAt: new Date().toISOString()
          }, { merge: true });
        }
      } else {
        // If user exists, we might want to ensure basic info is synced but NOT overwrite areaCode or favorites
        await setDoc(userDocRef, {
          id: newUser.uid,
          name: newUser.displayName || userDocSnap.data().name,
          photoURL: newUser.photoURL || userDocSnap.data().photoURL,
          lastLoginAt: new Date().toISOString()
        }, { merge: true });
      }
      
      toast({ title: "Google Sign-In Success" });
      router.push("/");
    } catch (error: any) {
      console.error(error);
      toast({ variant: "destructive", title: "Google Sign-In Failed", description: error.message });
    } finally {
      setIsLoading(false);
    }
  }

  if (authLoading && !user) return (
    <div className="flex h-screen flex-col items-center justify-center gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
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
                <CardDescription>Enter credentials to access LocalVyapar.</CardDescription>
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
                <div className="relative my-4"><div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or continue with</span></div></div>
                <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading}><GoogleIcon className="mr-2 h-5 w-5" />Google Sign In</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>Create Account</CardTitle>
                <CardDescription>Select role and join LocalVyapar.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6 space-y-3 p-4 bg-muted/50 rounded-xl">
                    <Label className="text-xs font-black uppercase text-muted-foreground">Account Purpose</Label>
                    <RadioGroup value={role} onValueChange={(v: any) => setRole(v)} className="grid grid-cols-3 gap-2">
                        <div className="flex items-center space-x-2 bg-white p-2 rounded-lg border">
                            <RadioGroupItem value="customer" id="customer" />
                            <Label htmlFor="customer" className="text-[10px] font-bold">User</Label>
                        </div>
                        <div className="flex items-center space-x-2 bg-white p-2 rounded-lg border">
                            <RadioGroupItem value="business" id="business" />
                            <Label htmlFor="business" className="text-[10px] font-bold">Shop</Label>
                        </div>
                        <div className="flex items-center space-x-2 bg-white p-2 rounded-lg border">
                            <RadioGroupItem value="delivery-boy" id="delivery-boy" />
                            <Label htmlFor="delivery-boy" className="text-[10px] font-bold">Delivery</Label>
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
                        <FormLabel>Phone</FormLabel>
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
                    <Button type="submit" className="w-full" disabled={isLoading}>Create {role === 'business' ? 'Business' : role === 'delivery-boy' ? 'Delivery' : 'Customer'} Account</Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        <p className="text-center text-sm text-muted-foreground mt-4"><Link href="/" className="underline flex items-center justify-center"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Home</Link></p>
      </div>
    </div>
  );
}
