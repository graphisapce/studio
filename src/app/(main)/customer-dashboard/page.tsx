
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { doc } from "firebase/firestore";
import { 
  useFirestore, 
  updateDocumentNonBlocking, 
  useAuth as useFirebaseAuth 
} from "@/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  UserCircle, 
  Phone, 
  MapPin, 
  Mail, 
  Lock, 
  Save, 
  Loader2, 
  CheckCircle2,
  Heart,
  Camera,
  Upload,
  Hash,
  Truck
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function CustomerDashboardPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const auth = useFirebaseAuth();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: ""
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else if (userProfile) {
        setFormData({
          name: userProfile.name || "",
          phone: userProfile.phone || "",
          address: userProfile.address || ""
        });

        // Auto-generate Delivery ID if not exists
        if (!userProfile.deliveryId) {
          generateDeliveryId();
        }
      }
    }
  }, [user, userProfile, authLoading, router]);

  const generateDeliveryId = () => {
    if (!user) return;
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const newDeliveryId = `LV-JHP-${randomNum}`; // JHP for Jahangirpuri default
    const userRef = doc(firestore, "users", user.uid);
    updateDocumentNonBlocking(userRef, { 
      deliveryId: newDeliveryId,
      areaCode: "JHP"
    });
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsUpdating(true);
    const userRef = doc(firestore, "users", user.uid);
    
    updateDocumentNonBlocking(userRef, {
      name: formData.name,
      phone: formData.phone,
      address: formData.address
    });

    toast({
      title: "Profile Updated!",
      description: "Aapki details safaltapoorvak badal di gayi hain.",
    });
    setIsUpdating(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 200 * 1024) {
      toast({
        variant: "destructive",
        title: "Photo too large",
        description: "Profile photo 200KB se kam honi chahiye.",
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const userRef = doc(firestore, "users", user.uid);
      updateDocumentNonBlocking(userRef, { photoURL: base64String });
      toast({
        title: "Photo Updated",
        description: "Aapka naya profile picture save ho gaya hai.",
      });
    };
    reader.readAsDataURL(file);
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setIsResettingPassword(true);
    try {
      await sendPasswordResetEmail(auth, user.email);
      toast({
        title: "Reset Link Sent",
        description: "Aapki email par password badalne ka link bhej diya gaya hai.",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Reset email nahi bheja ja saka. Baad mein try karein.",
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  if (authLoading || (user && !userProfile)) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 text-primary rounded-2xl">
            <UserCircle className="h-10 w-10" />
          </div>
          <div>
            <h1 className="text-3xl font-black font-headline">My Dashboard</h1>
            <p className="text-muted-foreground">Manage your account and preferences.</p>
          </div>
        </div>
        
        {userProfile?.deliveryId && (
          <div className="bg-primary/5 border-2 border-primary/20 p-4 rounded-2xl flex flex-col items-center md:items-end">
            <div className="flex items-center gap-2 text-primary font-black text-sm uppercase">
              <Truck className="h-4 w-4" /> Delivery ID
            </div>
            <p className="text-2xl font-black tracking-tighter text-navy">{userProfile.deliveryId}</p>
            <p className="text-[10px] text-muted-foreground font-bold">Show this to delivery partner</p>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Left Side: Avatar and Quick Info */}
        <div className="space-y-6">
          <Card className="text-center pt-8 overflow-hidden">
            <CardContent className="space-y-4">
              <div className="relative w-fit mx-auto group">
                <Avatar className="h-24 w-24 border-4 border-primary/20">
                  <AvatarImage src={userProfile?.photoURL} className="object-cover" />
                  <AvatarFallback className="text-2xl font-black bg-primary/5 text-primary">
                    {userProfile?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <Label 
                  htmlFor="photo-upload" 
                  className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full cursor-pointer shadow-lg hover:scale-110 transition-transform"
                >
                  <Camera className="h-4 w-4" />
                </Label>
                <Input 
                  id="photo-upload" 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handlePhotoUpload}
                />
              </div>
              <div>
                <h2 className="text-xl font-bold">{userProfile?.name}</h2>
                <p className="text-sm text-muted-foreground uppercase tracking-widest font-bold">
                  {userProfile?.role}
                </p>
              </div>
              <div className="pt-4 border-t space-y-2">
                <Button asChild variant="outline" className="w-full gap-2">
                  <Link href="/favorites">
                    <Heart className="h-4 w-4 text-red-500" /> My Favorites
                  </Link>
                </Button>
                <Label 
                  htmlFor="photo-upload" 
                  className="inline-flex items-center justify-center gap-2 text-xs font-bold text-primary cursor-pointer hover:underline p-2"
                >
                  <Upload className="h-3 w-3" /> Change Profile Photo
                </Label>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/10">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" /> Account Status
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-[10px] text-muted-foreground font-bold uppercase">Email Verified</p>
              <p className="text-sm font-medium">{user?.emailVerified ? "Verified ✅" : "Pending ⏳"}</p>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Forms */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Details</CardTitle>
              <CardDescription>Update your contact information and address.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><UserCircle className="h-3 w-3" /> Full Name</Label>
                    <Input 
                      value={formData.name} 
                      onChange={(e) => setFormData({...formData, name: e.target.value})} 
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Phone className="h-3 w-3" /> Phone Number</Label>
                    <Input 
                      value={formData.phone} 
                      onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                      placeholder="e.g. 9876543210"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Mail className="h-3 w-3" /> Email Address</Label>
                  <Input value={userProfile?.email} disabled className="bg-muted opacity-70" />
                  <p className="text-[10px] text-muted-foreground">Email change karne ke liye support se sampark karein.</p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><MapPin className="h-3 w-3" /> Delivery Address</Label>
                  <Textarea 
                    value={formData.address} 
                    onChange={(e) => setFormData({...formData, address: e.target.value})} 
                    placeholder="Apna pura pata likhein..."
                    className="min-h-[100px]"
                  />
                </div>

                <Button type="submit" className="w-full gap-2" disabled={isUpdating}>
                  {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-destructive/20">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <Lock className="h-5 w-5" /> Account Security
              </CardTitle>
              <CardDescription>Secure your account with a strong password.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/50 p-4 rounded-xl flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-bold">Change Password</p>
                  <p className="text-xs text-muted-foreground">Hum aapke email par password reset link bhejenge.</p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={handlePasswordReset} 
                  disabled={isResettingPassword}
                  className="shrink-0"
                >
                  {isResettingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Link"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
