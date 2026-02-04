
"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { collection, query, where, doc, orderBy } from "firebase/firestore";
import { 
  useFirestore, 
  useCollection, 
  useMemoFirebase,
  updateDocumentNonBlocking,
  useAuth as useFirebaseAuth
} from "@/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Loader2, 
  Truck, 
  Package, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Navigation2, 
  Phone, 
  BadgeCheck,
  TrendingUp,
  History,
  AlertCircle,
  UserCircle,
  Camera,
  Upload,
  Lock,
  Save,
  Building2
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Order } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

const stateList = [
  "Delhi", "Maharashtra", "Karnataka", "Tamil Nadu", "Uttar Pradesh", "Bihar", 
  "West Bengal", "Gujarat", "Rajasthan", "Punjab", "Haryana", "Madhya Pradesh", "Others"
];

export default function DeliveryDashboardPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const auth = useFirebaseAuth();

  // Form State
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
  const [isUpdatingAccount, setIsUpdatingAccount] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Sync Form Data
  useEffect(() => {
    if (userProfile) {
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
    }
  }, [userProfile]);

  // Redirect if not delivery boy
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else if (userProfile && userProfile.role !== 'delivery-boy') {
        router.push("/");
      }
    }
  }, [user, userProfile, authLoading, router]);

  // Fetch Available Orders
  const availableOrdersQuery = useMemoFirebase(() => 
    query(collection(firestore, "orders"), where("status", "==", "pending")), 
    [firestore]
  );
  const { data: availableOrders, isLoading: loadingAvailable } = useCollection<Order>(availableOrdersQuery);

  // Fetch My Orders
  const myOrdersQuery = useMemoFirebase(() => 
    user ? query(collection(firestore, "orders"), where("deliveryBoyId", "==", user.uid)) : null, 
    [firestore, user]
  );
  const { data: myOrders, isLoading: loadingMyOrders } = useCollection<Order>(myOrdersQuery);

  const activeDeliveries = useMemo(() => 
    myOrders?.filter(o => ["assigned", "picked-up", "out-for-delivery"].includes(o.status)) || [], 
    [myOrders]
  );

  const completedDeliveries = useMemo(() => 
    myOrders?.filter(o => o.status === "delivered") || [], 
    [myOrders]
  );

  const handleAcceptOrder = (orderId: string) => {
    if (!user || !userProfile) return;
    const orderRef = doc(firestore, "orders", orderId);
    updateDocumentNonBlocking(orderRef, {
      deliveryBoyId: user.uid,
      deliveryBoyName: userProfile.name,
      status: "assigned"
    });
    toast({ title: "Order Accepted!", description: "Ab aap is order ko deliver kar sakte hain." });
  };

  const handleUpdateStatus = (orderId: string, newStatus: Order['status']) => {
    const orderRef = doc(firestore, "orders", orderId);
    updateDocumentNonBlocking(orderRef, { status: newStatus });
    toast({ title: "Status Updated", description: `Order status changed to ${newStatus}.` });
  };

  const handleUpdateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsUpdatingAccount(true);
    const userRef = doc(firestore, "users", user.uid);
    updateDocumentNonBlocking(userRef, {
      name: formData.name,
      phone: formData.phone,
      houseNo: formData.houseNo,
      street: formData.street,
      landmark: formData.landmark,
      city: formData.city,
      state: formData.state,
      pincode: formData.pincode,
      country: formData.country
    });
    toast({ title: "Profile Updated", description: "Aapki jankari save ho gayi hai." });
    setIsUpdatingAccount(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 200 * 1024) {
      toast({ variant: "destructive", title: "Photo too large", description: "Profile photo 200KB se kam honi chahiye." });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const userRef = doc(firestore, "users", user.uid);
      updateDocumentNonBlocking(userRef, { photoURL: reader.result as string });
      toast({ title: "Photo Updated" });
    };
    reader.readAsDataURL(file);
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setIsResettingPassword(true);
    try {
      await sendPasswordResetEmail(auth, user.email);
      toast({ title: "Reset Link Sent", description: "Aapki email check karein." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error" });
    } finally {
      setIsResettingPassword(false);
    }
  };

  if (authLoading || (user && !userProfile)) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading Delivery Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-primary">
            <AvatarImage src={userProfile?.photoURL} className="object-cover" />
            <AvatarFallback className="bg-primary/10 text-primary font-black">{userProfile?.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-black font-headline">{userProfile?.name || "Delivery Partner"}</h1>
            <p className="text-muted-foreground text-sm">Status: Active & Online</p>
          </div>
        </div>
        
        <div className="flex gap-4">
           <Card className="shadow-sm border-none bg-primary/5">
             <CardContent className="p-4 flex items-center gap-3">
               <div className="p-2 bg-primary/10 rounded-lg text-primary"><BadgeCheck className="h-5 w-5" /></div>
               <div>
                 <p className="text-[10px] uppercase font-black text-muted-foreground">Earnings</p>
                 <p className="text-xl font-black">₹{completedDeliveries.length * 40}</p>
               </div>
             </CardContent>
           </Card>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-[10px] font-black uppercase">Active</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Navigation2 className="h-5 w-5 text-blue-500" /> {activeDeliveries.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-[10px] font-black uppercase">Available</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" /> {availableOrders?.length || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-[10px] font-black uppercase">Done</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" /> {completedDeliveries.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-[10px] font-black uppercase">Success Rate</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" /> 100%
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="available" className="w-full">
        <TabsList className="mb-6 w-full justify-start bg-transparent border-b rounded-none h-auto p-0 gap-8 overflow-x-auto no-scrollbar">
          <TabsTrigger value="available" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent shadow-none px-0 pb-4">Orders ({availableOrders?.length || 0})</TabsTrigger>
          <TabsTrigger value="active" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent shadow-none px-0 pb-4">My Task ({activeDeliveries.length})</TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent shadow-none px-0 pb-4">History</TabsTrigger>
          <TabsTrigger value="account" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent shadow-none px-0 pb-4">My Account</TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-4">
          {loadingAvailable ? (
            <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
          ) : availableOrders?.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed rounded-3xl opacity-30">
              <Package className="h-12 w-12 mx-auto mb-4" />
              <p className="font-bold">No new orders in your area.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {availableOrders?.map((order) => (
                <Card key={order.id} className="shadow-md border-primary/10 overflow-hidden">
                  <CardHeader className="bg-primary/5 pb-4">
                    <div className="flex justify-between items-start">
                      <Badge variant="outline" className="bg-white font-black text-[10px]">{order.customerDeliveryId}</Badge>
                      <span className="text-xs font-bold text-primary">₹40 Commission</span>
                    </div>
                    <CardTitle className="text-lg mt-2">{order.productTitle}</CardTitle>
                    <CardDescription className="font-bold text-primary">Pickup: {order.shopName}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <p className="line-clamp-2">{order.address}</p>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t pt-4">
                    <Button onClick={() => handleAcceptOrder(order.id)} className="w-full rounded-xl font-bold">Accept Order</Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
           {activeDeliveries.length === 0 ? (
             <div className="text-center py-20 border-2 border-dashed rounded-3xl opacity-30">
               <Truck className="h-12 w-12 mx-auto mb-4" />
               <p className="font-bold">Aapke paas koi active order nahi hai.</p>
             </div>
           ) : (
             <div className="grid gap-6 md:grid-cols-2">
               {activeDeliveries.map((order) => (
                 <Card key={order.id} className="shadow-lg border-2 border-primary/20">
                    <CardHeader className="border-b bg-muted/30">
                      <div className="flex justify-between items-center">
                         <Badge className="bg-blue-600 font-black uppercase text-[10px]">{order.status}</Badge>
                         <span className="text-[10px] font-bold text-muted-foreground uppercase">{new Date(order.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <CardTitle className="text-xl">{order.productTitle}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                       <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-muted/50 rounded-xl space-y-1">
                             <p className="text-[9px] font-black text-muted-foreground uppercase">Shop (Pickup)</p>
                             <p className="text-sm font-bold">{order.shopName}</p>
                             <Button variant="link" className="p-0 h-auto text-xs" asChild>
                               <a href={`tel:${order.shopPhone}`}><Phone className="h-3 w-3 mr-1" /> Call Shop</a>
                             </Button>
                          </div>
                          <div className="p-3 bg-muted/50 rounded-xl space-y-1">
                             <p className="text-[9px] font-black text-muted-foreground uppercase">Customer</p>
                             <p className="text-sm font-bold">{order.customerName}</p>
                             <Button variant="link" className="p-0 h-auto text-xs" asChild>
                               <a href={`tel:${order.customerPhone}`}><Phone className="h-3 w-3 mr-1" /> Call Customer</a>
                             </Button>
                          </div>
                       </div>
                       <div className="flex items-start gap-2 p-3 bg-primary/5 rounded-xl border border-primary/10">
                          <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[9px] font-black text-primary uppercase">Delivery Address</p>
                            <p className="text-xs font-medium leading-relaxed">{order.address}</p>
                            <Badge variant="outline" className="mt-2 text-[10px] border-primary text-primary font-black">{order.customerDeliveryId}</Badge>
                          </div>
                       </div>
                    </CardContent>
                    <CardFooter className="border-t grid grid-cols-2 gap-2 pt-4 bg-muted/10">
                       {order.status === 'assigned' && (
                         <Button className="col-span-2 w-full bg-orange-500 hover:bg-orange-600 font-bold h-11" onClick={() => handleUpdateStatus(order.id, 'picked-up')}>Mark as Picked Up</Button>
                       )}
                       {order.status === 'picked-up' && (
                         <Button className="col-span-2 w-full bg-blue-500 hover:bg-blue-600 font-bold h-11" onClick={() => handleUpdateStatus(order.id, 'out-for-delivery')}>Mark as Out for Delivery</Button>
                       )}
                       {order.status === 'out-for-delivery' && (
                         <Button className="col-span-2 w-full bg-green-600 hover:bg-green-700 font-bold h-11" onClick={() => handleUpdateStatus(order.id, 'delivered')}>Confirm Delivery ✅</Button>
                       )}
                    </CardFooter>
                 </Card>
               ))}
             </div>
           )}
        </TabsContent>

        <TabsContent value="history">
           <Card>
             <CardHeader><CardTitle className="text-lg flex items-center gap-2"><History className="h-5 w-5" /> Completed Deliveries</CardTitle></CardHeader>
             <CardContent className="p-0">
                <div className="divide-y">
                   {completedDeliveries.length === 0 ? (
                     <div className="p-10 text-center opacity-30">No history available yet.</div>
                   ) : (
                     completedDeliveries.map(order => (
                       <div key={order.id} className="p-4 flex justify-between items-center hover:bg-muted/30">
                          <div>
                            <p className="font-bold text-sm">{order.productTitle}</p>
                            <p className="text-[10px] text-muted-foreground uppercase">{order.customerName} • {new Date(order.createdAt).toLocaleDateString()}</p>
                          </div>
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">+ ₹40</Badge>
                       </div>
                     ))
                   )}
                </div>
             </CardContent>
           </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-6">
          <div className="grid md:grid-cols-12 gap-6">
            <div className="md:col-span-4 space-y-6">
              <Card className="text-center pt-8">
                <CardContent className="space-y-4">
                  <div className="relative w-fit mx-auto group">
                    <Avatar className="h-28 w-28 border-4 border-primary/20">
                      <AvatarImage src={userProfile?.photoURL} className="object-cover" />
                      <AvatarFallback className="text-3xl font-black bg-primary/5 text-primary">
                        {userProfile?.name?.charAt(0)}
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
                  <p className="text-xs font-black uppercase text-muted-foreground tracking-widest opacity-60">Delivery Partner</p>
                  <Button asChild variant="ghost" className="text-xs text-primary p-0 h-auto">
                    <Label htmlFor="photo-upload" className="cursor-pointer">Update Photo</Label>
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-destructive/20 bg-destructive/5">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-destructive"><Lock className="h-4 w-4" /> Security</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-2 flex items-center justify-between">
                  <p className="text-xs font-bold text-muted-foreground">Account Password</p>
                  <Button size="sm" variant="outline" onClick={handlePasswordReset} disabled={isResettingPassword} className="h-7 text-[10px] uppercase font-black">
                    {isResettingPassword ? "Sending..." : "Reset"}
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="md:col-span-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2"><UserCircle className="h-5 w-5 text-primary" /> Personal Details</CardTitle>
                  <CardDescription>Aapki profile aur professional delivery details.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateAccount} className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground">Full Name</Label>
                        <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground">Phone Number</Label>
                        <Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                      <div className="flex items-center gap-2 pb-2">
                        <Building2 className="h-4 w-4 text-primary" />
                        <span className="text-sm font-black uppercase tracking-tight">Professional Address</span>
                      </div>
                      
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground">House / Flat No.</Label>
                          <Input value={formData.houseNo} onChange={(e) => setFormData({...formData, houseNo: e.target.value})} placeholder="A-123" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground">Street / Colony</Label>
                          <Input value={formData.street} onChange={(e) => setFormData({...formData, street: e.target.value})} placeholder="Main Road" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground">Landmark</Label>
                        <Input value={formData.landmark} onChange={(e) => setFormData({...formData, landmark: e.target.value})} placeholder="Near Public Park" />
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground">City</Label>
                          <Input value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground">Pincode</Label>
                          <Input value={formData.pincode} onChange={(e) => setFormData({...formData, pincode: e.target.value})} />
                        </div>
                        <div className="space-y-2 col-span-2 sm:col-span-1">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground">State</Label>
                          <Select value={formData.state} onValueChange={(v) => setFormData({...formData, state: v})}>
                            <SelectTrigger>
                              <SelectValue placeholder="State" />
                            </SelectTrigger>
                            <SelectContent>
                              {stateList.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <Button type="submit" className="w-full gap-2 font-bold" disabled={isUpdatingAccount}>
                      {isUpdatingAccount ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Profile
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
