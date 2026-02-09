
"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { collection, doc, setDoc, addDoc, serverTimestamp } from "firebase/firestore";
import Link from "next/link";
import { 
  useFirestore, 
  useCollection, 
  useMemoFirebase,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking,
  useDoc,
  addDocumentNonBlocking
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
  Info,
  Megaphone,
  Plus,
  Globe,
  MapPin,
  Hash,
  Youtube,
  Link as LinkIcon
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
import { Business, Product, UserProfile, PlatformConfig, Order, Announcement } from "@/lib/types";
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
  
  const [activeTab, setActiveTab] = useState("approvals");
  const [userRoleFilter, setUserRoleFilter] = useState<"all" | "customer" | "staff" | "delivery">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Targeted Announcement States
  const [newAnnouncement, setNewAnnouncement] = useState({
    message: "",
    targetType: "global" as "global" | "area" | "pincode",
    targetValue: "",
    videoUrl: ""
  });
  const [isSubmittingAnnouncement, setIsSubmittingAnnouncement] = useState(false);

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

  const announcementsRef = useMemoFirebase(() => 
    isAdminOrModerator ? collection(firestore, "announcements") : null, 
    [firestore, isAdminOrModerator]
  );
  const { data: announcements, isLoading: loadingAnnouncements } = useCollection<Announcement>(announcementsRef);

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

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnouncement.message || (newAnnouncement.targetType !== 'global' && !newAnnouncement.targetValue)) {
      toast({ variant: "destructive", title: "Missing Info", description: "Kripya saari details bharein." });
      return;
    }

    setIsSubmittingAnnouncement(true);
    try {
      await addDoc(collection(firestore, "announcements"), {
        message: newAnnouncement.message,
        targetType: newAnnouncement.targetType,
        targetValue: newAnnouncement.targetType === 'global' ? "all" : newAnnouncement.targetValue,
        videoUrl: newAnnouncement.videoUrl || null,
        isActive: true,
        createdAt: new Date().toISOString()
      });
      setNewAnnouncement({ message: "", targetType: "global", targetValue: "", videoUrl: "" });
      toast({ title: "Announcement Published!" });
    } catch (err) {
      toast({ variant: "destructive", title: "Error" });
    } finally {
      setIsSubmittingAnnouncement(false);
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
    deleteDocumentNonBlocking(doc(firestore, "businesses", userId));
    toast({ title: "Firestore Records Deleted" });
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
          <TabsTrigger value="announcements" className="px-6 shrink-0">Targeted Announcements</TabsTrigger>
          <TabsTrigger value="orders" className="px-6 shrink-0">Platform Orders</TabsTrigger>
          <TabsTrigger value="users" className="px-6 shrink-0">Users & Roles</TabsTrigger>
          <TabsTrigger value="businesses" className="px-6 shrink-0">Active Shops</TabsTrigger>
        </TabsList>

        <TabsContent value="announcements">
          <div className="grid lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-1 shadow-md border-primary/10">
              <CardHeader className="bg-primary/5">
                <CardTitle className="flex items-center gap-2"><Megaphone className="h-5 w-5 text-primary" /> Create Targeted Alert</CardTitle>
                <CardDescription>Target messages to specific areas or everyone.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleCreateAnnouncement} className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Target Type</Label>
                    <Select value={newAnnouncement.targetType} onValueChange={(v: any) => setNewAnnouncement({...newAnnouncement, targetType: v})}>
                      <SelectTrigger className="rounded-xl h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="global">Global (Pure App)</SelectItem>
                        <SelectItem value="area">Area Code (Jagah ke Naam se)</SelectItem>
                        <SelectItem value="pincode">Pincode (Pin code se)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {newAnnouncement.targetType !== 'global' && (
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">
                        {newAnnouncement.targetType === 'area' ? 'Area Name/Code (e.g. Jahangirpuri or JHP)' : 'Pincode (e.g. 110033)'}
                      </Label>
                      <Input 
                        placeholder="Yahan value likhein..." 
                        value={newAnnouncement.targetValue}
                        onChange={(e) => setNewAnnouncement({...newAnnouncement, targetValue: e.target.value})}
                        className="rounded-xl h-11"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Video Announcement (YouTube URL)</Label>
                    <div className="relative">
                      <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
                      <Input 
                        placeholder="https://youtube.com/watch?v=..." 
                        value={newAnnouncement.videoUrl}
                        onChange={(e) => setNewAnnouncement({...newAnnouncement, videoUrl: e.target.value})}
                        className="rounded-xl h-11 pl-10"
                      />
                    </div>
                    <p className="text-[9px] text-muted-foreground">Optional: Link paste karein agar video dikhana hai.</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Announcement Message</Label>
                    <Textarea 
                      placeholder="Type your alert message here..." 
                      className="rounded-xl min-h-[100px]"
                      value={newAnnouncement.message}
                      onChange={(e) => setNewAnnouncement({...newAnnouncement, message: e.target.value})}
                    />
                  </div>

                  <Button type="submit" className="w-full h-12 rounded-xl gap-2 font-bold" disabled={isSubmittingAnnouncement}>
                    {isSubmittingAnnouncement ? <Loader2 className="animate-spin" /> : <Plus className="h-4 w-4" />}
                    Publish Announcement
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 shadow-md">
              <CardHeader>
                <CardTitle>Active Announcements</CardTitle>
                <CardDescription>Monitor and delete live alerts.</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingAnnouncements ? (
                  <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
                ) : announcements?.length === 0 ? (
                  <div className="text-center py-20 opacity-30">No active announcements found.</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Target</TableHead>
                        <TableHead>Message & Video</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {announcements?.map((a) => (
                        <TableRow key={a.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {a.targetType === 'global' ? <Globe className="h-3 w-3 text-blue-500" /> : a.targetType === 'area' ? <MapPin className="h-3 w-3 text-green-500" /> : <Hash className="h-3 w-3 text-orange-500" />}
                              <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase text-muted-foreground">{a.targetType}</span>
                                <span className="text-xs font-bold">{a.targetValue}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <div className="flex flex-col gap-1">
                              <p className="text-xs line-clamp-2 italic">"{a.message}"</p>
                              {a.videoUrl && (
                                <Badge variant="outline" className="w-fit text-[8px] bg-red-50 text-red-600 border-red-200">
                                  <Youtube className="h-2 w-2 mr-1" /> Video Linked
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell><Badge variant="outline" className="text-[8px] bg-green-50 text-green-600 border-green-200 uppercase">Live</Badge></TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteDocumentNonBlocking(doc(firestore, "announcements", a.id))}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

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
      </Tabs>
    </div>
  );
}
