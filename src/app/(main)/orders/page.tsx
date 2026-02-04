
"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { collection, query, where, orderBy, doc } from "firebase/firestore";
import { useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { 
  Loader2, 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Store, 
  XCircle, 
  Phone,
  Circle,
  Hash
} from "lucide-react";
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
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const myOrdersQuery = useMemoFirebase(() => 
    user ? query(
      collection(firestore, "orders"), 
      where("customerId", "==", user.uid),
      orderBy("createdAt", "desc")
    ) : null, 
    [firestore, user]
  );
  const { data: orders, isLoading } = useCollection<Order>(myOrdersQuery);

  const handleCancelOrder = (orderId: string) => {
    const orderRef = doc(firestore, "orders", orderId);
    updateDocumentNonBlocking(orderRef, { status: 'cancelled' });
    toast({ title: "Order Cancelled", description: "Aapka order cancel kar diya gaya hai." });
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Tracking your orders...</p>
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-primary/10 text-primary rounded-xl">
          <Package className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-3xl font-black font-headline">My Orders</h1>
          <p className="text-muted-foreground">Track your hyperlocal deliveries live.</p>
        </div>
      </div>

      {!orders || orders.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-3xl opacity-30">
          <Package className="h-12 w-12 mx-auto mb-4" />
          <p className="font-bold">Aapne abhi tak koi order nahi kiya.</p>
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
                        <div className="flex items-center gap-2 mb-1">
                           <Badge variant="outline" className="font-black text-[10px] uppercase border-primary text-primary">
                             <Hash className="h-2 w-2 mr-1" /> {order.displayOrderId}
                           </Badge>
                        </div>
                        <CardTitle className="text-lg">{order.productTitle}</CardTitle>
                        <CardDescription className="font-bold text-primary flex items-center gap-1">
                          <Store className="h-3 w-3" /> {order.shopName}
                        </CardDescription>
                     </div>
                     <Badge variant={isCancelled ? 'destructive' : order.status === 'delivered' ? 'default' : 'secondary'} className="uppercase text-[10px]">
                        {order.status.replace('-', ' ')}
                     </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {/* Progress Tracker */}
                  {!isCancelled && order.status !== 'delivered' && (
                    <div className="mb-8 relative">
                       <div className="absolute top-1/2 left-0 w-full h-1 bg-muted -translate-y-1/2 z-0" />
                       <div 
                         className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 z-0 transition-all duration-500" 
                         style={{ width: `${(currentStepIdx / (orderSteps.length - 1)) * 100}%` }}
                       />
                       <div className="relative flex justify-between z-10">
                          {orderSteps.map((step, idx) => {
                            const Icon = step.icon;
                            const isCompleted = idx <= currentStepIdx;
                            return (
                              <div key={step.status} className="flex flex-col items-center gap-2">
                                <div className={`p-2 rounded-full border-2 transition-colors ${isCompleted ? 'bg-primary border-primary text-white' : 'bg-white border-muted text-muted-foreground'}`}>
                                   <Icon className="h-4 w-4" />
                                </div>
                                <span className={`text-[8px] font-black uppercase tracking-tighter ${isCompleted ? 'text-primary' : 'text-muted-foreground'}`}>{step.label}</span>
                              </div>
                            );
                          })}
                       </div>
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <div>
                          <p className="font-black text-[9px] uppercase text-muted-foreground">Delivery To</p>
                          <p className="text-xs font-medium">{order.address}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-primary shrink-0" />
                        <div>
                          <p className="font-black text-[9px] uppercase text-muted-foreground">Ordered At</p>
                          <p className="text-xs">{new Date(order.createdAt).toLocaleString('en-IN')}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-primary/5 p-4 rounded-xl space-y-3 border border-primary/10">
                       <div className="flex justify-between text-sm">
                          <span className="font-medium text-muted-foreground text-xs uppercase font-black">Total Price</span>
                          <span className="font-black text-primary">₹{order.price}</span>
                       </div>
                       
                       {/* Delivery Partner Info & Call Button */}
                       {order.deliveryBoyName ? (
                          <div className="pt-3 border-t flex items-center justify-between">
                             <div className="flex items-center gap-2">
                                <Avatar className="h-10 w-10 border-2 border-primary/20">
                                   <AvatarFallback className="bg-primary text-white text-xs font-black">{order.deliveryBoyName.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                   <p className="text-[9px] font-black uppercase opacity-60">Delivery Partner</p>
                                   <p className="text-xs font-bold">{order.deliveryBoyName}</p>
                                </div>
                             </div>
                             <Button size="icon" className="h-10 w-10 rounded-full bg-green-600 hover:bg-green-700 shadow-lg" asChild>
                               <a href={`tel:${order.deliveryBoyPhone}`}>
                                 <Phone className="h-5 w-5 text-white" />
                               </a>
                             </Button>
                          </div>
                       ) : !isCancelled && (
                          <div className="pt-3 border-t">
                             <p className="text-[10px] text-center text-muted-foreground italic font-medium">Finding nearby delivery partner...</p>
                          </div>
                       )}
                    </div>
                  </div>
                </CardContent>
                {order.status === 'pending' && (
                  <CardFooter className="border-t pt-4 bg-muted/10">
                    <Button 
                      variant="ghost" 
                      className="text-destructive w-full hover:bg-destructive/10 gap-2 text-xs font-bold uppercase"
                      onClick={() => handleCancelOrder(order.id)}
                    >
                      <XCircle className="h-4 w-4" /> Cancel Delivery Request
                    </Button>
                  </CardFooter>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
