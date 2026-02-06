
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { doc } from "firebase/firestore";
import { 
  useFirestore, 
  setDocumentNonBlocking, 
  useAuth as useFirebaseAuth 
} from "@/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Truck,
  Building2,
  Navigation2
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { compressImage } from "@/lib/utils";

const states = [
  "Delhi", "Maharashtra", "Karnataka", "Tamil Nadu", "Uttar Pradesh", "Bihar", 
  "West Bengal", "Gujarat", "Rajasthan", "Punjab", "Haryana", "Madhya Pradesh", "Others"
];

export default function CustomerDashboardPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const auth = useFirebaseAuth();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    houseNo: "",
    street: "",
    landmark: "",
    city: "",
    state: "",
    pincode: "",
    country: "India"
  });
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isFormInitialized, setIsFormInitialized] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else if (userProfile && !isFormInitialized) {
        // Only initialize form once real data arrives from Firestore
        setFormData({
          name: userProfile.name || "",
          phone: userProfile.phone || "",
          houseNo: userProfile.houseNo || "",
          street: userProfile.street || "",
          landmark: userProfile.landmark || "",
          city: userProfile.city || "",
          state: userProfile.state || "Delhi",
          pincode: userProfile.pincode || "",
          country: userProfile.country || "India"
        });

        if (!userProfile.deliveryId) {
          generateDeliveryId();
        }
        setIsFormInitialized(true);
      }
    }
  }, [user, userProfile, authLoading, router, isFormInitialized]);

  const generateDeliveryId = () => {
    if (!user) return;
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const newDeliveryId = `LV-JHP-${randomNum}`;
    const userRef = doc(firestore, "users", user.uid);
    // Use setDocumentNonBlocking with merge: true for better resilience
    setDocumentNonBlocking(userRef, { 
      deliveryId: newDeliveryId,
      areaCode: "JHP"
    }, { merge: true });
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isFormInitialized) return;

    setIsUpdating(true);
    const userRef = doc(firestore, "users", user.uid);
    
    // setDocumentNonBlocking ensures the doc is created or updated correctly
    setDocumentNonBlocking(userRef, {
      name: formData.name,
      phone: formData.phone,
      houseNo: formData.houseNo,
      street: formData.street,
      landmark: formData.landmark,
      city: formData.city,
      state: formData.state,
      pincode: formData.pincode,
      country: formData.country,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    toast({
      title: "Profile Updated!",
      description: "Aapki professional delivery details save ho gayi hain.",
    });
    setIsUpdating(false);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      toast({ title: "Optimizing Photo...", description: "Kripya intezar karein." });
      const compressedBase64 = await compressImage(file, 500);
      
      const userRef = doc(firestore, "users", user.uid);
      setDocumentNonBlocking(userRef, { photoURL: compressedBase64 }, { merge: true });
      
      toast({
        title: "Photo Updated",
        description: "Aapka naya profile picture save ho gaya hai.",
      });
    } catch (err) {
      console.error("Photo processing failed:", err);
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: "Photo update nahi ho payi. Dobara try karein." 
      });
    }
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
        description: "Reset email nahi bheja ja saka.",
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  if (authLoading || (user && !userProfile && !isFormInitialized)) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 text-primary rounded-2xl">
            <UserCircle className="h-10 w-10" />
          </div>
          <div>
            <h1 className="text-3xl font-black font-headline">My Dashboard</h1>
            <p className="text-muted-foreground">Manage your delivery settings.</p>
          </div>
        </div>
        
        {userProfile?.deliveryId && (
          <div className="bg-primary text-white p-4 rounded-2xl flex flex-col items-center md:items-end shadow-lg shadow-primary/20">
            <div className="flex items-center gap-2 font-black text-xs uppercase opacity-80">
              <Truck className="h-4 w-4" /> Delivery ID
            </div>
            <p className="text-2xl font-black tracking-tighter">{userProfile.deliveryId}</p>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-12 gap-8">
        <div className="md:col-span-4 space-y-6">
          <Card className="text-center pt-8 overflow-hidden">
            <CardContent className="space-y-4">
              <div className="relative w-fit mx-auto group">
                <Avatar className="h-28 w-28 border-4 border-primary/20">
                  <AvatarImage src={userProfile?.photoURL} className="object-cover" />
                  <AvatarFallback className="text-3xl font-black bg-primary/5 text-primary">
                    {userProfile?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <Label 
                  htmlFor="photo-upload" 
                  className="absolute bottom-1 right-1 p-2 bg-primary text-white rounded-full cursor-pointer shadow-lg hover:scale-110 transition-transform"
                >
                  <Camera className="h-4 w-4" />
                </Label>
                <input id="photo-upload" type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </div>
              <div>
                <h2 className="text-xl font-bold">{userProfile?.name}</h2>
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-black opacity-60">
                  {userProfile?.role} Account
                </p>
              </div>
              <div className="pt-4 border-t space-y-2">
                <Button asChild variant="outline" className="w-full gap-2 rounded-xl">
                  <Link href="/favorites">
                    <Heart className="h-4 w-4 text-red-500" /> My Saved Shops
                  </Link>
                </Button>
                <Label 
                  htmlFor="photo-upload" 
                  className="inline-flex items-center justify-center gap-2 text-[10px] font-black uppercase text-primary cursor-pointer hover:underline p-2"
                >
                  <Upload className="h-3 w-3" /> Update Photo
                </Label>
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive/20 bg-destructive/5">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                <Lock className="h-4 w-4" /> Security
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2 flex items-center justify-between">
              <p className="text-xs font-bold text-muted-foreground">Password Update</p>
              <Button size="sm" variant="outline" onClick={handlePasswordReset} disabled={isResettingPassword} className="h-7 text-[10px] uppercase font-black">
                {isResettingPassword ? "Sending..." : "Reset"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-8">
          <Card className="shadow-md border-none">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /> Delivery Information</CardTitle>
              <CardDescription>Ye details delivery partners ko aapka ghar dhoondhne mein madad karengi.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-muted-foreground">Full Name</Label>
                    <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-muted-foreground">Phone Number</Label>
                    <Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="99xxxxxx" className="rounded-xl" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <Building2 className="h-4 w-4 text-primary" />
                    <span className="text-sm font-black uppercase tracking-tight">Structured Address</span>
                  </div>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">House / Flat / Floor No.</Label>
                      <Input value={formData.houseNo} onChange={(e) => setFormData({...formData, houseNo: e.target.value})} placeholder="e.g. A-123, 2nd Floor" className="rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">Street / Colony / Area</Label>
                      <Input value={formData.street} onChange={(e) => setFormData({...formData, street: e.target.value})} placeholder="e.g. Main Market, Block G" className="rounded-xl" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Landmark (Optional)</Label>
                    <Input value={formData.landmark} onChange={(e) => setFormData({...formData, landmark: e.target.value})} placeholder="e.g. Near Shiv Mandir" className="rounded-xl" />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">City</Label>
                      <Input value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} placeholder="e.g. Delhi" className="rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">Pincode</Label>
                      <Input value={formData.pincode} onChange={(e) => setFormData({...formData, pincode: e.target.value})} placeholder="1100xx" className="rounded-xl" />
                    </div>
                    <div className="space-y-2 col-span-2 sm:col-span-1">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">State</Label>
                      <Select value={formData.state} onValueChange={(v) => setFormData({...formData, state: v})}>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Select State" />
                        </SelectTrigger>
                        <SelectContent>
                          {states.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Button type="submit" className="w-full h-12 rounded-xl gap-2 font-bold shadow-lg" disabled={isUpdating || !isFormInitialized}>
                  {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Delivery Address Permanent
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
