
"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { collection, query, where, doc } from "firebase/firestore";
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
  Building2,
  Store,
  User,
  Hash,
  Volume2,
  VolumeX
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
import { generateOrderVoiceBrief } from "@/ai/flows/order-summary-flow";

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

  const [formData, setFormData] = useState({
    name: "", phone: "", houseNo: "", street: "", landmark: "", city: "", state: "", pincode: "", country: "India"
  });
  const [isUpdatingAccount, setIsUpdatingAccount] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState<string | null>(null);

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

  useEffect(() => {
    if (!authLoading) {
      if (!user) router.push("/login");
      else if (userProfile && userProfile.role !== 'delivery-boy') router.push("/");
    }
  }, [user, userProfile, authLoading, router]);

  const availableOrdersQuery = useMemoFirebase(() => 
    query(collection(firestore, "orders"), where("status", "==", "pending")), 
    [firestore]
  );
  const { data: availableOrders, isLoading: loadingAvailable } = useCollection<Order>(availableOrdersQuery);

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

  const handleListenBrief = async (order: Order) => {
    setIsSummarizing(order.id);
    try {
      const res = await generateOrderVoiceBrief({
        productTitle: order.productTitle,
        shopName: order.shopName,
        customerName: order.customerName,
        address: order.address
      });
      const audio = new Audio(res.media);
      audio.play();
    } catch (err) {
      toast({ variant: "destructive", title: "AI Error", description: "Briefing available nahi hai." });
    } finally {
      setIsSummarizing(null);
    }
  };

  const handleAcceptOrder = (orderId: string) => {
    if (!user || !userProfile) return;
    if (!userProfile.phone) {
      toast({ variant: "destructive", title: "Action Denied", description: "Pehle Dashboard mein phone number save karein." });
      return;
    }
    updateDocumentNonBlocking(doc(firestore, "orders", orderId), {
      deliveryBoyId: user.uid,
      deliveryBoyName: userProfile.name,
      deliveryBoyPhone: userProfile.phone,
      status: "assigned"
    });
    toast({ title: "Order Accepted!" });
  };

  const handleUpdateStatus = (orderId: string, newStatus: Order['status']) => {
    updateDocumentNonBlocking(doc(firestore, "orders", orderId), { status: newStatus });
    toast({ title: "Status Updated" });
  };

  const handleUpdateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingAccount(true);
    updateDocumentNonBlocking(doc(firestore, "users", user!.uid), formData);
    toast({ title: "Profile Updated" });
    setIsUpdatingAccount(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      updateDocumentNonBlocking(doc(firestore, "users", user!.uid), { photoURL: reader.result as string });
      toast({ title: "Photo Updated" });
    };
    reader.readAsDataURL(file);
  };

  if (authLoading || (user && !userProfile)) {
    return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
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
            <h1 className="text-3xl font-black font-headline">{userProfile?.name || "Partner"}</h1>
            <p className="text-muted-foreground text-sm">LV Delivery Expert • Online</p>
          </div>
        </div>
        <Card className="bg-primary/5 border-none"><CardContent className="p-4 flex items-center gap-3"><BadgeCheck className="text-primary" /><div><p className="text-[10px] uppercase font-black opacity-60">Earnings</p><p className="text-xl font-black">₹{completedDeliveries.length * 40}</p></div></CardContent></Card>
      </div>

      <Tabs defaultValue="available" className="w-full">
        <TabsList className="mb-6 justify-start bg-transparent border-b rounded-none gap-8 overflow-x-auto no-scrollbar">
          <TabsTrigger value="available" className="data-[state=active]:border-b-2 data-[state=active]:border-primary bg-transparent font-black uppercase text-[10px]">New Orders</TabsTrigger>
          <TabsTrigger value="active" className="data-[state=active]:border-b-2 data-[state=active]:border-primary bg-transparent font-black uppercase text-[10px]">Current Task</TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:border-b-2 data-[state=active]:border-primary bg-transparent font-black uppercase text-[10px]">History</TabsTrigger>
          <TabsTrigger value="account" className="data-[state=active]:border-b-2 data-[state=active]:border-primary bg-transparent font-black uppercase text-[10px]">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-4">
          {availableOrders?.length === 0 ? <div className="text-center py-20 opacity-30 border-2 border-dashed rounded-3xl"><Package className="h-12 w-12 mx-auto mb-4" /><p>No orders available.</p></div> : 
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {availableOrders?.map((order) => (
                <Card key={order.id} className="shadow-md border-primary/10">
                  <CardHeader className="bg-primary/5">
                    <div className="flex justify-between mb-2"><Badge variant="outline" className="text-[9px] uppercase"><Hash className="h-2 w-2 mr-1" /> {order.displayOrderId}</Badge><Badge variant="secondary" className="text-[9px] uppercase">{order.customerDeliveryId}</Badge></div>
                    <CardTitle className="text-lg">{order.productTitle}</CardTitle>
                    <CardDescription className="font-bold text-primary flex items-center gap-1"><Store className="h-3 w-3" /> Pickup: {order.shopName}</CardDescription>
                  </CardHeader>
                  <CardFooter className="pt-4 flex gap-2">
                    <Button onClick={() => handleAcceptOrder(order.id)} className="flex-1 font-bold">Accept</Button>
                    <Button variant="outline" size="icon" onClick={() => handleListenBrief(order)} disabled={isSummarizing === order.id}>
                      {isSummarizing === order.id ? <Loader2 className="animate-spin h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          }
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
           {activeDeliveries.length === 0 ? <div className="text-center py-20 opacity-30 border-2 border-dashed rounded-3xl"><Truck className="h-12 w-12 mx-auto mb-4" /><p>No active tasks.</p></div> : 
             <div className="grid gap-6 md:grid-cols-2">
               {activeDeliveries.map((order) => (
                 <Card key={order.id} className="shadow-lg border-2 border-primary/20">
                    <CardHeader className="border-b bg-muted/30">
                      <div className="flex justify-between items-center"><Badge className="bg-blue-600 uppercase text-[10px]">{order.status}</Badge><Button variant="ghost" size="sm" className="h-8 gap-2" onClick={() => handleListenBrief(order)} disabled={isSummarizing === order.id}>{isSummarizing === order.id ? <Loader2 className="animate-spin h-3 w-3" /> : <Volume2 className="h-3 w-3" />} Listen Brief</Button></div>
                      <CardTitle className="text-xl mt-2">{order.productTitle}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                       <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                             <p className="text-[10px] font-black text-primary uppercase">Pickup</p>
                             <p className="text-sm font-bold truncate">{order.shopName}</p>
                             <Button variant="outline" size="sm" className="w-full mt-2 h-8" asChild><a href={`tel:${order.shopPhone}`}><Phone className="h-3 w-3 mr-1" /> Call Shop</a></Button>
                          </div>
                          <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                             <p className="text-[10px] font-black text-orange-600 uppercase">Deliver</p>
                             <p className="text-sm font-bold truncate">{order.customerName}</p>
                             <Button variant="outline" size="sm" className="w-full mt-2 h-8 border-orange-500 text-orange-600" asChild><a href={`tel:${order.customerPhone}`}><Phone className="h-3 w-3 mr-1" /> Call Customer</a></Button>
                          </div>
                       </div>
                       <div className="flex items-start gap-2 p-3 bg-muted rounded-xl"><MapPin className="h-5 w-5 text-muted-foreground mt-0.5" /><div><p className="text-[10px] font-black uppercase">Address</p><p className="text-xs font-medium">{order.address}</p></div></div>
                    </CardContent>
                    <CardFooter className="border-t pt-4">
                       {order.status === 'assigned' && <Button className="w-full bg-orange-500 h-12 font-bold" onClick={() => handleUpdateStatus(order.id, 'picked-up')}>Picked Up</Button>}
                       {order.status === 'picked-up' && <Button className="w-full bg-blue-500 h-12 font-bold" onClick={() => handleUpdateStatus(order.id, 'out-for-delivery')}>On the Way</Button>}
                       {order.status === 'out-for-delivery' && <Button className="w-full bg-green-600 h-12 font-bold" onClick={() => handleUpdateStatus(order.id, 'delivered')}>Delivered ✅</Button>}
                    </CardFooter>
                 </Card>
               ))}
             </div>
           }
        </TabsContent>

        <TabsContent value="history"><Card><CardHeader><CardTitle>Past Tasks</CardTitle></CardHeader><CardContent className="p-0"><div className="divide-y">{completedDeliveries.length === 0 ? <div className="p-10 text-center opacity-30">No history.</div> : completedDeliveries.map(o => <div key={o.id} className="p-4 flex justify-between items-center"><div><p className="font-bold text-sm">{o.productTitle}</p><p className="text-[10px] text-muted-foreground uppercase">{o.customerName} • {new Date(o.createdAt).toLocaleDateString()}</p></div><Badge className="bg-green-100 text-green-700">+ ₹40</Badge></div>)}</div></CardContent></Card></TabsContent>

        <TabsContent value="account">
          <Card><CardHeader><CardTitle>Profile Details</CardTitle></CardHeader><CardContent><form onSubmit={handleUpdateAccount} className="space-y-6"><div className="grid sm:grid-cols-2 gap-4"><div className="space-y-2"><Label>Full Name</Label><Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div><div className="space-y-2"><Label>Phone</Label><Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div></div><Button type="submit" className="w-full">Save Changes</Button></form></CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
