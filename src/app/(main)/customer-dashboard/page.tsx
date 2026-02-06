
"use client";

import { useState, useEffect, useMemo } from "react";
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
  MapPin, 
  Lock, 
  Save, 
  Loader2, 
  Camera,
  Upload,
  Truck,
  Building2,
  Heart,
  User as UserIcon,
  Phone
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { compressImage } from "@/lib/utils";
import Link from "next/link";

const states = [
  "Delhi", "Maharashtra", "Karnataka", "Tamil Nadu", "Uttar Pradesh", "Bihar", 
  "West Bengal", "Gujarat", "Rajasthan", "Punjab", "Haryana", "Madhya Pradesh", "Others"
];

export default function CustomerDashboardPage() {
  const { user, userProfile, loading: authLoading, isSyncing } = useAuth();
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
    state: "Delhi",
    pincode: "",
    country: "India"
  });
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isFormInitialized, setIsFormInitialized] = useState(false);

  // THE BRIDGE FIX: Robust initialization that waits for profile data
  useEffect(() => {
    if (!authLoading && !isSyncing) {
      if (!user) {
        router.push("/login");
      } else if (userProfile && !isFormInitialized) {
        // Ensuring local state gets the data from Firestore context
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
        setIsFormInitialized(true);
      }
    }
  }, [user, userProfile, authLoading, isSyncing, router, isFormInitialized]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isFormInitialized) return;

    setIsUpdating(true);
    try {
      const userRef = doc(firestore, "users", user.uid);
      
      // We use setDocument with merge: true to ensure the record is ALWAYS permanent
      await setDocumentNonBlocking(userRef, {
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
        title: "Details Saved Permanent!",
        description: "Aapka profile Firestore mein update ho gaya hai.",
      });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Save nahi ho paya." });
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      toast({ title: "Optimizing Photo...", description: "Kripya intezar karein." });
      const compressedBase64 = await compressImage(file, 500);
      
      const userRef = doc(firestore, "users", user.uid);
      setDocumentNonBlocking(userRef, { photoURL: compressedBase64 }, { merge: true });
      
      toast({ title: "Photo Updated" });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Photo optimize nahi ho payi." });
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setIsResettingPassword(true);
    try {
      await sendPasswordResetEmail(auth, user.email);
      toast({ title: "Reset Link Sent", description: "Email check karein." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error" });
    } finally {
      setIsResettingPassword(false);
    }
  };

  // Prevent UI flicker by waiting for sync
  if (authLoading || isSyncing || (user && !userProfile && !isFormInitialized)) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse font-bold">Connecting with Firestore Bridge...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Profile Card (Matches User Screenshot) */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="text-center pt-8 overflow-hidden border-none shadow-md bg-white">
            <CardContent className="space-y-4">
              <div className="relative w-fit mx-auto">
                <Avatar className="h-32 w-32 border-4 border-primary/10 shadow-lg">
                  <AvatarImage src={userProfile?.photoURL} className="object-cover" />
                  <AvatarFallback className="text-4xl font-black bg-primary/5 text-primary">
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
                <h2 className="text-2xl font-black font-headline tracking-tight">{userProfile?.name || "Noorul Isalam"}</h2>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black opacity-60">
                  {userProfile?.role || 'customer'} Account
                </p>
              </div>

              <div className="pt-4 border-t space-y-3">
                <Button asChild variant="outline" className="w-full rounded-xl h-11 border-primary/20 hover:bg-primary/5 text-primary font-bold">
                  <Link href="/favorites">
                    <Heart className="h-4 w-4 mr-2 text-red-500 fill-red-500" /> My Saved Shops
                  </Link>
                </Button>
                <Label 
                  htmlFor="photo-upload" 
                  className="inline-flex items-center justify-center gap-2 text-[10px] font-black uppercase text-primary/60 cursor-pointer hover:text-primary transition-colors"
                >
                  <Upload className="h-3 w-3" /> Update Profile Photo
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Security Card */}
          <Card className="border-destructive/10 bg-destructive/5 shadow-sm rounded-xl overflow-hidden">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs flex items-center gap-2 text-destructive uppercase font-black">
                <Lock className="h-3.5 w-3.5" /> Security
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2 flex items-center justify-between">
              <p className="text-[10px] font-bold text-muted-foreground">Password Update</p>
              <Button size="sm" variant="outline" onClick={handlePasswordReset} disabled={isResettingPassword} className="h-7 text-[10px] uppercase font-black bg-white hover:bg-destructive hover:text-white transition-colors">
                {isResettingPassword ? "Sending..." : "Reset"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Information Form (Matches User Screenshot) */}
        <div className="lg:col-span-8">
          <Card className="shadow-xl border-none bg-white rounded-2xl">
            <CardHeader className="border-b bg-muted/5 p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black font-headline">Delivery Information</CardTitle>
                  <CardDescription className="text-muted-foreground font-medium mt-1">
                    Ye details delivery partners ko aapka ghar dhoondhne mein madad karengi.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleUpdateProfile} className="space-y-8">
                {/* Personal Section */}
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter">Full Name</Label>
                    <Input 
                      value={formData.name} 
                      onChange={(e) => setFormData({...formData, name: e.target.value})} 
                      required 
                      className="rounded-xl h-12 border-primary/10 focus:border-primary transition-all" 
                      placeholder="Noorul Isalam"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter">Phone Number</Label>
                    <Input 
                      value={formData.phone} 
                      onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                      placeholder="99xxxxxx" 
                      className="rounded-xl h-12 border-primary/10 focus:border-primary transition-all" 
                    />
                  </div>
                </div>

                {/* Address Section */}
                <div className="space-y-6 pt-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-dashed">
                    <Building2 className="h-4 w-4 text-primary" />
                    <span className="text-sm font-black uppercase tracking-tight text-primary">Structured Address</span>
                  </div>
                  
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">House / Flat / Floor No.</Label>
                      <Input value={formData.houseNo} onChange={(e) => setFormData({...formData, houseNo: e.target.value})} placeholder="e.g. A-123, 2nd Floor" className="rounded-xl h-12" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">Street / Colony / Area</Label>
                      <Input value={formData.street} onChange={(e) => setFormData({...formData, street: e.target.value})} placeholder="e.g. Main Market, Block G" className="rounded-xl h-12" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Landmark (Optional)</Label>
                    <Input value={formData.landmark} onChange={(e) => setFormData({...formData, landmark: e.target.value})} placeholder="e.g. Near Shiv Mandir" className="rounded-xl h-12" />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">City</Label>
                      <Input value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} placeholder="e.g. Delhi" className="rounded-xl h-12" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">Pincode</Label>
                      <Input value={formData.pincode} onChange={(e) => setFormData({...formData, pincode: e.target.value})} placeholder="1100xx" className="rounded-xl h-12" />
                    </div>
                    <div className="space-y-2 col-span-2 sm:col-span-1">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">State</Label>
                      <Select value={formData.state} onValueChange={(v) => setFormData({...formData, state: v})}>
                        <SelectTrigger className="rounded-xl h-12 border-primary/10">
                          <SelectValue placeholder="Select State" />
                        </SelectTrigger>
                        <SelectContent>
                          {states.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <Button type="submit" className="w-full h-14 rounded-2xl gap-3 font-black text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all" disabled={isUpdating || !isFormInitialized}>
                    {isUpdating ? <Loader2 className="h-6 w-6 animate-spin" /> : <Save className="h-6 w-6" />}
                    Save My Details Permanent
                  </Button>
                  <p className="text-[10px] text-center mt-4 text-muted-foreground font-bold uppercase opacity-60">Data is securely stored in Google Firebase Cloud Firestore.</p>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
