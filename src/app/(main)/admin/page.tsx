
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
  Eye
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
import { Business, Product, UserProfile, PlatformConfig } from "@/lib/types";
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
  const [userRoleFilter, setUserRoleFilter] = useState<"all" | "customer" | "staff">("all");
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
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "You do not have permission to view the Admin Panel."
        });
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

  const isFullAdmin = userProfile?.role === 'admin';

  // Statistics
  const pendingProducts = useMemo(() => products?.filter(p => p.status === 'pending') || [], [products]);
  const customers = useMemo(() => allUsers?.filter(u => u.role === 'customer') || [], [allUsers]);
  const staffMembers = useMemo(() => allUsers?.filter(u => ['admin', 'moderator'].includes(u.role)) || [], [allUsers]);

  // Filtered Users List with Search
  const filteredUsers = useMemo(() => {
    if (!allUsers) return [];
    let list = allUsers;
    
    if (userRoleFilter === 'customer') list = list.filter(u => u.role === 'customer');
    if (userRoleFilter === 'staff') list = list.filter(u => ['admin', 'moderator'].includes(u.role));
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(u => 
        u.name.toLowerCase().includes(q) || 
        u.email.toLowerCase().includes(q)
      );
    }
    
    return list;
  }, [allUsers, userRoleFilter, searchQuery]);

  // Filtered Businesses with Search
  const filteredBusinesses = useMemo(() => {
    if (!businesses) return [];
    if (!searchQuery.trim()) return businesses;
    const q = searchQuery.toLowerCase();
    return businesses.filter(b => 
      b.shopName.toLowerCase().includes(q) || 
      b.ownerId.toLowerCase().includes(q)
    );
  }, [businesses, searchQuery]);

  // Chart Data: Category Distribution
  const chartData = useMemo(() => {
    if (!businesses) return [];
    const categories = businesses.reduce((acc, b) => {
      acc[b.category] = (acc[b.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [businesses]);

  const COLORS = ['#14b8a6', '#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6', '#10b981', '#f97316', '#06b6d4'];

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

  const handleTogglePremium = (businessId: string, currentStatus: boolean) => {
    const businessRef = doc(firestore, "businesses", businessId);
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    updateDocumentNonBlocking(businessRef, {
      isPaid: !currentStatus,
      premiumStatus: !currentStatus ? 'active' : 'none',
      premiumUntil: !currentStatus ? expiryDate.toISOString() : null
    });
    toast({ title: "Status Updated" });
  };

  const handleToggleVerify = (businessId: string, currentStatus: boolean) => {
    const businessRef = doc(firestore, "businesses", businessId);
    updateDocumentNonBlocking(businessRef, {
      isVerified: !currentStatus
    });
    toast({ title: "Verification Updated" });
  };

  const handleProductAction = (productId: string, action: 'approved' | 'rejected') => {
    const productRef = doc(firestore, "products", productId);
    updateDocumentNonBlocking(productRef, { status: action });
    toast({ title: `Product ${action}` });
  };

  const handleUpdateUserRole = (userId: string, targetCurrentRole: string, newRole: any) => {
    // SECURITY: Moderators cannot change their own role
    if (!isFullAdmin && userId === user?.uid) {
      toast({ 
        variant: "destructive", 
        title: "Action Denied", 
        description: "Staff members cannot change their own role." 
      });
      return;
    }

    if (!isFullAdmin && targetCurrentRole === 'admin') {
      toast({ variant: "destructive", title: "Permission Denied", description: "Staff members cannot modify Admin profiles." });
      return;
    }
    if (!isFullAdmin && newRole === 'admin') {
      toast({ variant: "destructive", title: "Permission Denied", description: "Only super admins can assign ADMIN role." });
      return;
    }
    const userRef = doc(firestore, "users", userId);
    updateDocumentNonBlocking(userRef, { role: newRole });
    toast({ title: "Role Updated", description: `User role changed to ${newRole.toUpperCase()}.` });
  };

  const handleDeleteUser = (userId: string, targetRole: string) => {
    if (!isFullAdmin) {
       toast({ variant: "destructive", title: "Admin Required" });
       return;
    }
    deleteDocumentNonBlocking(doc(firestore, "users", userId));
    toast({ title: "User Deleted" });
  };

  const handleDeleteBusiness = (businessId: string) => {
    deleteDocumentNonBlocking(doc(firestore, "businesses", businessId));
    toast({ title: "Business Deleted" });
  };

  const handleStatClick = (type: "business" | "user-all" | "user-customer" | "user-staff" | "approvals") => {
    if (type === "business") {
      setActiveTab("businesses");
    } else if (type === "approvals") {
      setActiveTab("approvals");
    } else {
      setActiveTab("users");
      if (type === "user-all") setUserRoleFilter("all");
      if (type === "user-customer") setUserRoleFilter("customer");
      if (type === "user-staff") setUserRoleFilter("staff");
    }
  };

  if (authLoading || (user && !userProfile)) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Verifying access...</p>
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
            <h1 className="text-3xl font-bold font-headline">
              {isFullAdmin ? "Super Admin" : "Moderator Panel"}
            </h1>
            <p className="text-muted-foreground text-sm">Platform management and insights.</p>
          </div>
        </div>
        
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search name, email, shop..." 
            className="pl-10 h-10 rounded-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <Card 
          className={cn("shadow-sm cursor-pointer transition-all hover:scale-[1.02]", activeTab === 'businesses' && "ring-2 ring-primary")}
          onClick={() => handleStatClick("business")}
        >
          <CardHeader className="p-4">
            <CardDescription className="font-bold uppercase text-[10px]">Shops</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Store className="h-5 w-5 text-blue-500" />
              {businesses?.length || 0}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card 
          className={cn("shadow-sm cursor-pointer transition-all hover:scale-[1.02]", activeTab === 'approvals' && "ring-2 ring-primary")}
          onClick={() => handleStatClick("approvals")}
        >
          <CardHeader className="p-4">
            <CardDescription className="font-bold uppercase text-[10px]">Pending</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <AlertCircle className={cn("h-5 w-5", pendingProducts.length > 0 ? "text-red-500 animate-pulse" : "text-muted-foreground")} />
              {pendingProducts.length}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card 
          className={cn("shadow-sm cursor-pointer transition-all hover:scale-[1.02]", activeTab === 'users' && userRoleFilter === 'customer' && "ring-2 ring-primary")}
          onClick={() => handleStatClick("user-customer")}
        >
          <CardHeader className="p-4">
            <CardDescription className="font-bold uppercase text-[10px]">Customers</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-green-500" />
              {customers.length}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card 
          className={cn("shadow-sm cursor-pointer transition-all hover:scale-[1.02]", activeTab === 'users' && userRoleFilter === 'staff' && "ring-2 ring-primary")}
          onClick={() => handleStatClick("user-staff")}
        >
          <CardHeader className="p-4">
            <CardDescription className="font-bold uppercase text-[10px]">Staff</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2 text-primary">
              <ShieldCheck className="h-5 w-5" />
              {staffMembers.length}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="shadow-sm hidden lg:block overflow-hidden border-none bg-primary/5">
          <CardContent className="h-[80px] p-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-8 h-12 bg-muted/50 p-1">
          <TabsTrigger value="approvals" className="px-6 data-[state=active]:bg-white">Approval Queue</TabsTrigger>
          <TabsTrigger value="users" className="px-6 data-[state=active]:bg-white">Users & Staff</TabsTrigger>
          <TabsTrigger value="businesses" className="px-6 data-[state=active]:bg-white">Active Shops</TabsTrigger>
          {isFullAdmin && <TabsTrigger value="config" className="px-6 data-[state=active]:bg-white">Platform Settings</TabsTrigger>}
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card className="border-none shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b mb-4">
              <div>
                <CardTitle className="text-xl flex items-center gap-2"><UserCog className="h-5 w-5 text-primary" /> Account Moderation</CardTitle>
                <CardDescription>Update roles and manage account access.</CardDescription>
              </div>
              <Select value={userRoleFilter} onValueChange={(v: any) => setUserRoleFilter(v)}>
                <SelectTrigger className="w-[150px] rounded-full">
                  <SelectValue placeholder="Role Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Profiles</SelectItem>
                  <SelectItem value="customer">Customers Only</SelectItem>
                  <SelectItem value="staff">Staff & Admins</SelectItem>
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
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers?.map((u) => (
                      <TableRow key={u.id} className="hover:bg-muted/10 transition-colors">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold flex items-center gap-2">
                              {u.name} {u.id === user?.uid && <Badge variant="outline" className="text-[8px]">Me</Badge>}
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" /> {u.email}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={u.role === 'admin' ? 'destructive' : u.role === 'moderator' ? 'default' : u.role === 'business' ? 'secondary' : 'outline'} className="uppercase text-[9px] font-black">
                            {u.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {u.role === 'business' && (
                              <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-primary">
                                <Link href={`/business/${u.id}`} target="_blank">
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                            )}
                            <Select 
                              disabled={(u.role === 'admin' && !isFullAdmin) || (u.id === user?.uid && !isFullAdmin)}
                              defaultValue={u.role} 
                              onValueChange={(val: any) => handleUpdateUserRole(u.id, u.role, val)}
                            >
                              <SelectTrigger className="w-[110px] h-8 text-[10px] font-bold rounded-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="customer">Customer</SelectItem>
                                <SelectItem value="business">Business</SelectItem>
                                <SelectItem value="moderator">Moderator</SelectItem>
                                {isFullAdmin && <SelectItem value="admin">Admin</SelectItem>}
                              </SelectContent>
                            </Select>
                            
                            {isFullAdmin && u.id !== user?.uid && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete User Profile?</AlertDialogTitle>
                                    <AlertDialogDescription>This will remove the user permanently. This action cannot be undone.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteUser(u.id, u.role)} className="bg-destructive">Delete Permanently</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
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

        <TabsContent value="config">
           <Card className="border-none shadow-md">
             <CardHeader>
               <CardTitle className="flex items-center gap-2"><Megaphone className="h-5 w-5 text-primary" /> Platform-wide Announcement</CardTitle>
               <CardDescription>This message will appear on the homepage for all users.</CardDescription>
             </CardHeader>
             <CardContent className="space-y-4">
               <div className="space-y-2">
                 <Label>Announcement Text</Label>
                 <Input value={announcementText} onChange={(e) => setAnnouncementText(e.target.value)} placeholder="e.g. Swagat hai LocalVyapar पर! Nayi shops ab live hain." />
               </div>
               <Button onClick={handleUpdateConfig} className="gap-2 rounded-full"><Save className="h-4 w-4" /> Save Configuration</Button>
             </CardContent>
           </Card>
        </TabsContent>

        <TabsContent value="approvals">
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle>Product Approval Queue</CardTitle>
              <CardDescription>Verify and approve new product listings from shop owners.</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingProducts ? (
                <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
              ) : pendingProducts.length === 0 ? (
                <div className="text-center py-20 opacity-30 flex flex-col items-center">
                  <CheckCircle2 className="h-12 w-12 mb-4" />
                  <p className="font-bold">Queue is empty. Great job!</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>Product Info</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingProducts.map((p) => (
                      <TableRow key={p.id} className="hover:bg-muted/10 transition-colors">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {p.title}
                            <Button asChild variant="ghost" size="icon" className="h-6 w-6 text-primary">
                              <Link href={`/business/${p.businessId}`} target="_blank">
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            </Button>
                          </div>
                          <div className="text-[10px] text-muted-foreground">Shop ID: {p.businessId}</div>
                        </TableCell>
                        <TableCell className="font-black text-primary">₹{p.price}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button size="sm" className="bg-green-600 hover:bg-green-700 h-8 rounded-full" onClick={() => handleProductAction(p.id, 'approved')}>Approve</Button>
                          <Button size="sm" variant="destructive" className="h-8 rounded-full" onClick={() => handleProductAction(p.id, 'rejected')}>Reject</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="businesses">
          <Card className="border-none shadow-md">
            <CardContent className="pt-6">
              {loadingBusinesses ? (
                <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>Shop Info</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Performance</TableHead>
                      <TableHead className="text-right">Moderation</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBusinesses?.map((b) => (
                      <TableRow key={b.id} className="hover:bg-muted/10 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Link href={`/business/${b.id}`} target="_blank" className="font-bold hover:text-primary transition-colors flex items-center gap-2">
                              {b.shopName}
                              <ExternalLink className="h-3 w-3 opacity-50" />
                            </Link>
                            {b.isVerified && <ShieldCheck className="h-4 w-4 text-blue-500" />}
                          </div>
                          <div className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium">
                            <UserIcon className="h-2 w-2" /> {b.ownerId}
                          </div>
                        </TableCell>
                        <TableCell>
                          {b.isPaid ? <Badge className="bg-yellow-500 text-[9px] font-black"><Crown className="h-2.5 w-2.5 mr-1" /> PREMIUM</Badge> : <Badge variant="secondary" className="text-[9px] font-black">FREE</Badge>}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-[11px] font-black text-primary flex items-center gap-1"><TrendingUp className="h-3 w-3" /> {b.views || 0} Views</span>
                            <span className="text-[10px] text-muted-foreground font-bold">{(b.callCount || 0) + (b.whatsappCount || 0)} Real Leads</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="outline" size="sm" className="h-7 text-[10px] rounded-full border-primary/20" onClick={() => handleToggleVerify(b.id, !!b.isVerified)}>
                              {b.isVerified ? "Unverify" : "Verify Shop"}
                            </Button>
                            <Button variant="outline" size="sm" className="h-7 text-[10px] rounded-full" onClick={() => handleTogglePremium(b.id, !!b.isPaid)}>
                              {b.isPaid ? "Revoke Premium" : "Grant Premium"}
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>Delete Business?</AlertDialogTitle><AlertDialogDescription>This will remove the shop and its inventory.</AlertDialogDescription></AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteBusiness(b.id)} className="bg-destructive">Delete Shop</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
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
      </Tabs>
    </div>
  );
}
