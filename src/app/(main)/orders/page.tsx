
"use client";

import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { collection, query, where } from "firebase/firestore";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Package, Truck, CheckCircle2, Clock, MapPin, Store, Phone, Hash, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Order } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const orderSteps = [
  { status: 'pending', label: 'Requested', icon: Clock },
  { status: 'assigned', label: 'Assigned', icon: Package },
  { status: 'picked-up', label: 'Picked Up', icon: Truck },
  { status: 'out-for-delivery', label: 'On Way', icon: MapPin },
  { status: 'delivered', label: 'Delivered', icon: CheckCircle2 }
];

export default function MyOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const ordersQuery = useMemoFirebase(() => 
    user ? query(collection(firestore, "orders"), where("customerId", "==", user.uid)) : null, 
    [firestore, user]
  );
  
  const { data: rawOrders, isLoading } = useCollection<Order>(ordersQuery);

  const orders = useMemo(() => {
    if (!rawOrders) return [];
    return [...rawOrders].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [rawOrders]);

  const handleShareLocation = (riderPhone: string | undefined, orderId: string) => {
    if (!riderPhone) {
      toast({ variant: "destructive", title: "Error", description: "Rider contact number not found." });
      return;
    }
    const text = encodeURIComponent(`Hi, main apna live location share kar raha hoon order ID ${orderId} ke liye. Kripya check karein.`);
    window.open(`https://wa.me/${riderPhone.replace(/\D/g, '')}?text=${text}`, '_blank');
    toast({ title: "WhatsApp Opened", description: "Ab aap rider ko apni location bhej sakte hain." });
  };

  if (authLoading || isLoading) return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  if (!user) { router.push("/login"); return null; }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-primary/10 text-primary rounded-xl"><Package className="h-8 w-8" /></div>
        <div>
          <h1 className="text-3xl font-black font-headline">My Orders</h1>
          <p className="text-muted-foreground">Track your hyperlocal deliveries live.</p>
        </div>
      </div>

      {!orders || orders.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-3xl opacity-30">
          <Package className="h-12 w-12 mx-auto mb-4" />
          <p>Abhi tak koi order nahi hai.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {orders.map((order) => {
            const currentStepIdx = orderSteps.findIndex(s => s.status === order.status);
            const isCancelled = order.status === 'cancelled';
            return (
              <Card key={order.id} className={`overflow-hidden shadow-md border-t-4 ${isCancelled ? 'border-t-destructive' : 'border-t-primary'}`}>
                <CardHeader className="bg-muted/30 pb-4 border-b">
                  <div className="flex justify-between items-start">
                     <div className="space-y-1">
                        <Badge variant="outline" className="text-[10px] font-black border-primary text-primary">
                          <Hash className="h-2 w-2 mr-1" /> {order.displayOrderId || 'LV-ORD'}
                        </Badge>
                        <CardTitle className="text-lg">{order.productTitle}</CardTitle>
                        <CardDescription className="font-bold text-primary flex items-center gap-1">
                          <Store className="h-3 w-3" /> {order.shopName}
                        </CardDescription>
                     </div>
                     <Badge variant={isCancelled ? 'destructive' : order.status === 'delivered' ? 'default' : 'secondary'} className="uppercase text-[10px]">
                        {order.status}
                     </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {!isCancelled && order.status !== 'delivered' && currentStepIdx >= 0 && (
                    <div className="mb-8 relative px-4">
                       <div className="absolute top-1/2 left-0 w-full h-1 bg-muted -translate-y-1/2" />
                       <div className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 transition-all duration-500" style={{ width: `${(currentStepIdx / (orderSteps.length - 1)) * 100}%` }} />
                       <div className="relative flex justify-between">
                          {orderSteps.map((step, idx) => (
                            <div key={step.status} className="flex flex-col items-center gap-1">
                               <div className={`p-2 rounded-full border-2 ${idx <= currentStepIdx ? 'bg-primary border-primary text-white' : 'bg-white border-muted text-muted-foreground'}`}><step.icon className="h-3 w-3" /></div>
                               <span className="text-[7px] font-black uppercase">{step.label}</span>
                            </div>
                          ))}
                       </div>
                    </div>
                  )}
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <MapPin className="text-primary h-4 w-4 mt-0.5" />
                        <div>
                          <p className="text-[9px] font-black uppercase opacity-60">Deliver To</p>
                          <p className="text-xs font-medium">{order.address}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                       <div className="flex justify-between font-black text-primary"><span>Total</span><span>₹{order.price}</span></div>
                       {order.deliveryBoyName && (
                          <div className="pt-3 mt-3 border-t flex items-center justify-between">
                             <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="bg-primary text-white text-[10px] font-black">{order.deliveryBoyName.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-[8px] font-black uppercase opacity-60">Rider</p>
                                  <p className="text-xs font-bold">{order.deliveryBoyName}</p>
                                </div>
                             </div>
                             <div className="flex gap-2">
                               <Button size="icon" variant="outline" className="h-9 w-9 rounded-full border-green-500 text-green-600" onClick={() => handleShareLocation(order.deliveryBoyPhone, order.displayOrderId)}>
                                 <MessageCircle className="h-4 w-4" />
                               </Button>
                               {order.deliveryBoyPhone && (
                                 <Button size="icon" className="h-9 w-9 rounded-full bg-green-600" asChild>
                                   <a href={`tel:${order.deliveryBoyPhone}`}><Phone className="h-4 w-4" /></a>
                                 </Button>
                               )}
                             </div>
                          </div>
                       )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
