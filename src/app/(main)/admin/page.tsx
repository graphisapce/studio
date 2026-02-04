
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
  Users as UsersIcon, 
  ShieldAlert, 
  Crown,
  ShieldCheck,
  BarChart3,
  Megaphone,
  Save,
  UserCog,
  Mail,
  User as UserIcon,
  Trash2,
  UserPlus,
  Search,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  ExternalLink,
  Eye,
  ArrowLeft,
  Truck
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export default function AdminDashboardPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const [announcementText, setAnnouncementText] = useState("");
  
  // Tabs & Filter State
  const [activeTab, setActiveTab] = useState("approvals");
  const [userRoleFilter, setUserRoleFilter] = useState<"all" | "customer" | "staff" | "delivery">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const isAdminOrModerator = useMemo(() => {
    return user && userProfile && ['admin', 'moderator'].includes(userProfile.role);
  }, [user, userProfile]);

  // Redirect if not admin or moderator
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else if (userProfile && !['admin', 'moderator'].includes(userProfile.role)) {
        router.push("/");
      }
    }
  }, [user, userProfile, authLoading, router, toast]);

  // Platform Configuration
  const configRef = useMemoFirebase(() => 
    isAdminOrModerator ? doc(firestore, "config", "platform") : null, 
    [firestore, isAdminOrModerator]
  );
  const { data: config } = useDoc<PlatformConfig>(configRef);

  useEffect(() => {
    if (config?.announcement) setAnnouncementText(config.announcement);
  }, [config]);

  // Data Collections
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

  // Statistics
  const pendingProducts = useMemo(() => products?.filter(p => p.status === 'pending') || [], [products]);
  const customers = useMemo(() => allUsers?.filter(u => u.role === 'customer') || [], [allUsers]);
  const staffMembers = useMemo(() => allUsers?.filter(u => ['admin', 'moderator'].includes(u.role)) || [], [allUsers]);
  const deliveryBoys = useMemo(() => allUsers?.filter(u => u.role === 'delivery-boy') || [], [allUsers]);

  // Filtered Users List with Search
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

  // Actions
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
    if (!isFullAdmin && targetCurrentRole === 'admin') {
      toast({ variant: "destructive", title: "Permission Denied" });
      return;
    }
    const userRef = doc(firestore, "users", userId);
    updateDocumentNonBlocking(userRef, { role: newRole });
    toast({ title: "Role Updated" });
  };

  const handleDeleteUser = (userId: string) => {
    if (!isFullAdmin) return;
    deleteDocumentNonBlocking(doc(firestore, "users", userId));
    toast({ title: "User Deleted" });
  };

  const handleStatClick = (type: "business" | "user-all" | "user-customer" | "user-staff" | "delivery" | "approvals") => {
    if (type === "business") {
      setActiveTab("businesses");
    } else if (type === "approvals") {
      setActiveTab("approvals");
    } else {
      setActiveTab("users");
      if (type === "user-all") setUserRoleFilter("all");
      if (type === "user-customer") setUserRoleFilter("customer");
      if (type === "user-staff") setUserRoleFilter("staff");
      if (type === "delivery") setUserRoleFilter("delivery");
    }
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
        <Card className={cn("cursor-pointer transition-all", activeTab === 'businesses' && "ring-2 ring-primary")} onClick={() => handleStatClick("business")}>
          <CardHeader className="p-4">
            <CardDescription className="font-bold uppercase text-[9px]">Shops</CardDescription>
            <CardTitle className="text-xl flex items-center gap-2"><Store className="h-4 w-4 text-blue-500" />{businesses?.length || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card className={cn("cursor-pointer transition-all", activeTab === 'approvals' && "ring-2 ring-primary")} onClick={() => handleStatClick("approvals")}>
          <CardHeader className="p-4">
            <CardDescription className="font-bold uppercase text-[9px]">Pending</CardDescription>
            <CardTitle className="text-xl flex items-center gap-2"><AlertCircle className="h-4 w-4 text-red-500" />{pendingProducts.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className={cn("cursor-pointer transition-all", userRoleFilter === 'customer' && "ring-2 ring-primary")} onClick={() => handleStatClick("user-customer")}>
          <CardHeader className="p-4">
            <CardDescription className="font-bold uppercase text-[9px]">Customers</CardDescription>
            <CardTitle className="text-xl flex items-center gap-2"><UserIcon className="h-4 w-4 text-green-500" />{customers.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className={cn("cursor-pointer transition-all", userRoleFilter === 'delivery' && "ring-2 ring-primary")} onClick={() => handleStatClick("delivery")}>
          <CardHeader className="p-4">
            <CardDescription className="font-bold uppercase text-[9px]">Delivery Boys</CardDescription>
            <CardTitle className="text-xl flex items-center gap-2"><Truck className="h-4 w-4 text-orange-500" />{deliveryBoys.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className={cn("cursor-pointer transition-all", userRoleFilter === 'staff' && "ring-2 ring-primary")} onClick={() => handleStatClick("user-staff")}>
          <CardHeader className="p-4">
            <CardDescription className="font-bold uppercase text-[9px]">Staff</CardDescription>
            <CardTitle className="text-xl flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" />{staffMembers.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="p-4">
            <CardDescription className="font-bold uppercase text-[9px]">Total Orders</CardDescription>
            <CardTitle className="text-xl flex items-center gap-2"><Package className="h-4 w-4 text-purple-500" />{orders?.length || 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-8 h-12 bg-muted/50 p-1">
          <TabsTrigger value="approvals" className="px-6">Approvals</TabsTrigger>
          <TabsTrigger value="users" className="px-6">Users & Management</TabsTrigger>
          <TabsTrigger value="businesses" className="px-6">Active Shops</TabsTrigger>
          {isFullAdmin && <TabsTrigger value="config" className="px-6">Platform Settings</TabsTrigger>}
        </TabsList>

        <TabsContent value="users">
          <Card className="border-none shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-xl">Account Moderation</CardTitle>
                <CardDescription>Manage roles and platform access.</CardDescription>
              </div>
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
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteUser(u.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
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
          {/* Approval Queue Table same as before */}
        </TabsContent>

        <TabsContent value="businesses">
          {/* Active Shops Table same as before */}
        </TabsContent>
      </Tabs>
    </div>
  );
}
