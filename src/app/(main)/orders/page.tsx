
"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { collection, query, where, orderBy } from "firebase/firestore";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Package, Truck, CheckCircle2, Clock, MapPin, Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Order } from "@/lib/types";

export default function MyOrdersPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const firestore = useFirestore();

  const myOrdersQuery = useMemoFirebase(() => 
    user ? query(
      collection(firestore, "orders"), 
      where("customerId", "==", user.uid),
      orderBy("createdAt", "desc")
    ) : null, 
    [firestore, user]
  );
  const { data: orders, isLoading } = useCollection<Order>(myOrdersQuery);

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
          <p className="text-muted-foreground">Track your hyperlocal deliveries.</p>
        </div>
      </div>

      {!orders || orders.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-3xl opacity-30">
          <Package className="h-12 w-12 mx-auto mb-4" />
          <p className="font-bold">Aapne abhi tak koi order nahi kiya.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <Card key={order.id} className="overflow-hidden shadow-md">
              <CardHeader className="bg-muted/30 pb-4 border-b">
                <div className="flex justify-between items-start">
                   <div className="space-y-1">
                      <CardTitle className="text-lg">{order.productTitle}</CardTitle>
                      <CardDescription className="font-bold text-primary flex items-center gap-1">
                        <Store className="h-3 w-3" /> {order.shopName}
                      </CardDescription>
                   </div>
                   <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'} className="uppercase text-[10px]">
                      {order.status.replace('-', ' ')}
                   </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="font-black text-[9px] uppercase text-muted-foreground">Delivery Address</p>
                        <p className="text-xs">{order.address}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-primary shrink-0" />
                      <div>
                        <p className="font-black text-[9px] uppercase text-muted-foreground">Order Date</p>
                        <p className="text-xs">{new Date(order.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-primary/5 p-4 rounded-xl space-y-3">
                     <div className="flex justify-between text-sm">
                        <span className="font-medium text-muted-foreground">Status</span>
                        <span className="font-bold uppercase text-primary">{order.status}</span>
                     </div>
                     {order.deliveryBoyName && (
                        <div className="pt-2 border-t flex items-center gap-3">
                           <div className="bg-primary text-white p-2 rounded-full"><Truck className="h-4 w-4" /></div>
                           <div>
                              <p className="text-[9px] font-black uppercase opacity-60">Delivery Partner</p>
                              <p className="text-xs font-bold">{order.deliveryBoyName}</p>
                           </div>
                        </div>
                     )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
