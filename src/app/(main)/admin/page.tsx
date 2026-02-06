
"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { collection, doc, setDoc } from "firebase/firestore";
import Link from "next/link";
import { 
  useFirestore, 
  useCollection, 
  useMemoFirebase,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking,
  useDoc
} from "@/firebase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Loader2, 
  Store, 
  ShieldAlert, 
  ShieldCheck,
  Package,
  Save,
  Trash2,
  Search,
  ExternalLink,
  Eye,
  Truck,
  ClipboardList,
  User as UserIcon,
  AlertCircle,
  Info
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Business, Product, UserProfile, PlatformConfig, Order } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function AdminDashboardPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const [announcementText, setAnnouncementText] = useState("");
  
  const [activeTab, setActiveTab] = useState("approvals");
  const [userRoleFilter, setUserRoleFilter] = useState<"all" | "customer" | "staff" | "delivery">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const isAdminOrModerator = useMemo(() => {
    return user && userProfile && ['admin', 'moderator'].includes(userProfile.role);
  }, [user, userProfile]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else if (userProfile && !['admin', 'moderator'].includes(userProfile.role)) {
        router.push("/");
      }
    }
  }, [user, userProfile, authLoading, router]);

  const configRef = useMemoFirebase(() => 
    isAdminOrModerator ? doc(firestore, "config", "platform") : null, 
    [firestore, isAdminOrModerator]
  );
  const { data: config } = useDoc<PlatformConfig>(configRef);

  useEffect(() => {
    if (config?.announcement) setAnnouncementText(config.announcement);
  }, [config]);

  const businessesRef = useMemoFirebase(() => 
    isAdminOrModerator ? collection(firestore, "businesses") : null, 
    [firestore, isAdminOrModerator]
  );
  const { data: businesses, isLoading: loadingBusinesses } = useCollection<Business>(businessesRef);

  const usersRef = useMemoFirebase(() => 
    isAdminOrModerator ? collection(firestore, "users") : null, 
    [firestore, isAdminOrModerator]
  );
  const { data: allUsers, isLoading: loadingUsers } = useCollection<UserProfile>(usersRef);

  const productsRef = useMemoFirebase(() => 
    isAdminOrModerator ? collection(firestore, "products") : null, 
    [firestore, isAdminOrModerator]
  );
  const { data: products, isLoading: loadingProducts } = useCollection<Product>(productsRef);

  const ordersRef = useMemoFirebase(() => 
    isAdminOrModerator ? collection(firestore, "orders") : null, 
    [firestore, isAdminOrModerator]
  );
  const { data: orders, isLoading: loadingOrders } = useCollection<Order>(ordersRef);

  const isFullAdmin = userProfile?.role === 'admin';

  const pendingProducts = useMemo(() => products?.filter(p => p.status === 'pending') || [], [products]);
  const customers = useMemo(() => allUsers?.filter(u => u.role === 'customer') || [], [allUsers]);
  const staffMembers = useMemo(() => allUsers?.filter(u => ['admin', 'moderator'].includes(u.role)) || [], [allUsers]);
  const deliveryBoys = useMemo(() => allUsers?.filter(u => u.role === 'delivery-boy') || [], [allUsers]);

  const filteredUsers = useMemo(() => {
    if (!allUsers) return [];
    let list = allUsers;
    
    if (userRoleFilter === 'customer') list = list.filter(u => u.role === 'customer');
    if (userRoleFilter === 'staff') list = list.filter(u => ['admin', 'moderator'].includes(u.role));
    if (userRoleFilter === 'delivery') list = list.filter(u => u.role === 'delivery-boy');
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(u => 
        u.name.toLowerCase().includes(q) || 
        u.email.toLowerCase().includes(q) ||
        (u.deliveryId && u.deliveryId.toLowerCase().includes(q))
      );
    }
    
    return list;
  }, [allUsers, userRoleFilter, searchQuery]);

  const handleUpdateConfig = async () => {
    if (!isFullAdmin) return;
    try {
      await setDoc(doc(firestore, "config", "platform"), {
        announcement: announcementText,
        lastUpdated: new Date().toISOString()
      }, { merge: true });
      toast({ title: "Platform Config Updated" });
    } catch (err) {
      toast({ variant: "destructive", title: "Error updating config" });
    }
  };

  const handleUpdateUserRole = (userId: string, targetCurrentRole: string, newRole: any) => {
    if (!isFullAdmin && userId === user?.uid) {
      toast({ variant: "destructive", title: "Action Denied", description: "Self role update not allowed." });
      return;
    }
    const userRef = doc(firestore, "users", userId);
    updateDocumentNonBlocking(userRef, { role: newRole });
    toast({ title: "Role Updated" });
  };

  const handleDeleteUser = (userId: string) => {
    if (!isFullAdmin) return;
    deleteDocumentNonBlocking(doc(firestore, "users", userId));
    // Important: Delete shop too if it exists
    deleteDocumentNonBlocking(doc(firestore, "businesses", userId));
    toast({ title: "Firestore Records Deleted", description: "Remember to delete the login account from Firebase Auth Console." });
  };

  if (authLoading || (user && !userProfile)) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Accessing Panel...</p>
      </div>
    );
  }

  if (!isAdminOrModerator) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 text-primary rounded-xl">
            {isFullAdmin ? <ShieldAlert className="h-8 w-8" /> : <ShieldCheck className="h-8 w-8" />}
          </div>
          <div>
            <h1 className="text-3xl font-bold font-headline">Platform Management</h1>
            <p className="text-muted-foreground text-sm">Control center for LocalVyapar.</p>
          </div>
        </div>
        
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search users, shops, delivery ID..." 
            className="pl-10 h-10 rounded-full shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Critical Info Banner */}
      {isFullAdmin && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-800 leading-relaxed">
            <span className="font-bold">Zaroori Sochna:</span> Yahan se user delete karne par sirf uska profile aur shop data Firestore se hat-ta hai. 
            Agar aap chahte hain ki wo dobara register kar sake, toh aapko **Firebase Console > Authentication** tab mein jaakar uska email wahan se bhi permanent delete karna hoga.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <Card className={cn("cursor-pointer transition-all", activeTab === 'businesses' && "ring-2 ring-primary")} onClick={() => setActiveTab("businesses")}>
          <CardHeader className="p-4">
            <CardDescription className="font-bold uppercase text-[9px]">Shops</CardDescription>
            <CardTitle className="text-xl flex items-center gap-2"><Store className="h-4 w-4 text-blue-500" />{businesses?.length || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card className={cn("cursor-pointer transition-all", activeTab === 'approvals' && "ring-2 ring-primary")} onClick={() => setActiveTab("approvals")}>
          <CardHeader className="p-4">
            <CardDescription className="font-bold uppercase text-[9px]">Pending</CardDescription>
            <CardTitle className="text-xl flex items-center gap-2"><AlertCircle className="h-4 w-4 text-red-500" />{pendingProducts.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className={cn("cursor-pointer transition-all", userRoleFilter === 'customer' && "ring-2 ring-primary")} onClick={() => {setActiveTab("users"); setUserRoleFilter("customer");}}>
          <CardHeader className="p-4">
            <CardDescription className="font-bold uppercase text-[9px]">Customers</CardDescription>
            <CardTitle className="text-xl flex items-center gap-2"><UserIcon className="h-4 w-4 text-green-500" />{customers.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className={cn("cursor-pointer transition-all", userRoleFilter === 'delivery' && "ring-2 ring-primary")} onClick={() => {setActiveTab("users"); setUserRoleFilter("delivery");}}>
          <CardHeader className="p-4">
            <CardDescription className="font-bold uppercase text-[9px]">Delivery Boys</CardDescription>
            <CardTitle className="text-xl flex items-center gap-2"><Truck className="h-4 w-4 text-orange-500" />{deliveryBoys.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className={cn("cursor-pointer transition-all", userRoleFilter === 'staff' && "ring-2 ring-primary")} onClick={() => {setActiveTab("users"); setUserRoleFilter("staff");}}>
          <CardHeader className="p-4">
            <CardDescription className="font-bold uppercase text-[9px]">Staff</CardDescription>
            <CardTitle className="text-xl flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" />{staffMembers.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className={cn("cursor-pointer transition-all", activeTab === 'orders' && "ring-2 ring-primary")} onClick={() => setActiveTab("orders")}>
          <CardHeader className="p-4">
            <CardDescription className="font-bold uppercase text-[9px]">Total Orders</CardDescription>
            <CardTitle className="text-xl flex items-center gap-2"><Package className="h-4 w-4 text-purple-500" />{orders?.length || 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-8 h-12 bg-muted/50 p-1 flex overflow-x-auto no-scrollbar justify-start">
          <TabsTrigger value="approvals" className="px-6 shrink-0">Approvals</TabsTrigger>
          <TabsTrigger value="orders" className="px-6 shrink-0">Platform Orders</TabsTrigger>
          <TabsTrigger value="users" className="px-6 shrink-0">Users & Roles</TabsTrigger>
          <TabsTrigger value="businesses" className="px-6 shrink-0">Active Shops</TabsTrigger>
          {isFullAdmin && <TabsTrigger value="config" className="px-6 shrink-0">Settings</TabsTrigger>}
        </TabsList>

        <TabsContent value="orders">
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl"><ClipboardList className="h-5 w-5 text-primary" /> Live Order Monitor</CardTitle>
              <CardDescription>Track every hyperlocal delivery on LocalVyapar.</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingOrders ? (
                <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
              ) : !orders || orders.length === 0 ? (
                <div className="text-center py-20 opacity-30">No orders found on the platform.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>Order ID</TableHead>
                      <TableHead>Product & Shop</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Rider</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-black text-[10px] uppercase">{order.displayOrderId}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold text-sm">{order.productTitle}</span>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Store className="h-2 w-2" /> {order.shopName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-xs">{order.customerName}</span>
                            <span className="text-[9px] text-muted-foreground">{order.customerDeliveryId}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {order.deliveryBoyName ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="bg-primary/10 text-primary text-[8px] font-black">{order.deliveryBoyName.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <span className="text-xs font-bold">{order.deliveryBoyName}</span>
                            </div>
                          ) : (
                            <span className="text-[10px] italic text-muted-foreground">Not Assigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'} className="uppercase text-[8px] font-black">
                            {order.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card className="border-none shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-xl">Account Moderation</CardTitle>
                <CardDescription>Manage roles and platform access.</CardDescription>
              </div>
              <div className="flex gap-2">
                <Select value={userRoleFilter} onValueChange={(v: any) => setUserRoleFilter(v)}>
                  <SelectTrigger className="w-[150px] rounded-full">
                    <SelectValue placeholder="Role Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Profiles</SelectItem>
                    <SelectItem value="customer">Customers</SelectItem>
                    <SelectItem value="delivery">Delivery Boys</SelectItem>
                    <SelectItem value="staff">Admins/Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {loadingUsers ? (
                <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>User Identity</TableHead>
                      <TableHead>Delivery ID</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers?.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold">{u.name}</span>
                            <span className="text-xs text-muted-foreground">{u.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                           {u.deliveryId ? <Badge variant="outline" className="font-black text-[9px] uppercase">{u.deliveryId}</Badge> : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={u.role === 'admin' ? 'destructive' : u.role === 'delivery-boy' ? 'secondary' : 'outline'} className="uppercase text-[8px]">
                            {u.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-primary">
                              <Link href={u.role === 'business' ? `/business/${u.id}` : `/profile/${u.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Select 
                              disabled={(u.role === 'admin' && !isFullAdmin) || (u.id === user?.uid)}
                              defaultValue={u.role} 
                              onValueChange={(val: any) => handleUpdateUserRole(u.id, u.role, val)}
                            >
                              <SelectTrigger className="w-[110px] h-8 text-[9px] font-bold rounded-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="customer">Customer</SelectItem>
                                <SelectItem value="business">Business</SelectItem>
                                <SelectItem value="delivery-boy">Delivery Boy</SelectItem>
                                <SelectItem value="moderator">Moderator</SelectItem>
                                {isFullAdmin && <SelectItem value="admin">Admin</SelectItem>}
                              </SelectContent>
                            </Select>
                            
                            {isFullAdmin && u.id !== user?.uid && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteUser(u.id)}>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Firestore se data delete karein.</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approvals">
           <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Product Approval Queue</CardTitle>
                  <CardDescription>Review and approve items uploaded by shops.</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingProducts ? (
                    <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
                  ) : pendingProducts.length === 0 ? (
                    <div className="text-center py-10 opacity-30">No pending approvals.</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Business</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingProducts.map((p) => {
                          const shop = businesses?.find(b => b.id === p.businessId);
                          return (
                            <TableRow key={p.id}>
                              <TableCell className="font-bold">{p.title}</TableCell>
                              <TableCell>
                                <Link href={`/business/${p.businessId}`} className="flex items-center gap-1 hover:text-primary transition-colors">
                                  {shop?.shopName || "Unknown Shop"} <ExternalLink className="h-3 w-3" />
                                </Link>
                              </TableCell>
                              <TableCell>₹{p.price}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex gap-2 justify-end">
                                  <Button size="sm" variant="outline" className="text-green-600 border-green-600/20 hover:bg-green-50" onClick={() => updateDocumentNonBlocking(doc(firestore, "products", p.id), { status: 'approved' })}>Approve</Button>
                                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => updateDocumentNonBlocking(doc(firestore, "products", p.id), { status: 'rejected' })}>Reject</Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
           </div>
        </TabsContent>

        <TabsContent value="businesses">
           <Card>
              <CardHeader>
                <CardTitle>Active Businesses</CardTitle>
                <CardDescription>Monitor listed shops and their performance.</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingBusinesses ? (
                  <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Shop Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Stats</TableHead>
                        <TableHead className="text-right">Access</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {businesses?.map((b) => (
                        <TableRow key={b.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-bold">{b.shopName}</span>
                              {b.isVerified && <ShieldCheck className="h-4 w-4 text-blue-500" />}
                            </div>
                          </TableCell>
                          <TableCell><Badge variant="outline">{b.category}</Badge></TableCell>
                          <TableCell>
                             <div className="flex gap-3 text-[10px] font-black uppercase opacity-60">
                               <span>{b.views || 0} Views</span>
                               <span>{(b.callCount || 0) + (b.whatsappCount || 0)} Leads</span>
                             </div>
                          </TableCell>
                          <TableCell className="text-right">
                             <Button asChild size="sm" variant="ghost" className="gap-2 text-primary">
                               <Link href={`/business/${b.id}`}>
                                 <Eye className="h-4 w-4" /> View Shop
                               </Link>
                             </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
           </Card>
        </TabsContent>

        {isFullAdmin && (
          <TabsContent value="config">
            <Card>
              <CardHeader>
                <CardTitle>System Configuration</CardTitle>
                <CardDescription>Global settings for the platform.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Platform-wide Announcement</Label>
                  <Textarea 
                    placeholder="e.g. Server Maintenance tonight at 12 AM" 
                    value={announcementText}
                    onChange={(e) => setAnnouncementText(e.target.value)}
                  />
                  <p className="text-[10px] text-muted-foreground uppercase font-black">Yeh text sabhi users ko home screen par dikhega.</p>
                </div>
                <Button onClick={handleUpdateConfig} className="gap-2">
                  <Save className="h-4 w-4" /> Save Configuration
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
