
"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { collection, query, where, doc, orderBy } from "firebase/firestore";
import { 
  useFirestore, 
  useCollection, 
  useMemoFirebase,
  updateDocumentNonBlocking
} from "@/firebase";
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
  AlertCircle
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Order } from "@/lib/types";

export default function DeliveryDashboardPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();

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

  // Fetch Available Orders (Pending and not assigned)
  const availableOrdersQuery = useMemoFirebase(() => 
    query(collection(firestore, "orders"), where("status", "==", "pending")), 
    [firestore]
  );
  const { data: availableOrders, isLoading: loadingAvailable } = useCollection<Order>(availableOrdersQuery);

  // Fetch My Orders (Assigned to me)
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
          <div className="p-3 bg-primary/10 text-primary rounded-2xl">
            <Truck className="h-10 w-10" />
          </div>
          <div>
            <h1 className="text-3xl font-black font-headline">Delivery Partner</h1>
            <p className="text-muted-foreground">Manage your orders and deliveries.</p>
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
        <TabsList className="mb-6 w-full justify-start bg-transparent border-b rounded-none h-auto p-0 gap-8">
          <TabsTrigger value="available" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent shadow-none px-0 pb-4">Available Orders ({availableOrders?.length || 0})</TabsTrigger>
          <TabsTrigger value="active" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent shadow-none px-0 pb-4">My Task ({activeDeliveries.length})</TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent shadow-none px-0 pb-4">History</TabsTrigger>
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
      </Tabs>
    </div>
  );
}
