
"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { collection, query, where, doc } from "firebase/firestore";
import { 
  useFirestore, 
  useCollection, 
  useMemoFirebase,
  setDocumentNonBlocking,
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
  Phone, 
  BadgeCheck,
  Camera,
  Upload,
  Lock,
  Save,
  Building2,
  Store,
  User,
  Hash,
  Volume2,
  MessageCircle,
  X,
  ImageIcon
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { generateOrderVoiceBrief } from "@/ai/flows/order-summary-flow";
import { compressImage } from "@/lib/utils";
import Image from "next/image";

const states = [
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
  const [isSummarizing, setIsSummarizing] = useState<string | null>(null);
  const [isFormInitialized, setIsFormInitialized] = useState(false);

  // Photo Proof States
  const [activeCameraOrder, setActiveCameraOrder] = useState<Order | null>(null);
  const [cameraType, setCameraType] = useState<'pickup' | 'delivery' | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUpdatingPhoto] = useState(false);

  useEffect(() => {
    if (userProfile && !isFormInitialized) {
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
  }, [userProfile, isFormInitialized]);

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

  const openCamera = async (order: Order, type: 'pickup' | 'delivery') => {
    setActiveCameraOrder(order);
    setCameraType(type);
    setCapturedPhoto(null);
    setIsCameraOpen(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setHasCameraPermission(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera access denied:', err);
      setHasCameraPermission(false);
      toast({
        variant: 'destructive',
        title: 'Camera Error',
        description: 'Please allow camera access to take proof photos.',
      });
    }
  };

  const closeCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setIsCameraOpen(false);
    setActiveCameraOrder(null);
    setCameraType(null);
    setCapturedPhoto(null);
  };

  const capturePhoto = async () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg');
      
      // Auto-compress proof photo
      const file = await (await fetch(dataUrl)).blob();
      const compressed = await compressImage(new File([file], "proof.jpg"), 300);
      setCapturedPhoto(compressed);
    }
  };

  const handleSaveProof = async () => {
    if (!activeCameraOrder || !capturedPhoto || !cameraType) return;
    setIsUpdatingPhoto(true);
    try {
      const orderRef = doc(firestore, "orders", activeCameraOrder.id);
      if (cameraType === 'pickup') {
        updateDocumentNonBlocking(orderRef, { 
          pickupPhoto: capturedPhoto, 
          status: 'picked-up' 
        });
        toast({ title: "Order Picked Up!", description: "Proof photo saved successfully." });
      } else {
        updateDocumentNonBlocking(orderRef, { 
          deliveryPhoto: capturedPhoto, 
          status: 'delivered' 
        });
        toast({ title: "Order Delivered!", description: "Grahak ko delivery proof save ho gaya." });
      }
      closeCamera();
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Photo save nahi ho payi." });
    } finally {
      setIsUpdatingPhoto(false);
    }
  };

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
      toast({ variant: "destructive", title: "Action Denied", description: "Pehle account settings mein phone number save karein." });
      return;
    }
    updateDocumentNonBlocking(doc(firestore, "orders", orderId), {
      deliveryBoyId: user.uid,
      deliveryBoyName: userProfile.name,
      deliveryBoyPhone: userProfile.phone,
      status: "assigned"
    });
    toast({ title: "Order Accepted! 🚀" });
  };

  const handleUpdateStatus = (orderId: string, newStatus: Order['status']) => {
    updateDocumentNonBlocking(doc(firestore, "orders", orderId), { status: newStatus });
    toast({ title: `Status updated to ${newStatus}` });
  };

  const handleUpdateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isFormInitialized) return;
    setIsUpdatingAccount(true);
    
    const userRef = doc(firestore, "users", user.uid);
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
    
    toast({ title: "Profile Updated", description: "Aapki details successfully save ho gayi hain." });
    setIsUpdatingAccount(false);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    try {
      toast({ title: "Optimizing Photo...", description: "Image optimize ho rahi hai." });
      const compressedBase64 = await compressImage(file, 500);
      
      const userRef = doc(firestore, "users", user.uid);
      setDocumentNonBlocking(userRef, { photoURL: compressedBase64 }, { merge: true });
      toast({ title: "Photo Updated" });
    } catch (err) {
      console.error("Photo optimization failed:", err);
      toast({ variant: "destructive", title: "Error", description: "Photo processing fail ho gayi." });
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setIsResettingPassword(true);
    try {
      await sendPasswordResetEmail(auth, user.email);
      toast({ title: "Reset Link Sent", description: "Email check karein." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setIsResettingPassword(false);
    }
  };

  if (authLoading || (user && !userProfile && !isFormInitialized)) {
    return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="animate-spin text-primary h-12 w-12" /></div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20 border-4 border-primary/20">
            <AvatarImage src={userProfile?.photoURL} className="object-cover" />
            <AvatarFallback className="bg-primary/10 text-primary text-2xl font-black">{userProfile?.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-black font-headline">{userProfile?.name || "Partner"}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className="bg-green-500 uppercase text-[10px]">Online</Badge>
              <span className="text-xs text-muted-foreground font-bold uppercase tracking-tighter">LV Delivery Expert</span>
            </div>
          </div>
        </div>
        <Card className="bg-primary/5 border-none shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 bg-primary/10 rounded-full text-primary">
              <BadgeCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-black opacity-60">Today's Earnings</p>
              <p className="text-2xl font-black">₹{completedDeliveries.length * 40}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="available" className="w-full">
        <TabsList className="mb-8 justify-start bg-transparent border-b rounded-none h-auto p-0 gap-8 overflow-x-auto no-scrollbar">
          <TabsTrigger value="available" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none bg-transparent font-black uppercase text-[11px] pb-4 shadow-none">New Orders</TabsTrigger>
          <TabsTrigger value="active" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none bg-transparent font-black uppercase text-[11px] pb-4 shadow-none">Current Task</TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none bg-transparent font-black uppercase text-[11px] pb-4 shadow-none">History</TabsTrigger>
          <TabsTrigger value="account" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none bg-transparent font-black uppercase text-[11px] pb-4 shadow-none">My Account</TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-4">
          {availableOrders?.length === 0 ? (
            <div className="text-center py-24 opacity-30 border-2 border-dashed rounded-[2rem] bg-muted/20">
              <Package className="h-16 w-16 mx-auto mb-4" />
              <p className="font-bold text-lg">Abhi koi naya order nahi hai.</p>
              <p className="text-sm">Wait karein, jald hi naya order aayega!</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {availableOrders?.map((order) => (
                <Card key={order.id} className="shadow-md border-primary/10 group hover:border-primary/40 transition-colors">
                  <CardHeader className="bg-primary/5 rounded-t-lg">
                    <div className="flex justify-between mb-2">
                      <Badge variant="outline" className="text-[9px] uppercase border-primary text-primary font-black">
                        <Hash className="h-2 w-2 mr-1" /> {order.displayOrderId}
                      </Badge>
                      <Badge variant="secondary" className="text-[9px] uppercase font-black">{order.customerDeliveryId}</Badge>
                    </div>
                    <CardTitle className="text-lg">{order.productTitle}</CardTitle>
                    <CardDescription className="font-bold text-primary flex items-center gap-1">
                      <Store className="h-3 w-3" /> Pickup: {order.shopName}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4 pb-2">
                     <div className="space-y-2">
                        <div className="flex items-start gap-2 text-[10px] text-primary font-bold uppercase">
                           <Store className="h-3 w-3 mt-0.5" />
                           <p className="line-clamp-1">FROM: {order.shopAddress || "Address Loading..."}</p>
                        </div>
                        <div className="flex items-start gap-2 text-[10px] text-orange-600 font-bold uppercase">
                           <MapPin className="h-3 w-3 mt-0.5" />
                           <p className="line-clamp-1">TO: {order.address.split(',')[0]}...</p>
                        </div>
                     </div>
                  </CardContent>
                  <CardFooter className="pt-2 flex gap-2">
                    <Button onClick={() => handleAcceptOrder(order.id)} className="flex-1 font-bold h-10">Accept Order</Button>
                    <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => handleListenBrief(order)} disabled={isSummarizing === order.id}>
                      {isSummarizing === order.id ? <Loader2 className="animate-spin h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-6">
           {activeDeliveries.length === 0 ? (
             <div className="text-center py-24 opacity-30 border-2 border-dashed rounded-[2rem]">
               <Truck className="h-16 w-16 mx-auto mb-4" />
               <p className="font-bold">Aapka koi active task nahi hai.</p>
             </div>
           ) : (
             <div className="grid gap-6 md:grid-cols-2">
               {activeDeliveries.map((order) => (
                 <Card key={order.id} className="shadow-xl border-2 border-primary/20 overflow-hidden">
                    <CardHeader className="border-b bg-muted/30">
                      <div className="flex justify-between items-center">
                        <Badge className="bg-blue-600 uppercase text-[10px] font-black">{order.status}</Badge>
                        <Button variant="ghost" size="sm" className="h-8 gap-2 font-bold text-primary" onClick={() => handleListenBrief(order)} disabled={isSummarizing === order.id}>
                          {isSummarizing === order.id ? <Loader2 className="animate-spin h-3 w-3" /> : <Volume2 className="h-3 w-3" />} 
                          Order Brief
                        </Button>
                      </div>
                      <CardTitle className="text-xl mt-2 flex items-center justify-between">
                        {order.productTitle}
                        <span className="text-primary text-sm font-black">ID: {order.displayOrderId}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                       <div className="space-y-4">
                          <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 relative">
                             <div className="flex items-center gap-2 mb-2">
                                <Store className="h-4 w-4 text-primary" />
                                <p className="text-[10px] font-black text-primary uppercase">Pickup From (Shop)</p>
                             </div>
                             <p className="text-sm font-black mb-1">{order.shopName}</p>
                             <p className="text-xs text-muted-foreground leading-relaxed mb-3">{order.shopAddress}</p>
                             <Button variant="outline" size="sm" className="w-full h-9 gap-1 font-bold border-primary text-primary" asChild>
                               <a href={`tel:${order.shopPhone}`}><Phone className="h-3.5 w-3.5" /> Call Shop Owner</a>
                             </Button>
                          </div>

                          <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 relative">
                             <div className="flex items-center gap-2 mb-2">
                                <User className="h-4 w-4 text-orange-600" />
                                <p className="text-[10px] font-black text-orange-600 uppercase">Deliver To (Customer)</p>
                             </div>
                             <p className="text-sm font-black mb-1">{order.customerName}</p>
                             <p className="text-xs text-muted-foreground leading-relaxed mb-3">{order.address}</p>
                             <div className="grid grid-cols-2 gap-2">
                               <Button variant="outline" size="sm" className="h-9 font-bold border-orange-500 text-orange-600 hover:bg-orange-500 hover:text-white" asChild>
                                 <a href={`tel:${order.customerPhone}`}><Phone className="h-3.5 w-3.5" /> Call Customer</a>
                               </Button>
                               <Button variant="outline" size="sm" className="h-9 font-bold border-green-500 text-green-600 hover:bg-green-500 hover:text-white" asChild>
                                 <a href={`https://wa.me/${order.customerPhone?.replace(/\D/g, '')}`} target="_blank"><MessageCircle className="h-3.5 w-3.5" /> WhatsApp</a>
                               </Button>
                             </div>
                          </div>
                       </div>
                    </CardContent>
                    <CardFooter className="border-t pt-4 grid grid-cols-1 gap-2">
                       {order.status === 'assigned' && (
                         <Button className="w-full bg-primary h-14 font-black rounded-2xl gap-3 shadow-lg shadow-primary/20" onClick={() => openCamera(order, 'pickup')}>
                           <Camera className="h-6 w-6" /> Take Pickup Photo & Confirm
                         </Button>
                       )}
                       {order.status === 'picked-up' && (
                         <Button className="w-full bg-blue-500 h-14 font-black rounded-2xl gap-3" onClick={() => handleUpdateStatus(order.id, 'out-for-delivery')}>
                           <Truck className="h-6 w-6" /> Mark On The Way
                         </Button>
                       )}
                       {order.status === 'out-for-delivery' && (
                         <Button className="w-full bg-green-600 h-14 font-black rounded-2xl gap-3 shadow-lg shadow-green-600/20" onClick={() => openCamera(order, 'delivery')}>
                           <Camera className="h-6 w-6" /> Take Delivery Photo & Finish ✅
                         </Button>
                       )}
                    </CardFooter>
                 </Card>
               ))}
             </div>
           )}
        </TabsContent>

        <TabsContent value="history">
          <Card className="rounded-[2rem] overflow-hidden border-none shadow-md">
            <CardHeader className="bg-muted/30">
              <CardTitle className="flex items-center gap-2"><History className="h-5 w-5 text-primary" /> Delivery History</CardTitle>
              <CardDescription>Aapne ab tak ki saari deliveries yahan dekh sakte hain.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {completedDeliveries.length === 0 ? (
                  <div className="p-20 text-center opacity-30">No delivery history yet.</div>
                ) : (
                  completedDeliveries.map(o => (
                    <div key={o.id} className="p-5 flex justify-between items-center hover:bg-muted/10 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                          <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="font-bold text-base">{o.productTitle}</p>
                          <p className="text-[10px] text-muted-foreground uppercase font-black">
                            {o.customerName} • {new Date(o.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-green-100 text-green-700 font-black">+ ₹40</Badge>
                        <p className="text-[8px] text-muted-foreground uppercase mt-1">LV Wallet</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-8 pb-20">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-6">
              <Card className="text-center pt-8 overflow-hidden rounded-[2rem] shadow-md border-none">
                <CardContent className="space-y-4">
                  <div className="relative w-fit mx-auto group">
                    <Avatar className="h-32 w-32 border-4 border-primary/20">
                      <AvatarImage src={userProfile?.photoURL} className="object-cover" />
                      <AvatarFallback className="text-4xl font-black bg-primary/5 text-primary">
                        {userProfile?.name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <Label 
                      htmlFor="photo-upload" 
                      className="absolute bottom-1 right-1 p-3 bg-primary text-white rounded-full cursor-pointer shadow-lg hover:scale-110 transition-transform"
                    >
                      <Camera className="h-5 w-5" />
                    </Label>
                    <input id="photo-upload" type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black">{userProfile?.name}</h2>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black opacity-60">
                      LV Partner • {userProfile?.areaCode || 'Global'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-destructive/20 bg-destructive/5 rounded-[2rem] shadow-sm">
                <CardHeader className="p-6 pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                    <Lock className="h-4 w-4" /> Security
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-2 flex items-center justify-between">
                  <p className="text-xs font-bold text-muted-foreground">Password Update</p>
                  <Button size="sm" variant="outline" onClick={handlePasswordReset} disabled={isResettingPassword} className="h-8 text-[10px] uppercase font-black border-destructive/20 text-destructive hover:bg-destructive hover:text-white">
                    {isResettingPassword ? "Sending..." : "Reset"}
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="md:col-span-2">
              <Card className="shadow-lg border-none rounded-[2rem]">
                <CardHeader className="border-b bg-muted/20">
                  <CardTitle className="flex items-center gap-2"><User className="h-5 w-5 text-primary" /> Profile & Address</CardTitle>
                  <CardDescription>Ye details aapki professional identity aur address sync ke liye hain.</CardDescription>
                </CardHeader>
                <CardContent className="pt-8">
                  <form onSubmit={handleUpdateAccount} className="space-y-8">
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase text-muted-foreground">Partner Name</Label>
                        <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required className="rounded-xl h-11" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase text-muted-foreground">Contact Phone</Label>
                        <Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="99xxxxxx" className="rounded-xl h-11" />
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center gap-2 pb-2 border-b">
                        <Building2 className="h-4 w-4 text-primary" />
                        <span className="text-sm font-black uppercase tracking-tight">Structured Home Address</span>
                      </div>
                      
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground">House / Flat No.</Label>
                          <Input value={formData.houseNo} onChange={(e) => setFormData({...formData, houseNo: e.target.value})} placeholder="e.g. A-123" className="rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground">Street / Colony</Label>
                          <Input value={formData.street} onChange={(e) => setFormData({...formData, street: e.target.value})} placeholder="e.g. Block-G" className="rounded-xl" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground">City</Label>
                          <Input value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} className="rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground">Pincode</Label>
                          <Input value={formData.pincode} onChange={(e) => setFormData({...formData, pincode: e.target.value})} className="rounded-xl" />
                        </div>
                        <div className="space-y-2 col-span-2 sm:col-span-1">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground">State</Label>
                          <Select value={formData.state} onValueChange={(v) => setFormData({...formData, state: v})}>
                            <SelectTrigger className="rounded-xl">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              {states.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <Button type="submit" className="w-full h-12 rounded-2xl gap-2 font-bold shadow-lg shadow-primary/20" disabled={isUpdatingAccount || !isFormInitialized}>
                      {isUpdatingAccount ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Update Profile Details
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Camera Proof Dialog */}
      <Dialog open={isCameraOpen} onOpenChange={(open) => !open && closeCamera()}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-black border-none">
          <DialogHeader className="p-4 bg-white/10 text-white flex flex-row items-center justify-between">
            <div>
              <DialogTitle className="text-lg">Take Proof Photo</DialogTitle>
              <DialogDescription className="text-xs text-white/60">
                {cameraType === 'pickup' ? "Dukan par saman lete waqt photo lein." : "Customer ko saman dete waqt photo lein."}
              </DialogDescription>
            </div>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={closeCamera}>
              <X className="h-5 w-5" />
            </Button>
          </DialogHeader>

          <div className="relative aspect-square w-full bg-black flex items-center justify-center">
            {capturedPhoto ? (
              <Image src={capturedPhoto} alt="Captured proof" fill className="object-cover" />
            ) : (
              <>
                <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                {!hasCameraPermission && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-8 text-center gap-4">
                    <Camera className="h-12 w-12 opacity-50" />
                    <p className="text-sm">Camera access is required for security proof.</p>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="p-6 bg-white flex gap-3">
            {capturedPhoto ? (
              <>
                <Button variant="outline" className="flex-1 h-12 rounded-xl font-bold" onClick={() => setCapturedPhoto(null)}>
                  Retake Photo
                </Button>
                <Button className="flex-1 h-12 rounded-xl font-bold bg-green-600 hover:bg-green-700 gap-2" onClick={handleSaveProof} disabled={isUploadingPhoto}>
                  {isUploadingPhoto ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
                  Save & Complete
                </Button>
              </>
            ) : (
              <Button className="w-full h-14 rounded-2xl font-black text-lg gap-3" onClick={capturePhoto} disabled={!hasCameraPermission}>
                <div className="h-4 w-4 rounded-full bg-white animate-pulse" />
                CAPTURE PHOTO
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
