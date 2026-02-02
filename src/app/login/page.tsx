"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from "next/link";
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

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

const signupSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  phone: z.string().min(10, { message: "Enter a valid 10-digit phone number." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
  role: z.enum(["customer", "business"], { required_error: "You need to select a role." }),
});

export default function LoginPage() {
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const signupForm = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", phone: "", password: "", role: "customer" },
  });

  function onLoginSubmit(values: z.infer<typeof loginSchema>) {
    console.log("Login:", values);
  }

  function onSignupSubmit(values: z.infer<typeof signupSchema>) {
    console.log("Signup:", values);
  }
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/20 p-4 relative">
       <Button variant="ghost" className="absolute top-4 left-4" asChild>
        <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4"/>
            Back to Home
        </Link>
       </Button>
      <Tabs defaultValue="login" className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <Logo className="justify-center mb-2"/>
            <CardTitle className="text-2xl font-headline">Welcome to LocalVyapar</CardTitle>
            <CardDescription>Your one-stop shop for everything local</CardDescription>
            <TabsList className="grid w-full grid-cols-2 mt-4">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent>
            <TabsContent value="login">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                  <FormField control={loginForm.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl><Input placeholder="you@example.com" {...field} /></FormControl>
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
                  <Button type="submit" className="w-full">Sign In</Button>
                </form>
              </Form>
            </TabsContent>
            <TabsContent value="signup">
              <Form {...signupForm}>
                <form onSubmit={signupForm.handleSubmit(onSignupSubmit)} className="space-y-4">
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
                  <FormField control={signupForm.control} name="role" render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>I am a...</FormLabel>
                      <FormControl>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl><RadioGroupItem value="customer" /></FormControl>
                            <FormLabel className="font-normal">Customer</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl><RadioGroupItem value="business" /></FormControl>
                            <FormLabel className="font-normal">Business Owner</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit" className="w-full">Create Account</Button>
                </form>
              </Form>
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}
