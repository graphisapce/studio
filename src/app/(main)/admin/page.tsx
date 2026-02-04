
"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { collection, doc, setDoc } from "firebase/firestore";
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
  Heart
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
} from "@/table-ui";
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

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    if (!allUsers) return [];
    if (userRoleFilter === 'customer') return allUsers.filter(u => u.role === 'customer');
    if (userRoleFilter === 'staff') return allUsers.filter(u => ['admin', 'moderator'].includes(u.role));
    return allUsers;
  }, [allUsers, userRoleFilter]);

  const chartData = useMemo(() => {
    if (!businesses) return [];
    const categories = businesses.reduce((acc, b) => {
      acc[b.category] = (acc[b.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  }, [businesses]);

  const COLORS = ['#14b8a6', '#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6', '#10b981'];

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

  const handleStatClick = (type: "business" | "user-all" | "user-customer" | "user-staff") => {
    if (type === "business") {
      setActiveTab("businesses");
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
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 text-primary rounded-xl">
            {isFullAdmin ? <ShieldAlert className="h-8 w-8" /> : <UserPlus className="h-8 w-8" />}
          </div>
          <div>
            <h1 className="text-3xl font-bold font-headline">
              {isFullAdmin ? "Super Admin Dashboard" : "Staff Moderation Panel"}
            </h1>
            <p className="text-muted-foreground">Manage users, shops, and platform content.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
        <Card 
          className={cn("shadow-sm cursor-pointer transition-all hover:ring-2 hover:ring-primary/20", activeTab === 'businesses' && "ring-2 ring-primary")}
          onClick={() => handleStatClick("business")}
        >
          <CardHeader className="p-4">
            <CardDescription className="font-bold uppercase text-[10px]">Businesses</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Store className="h-5 w-5 text-blue-500" />
              {businesses?.length || 0}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card 
          className={cn("shadow-sm cursor-pointer transition-all hover:ring-2 hover:ring-primary/20", activeTab === 'users' && userRoleFilter === 'all' && "ring-2 ring-primary")}
          onClick={() => handleStatClick("user-all")}
        >
          <CardHeader className="p-4">
            <CardDescription className="font-bold uppercase text-[10px]">Total Users</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <UsersIcon className="h-5 w-5 text-purple-500" />
              {allUsers?.length || 0}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card 
          className={cn("shadow-sm cursor-pointer transition-all hover:ring-2 hover:ring-primary/20", activeTab === 'users' && userRoleFilter === 'customer' && "ring-2 ring-primary")}
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
          className={cn("shadow-sm cursor-pointer transition-all hover:ring-2 hover:ring-primary/20", activeTab === 'users' && userRoleFilter === 'staff' && "ring-2 ring-primary")}
          onClick={() => handleStatClick("user-staff")}
        >
          <CardHeader className="p-4">
            <CardDescription className="font-bold uppercase text-[10px]">Staff/Admins</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2 text-primary">
              <ShieldCheck className="h-5 w-5" />
              {staffMembers.length}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="shadow-sm md:col-span-1 lg:col-span-1 hidden lg:block overflow-hidden">
          <CardContent className="h-[80px] p-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <Bar dataKey="value">
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
        <TabsList className="mb-8">
          <TabsTrigger value="approvals">Approvals ({pendingProducts.length})</TabsTrigger>
          <TabsTrigger value="users">Users & Staff</TabsTrigger>
          <TabsTrigger value="businesses">Shops</TabsTrigger>
          {isFullAdmin && <TabsTrigger value="config">Settings</TabsTrigger>}
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2"><UserCog className="h-5 w-5" /> Account Moderation</CardTitle>
                <CardDescription>
                  {userRoleFilter === 'customer' ? "Showing only Customers." : userRoleFilter === 'staff' ? "Showing Staff & Moderators." : "Showing all account types."}
                </CardDescription>
              </div>
              <Select value={userRoleFilter} onValueChange={(v: any) => setUserRoleFilter(v)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="customer">Customers</SelectItem>
                  <SelectItem value="staff">Staff Members</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              {loadingUsers ? (
                <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User Identity</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Manage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers?.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold flex items-center gap-2">
                              <UserIcon className="h-3 w-3 text-muted-foreground" /> {u.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Mail className="h-2 w-2" /> {u.email}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={u.role === 'admin' ? 'destructive' : u.role === 'moderator' ? 'default' : u.role === 'business' ? 'secondary' : 'outline'} className="uppercase text-[10px]">
                            {u.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Select 
                              disabled={u.role === 'admin' && !isFullAdmin}
                              defaultValue={u.role} 
                              onValueChange={(val: any) => handleUpdateUserRole(u.id, u.role, val)}
                            >
                              <SelectTrigger className="w-[120px] h-8 text-xs">
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
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete User Profile?</AlertDialogTitle>
                                    <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteUser(u.id, u.role)} className="bg-destructive">Delete</AlertDialogAction>
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
           <Card>
             <CardHeader><CardTitle className="flex items-center gap-2"><Megaphone className="h-5 w-5" /> Platform Announcement</CardTitle></CardHeader>
             <CardContent className="space-y-4">
               <Input value={announcementText} onChange={(e) => setAnnouncementText(e.target.value)} placeholder="Announcement text..." />
               <Button onClick={handleUpdateConfig} className="gap-2"><Save className="h-4 w-4" /> Save</Button>
             </CardContent>
           </Card>
        </TabsContent>

        <TabsContent value="approvals">
          <Card>
            <CardHeader><CardTitle>Approval Queue</CardTitle></CardHeader>
            <CardContent>
              {loadingProducts ? (
                <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : pendingProducts.length === 0 ? (
                <div className="text-center py-10 opacity-50">No pending products.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingProducts.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.title}</TableCell>
                        <TableCell>₹{p.price}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button size="sm" className="bg-green-600 h-8" onClick={() => handleProductAction(p.id, 'approved')}>Approve</Button>
                          <Button size="sm" variant="destructive" className="h-8" onClick={() => handleProductAction(p.id, 'rejected')}>Reject</Button>
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
          <Card>
            <CardContent className="pt-6">
              {loadingBusinesses ? (
                <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Shop Info</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Performance</TableHead>
                      <TableHead className="text-right">Moderation</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {businesses?.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{b.shopName}</span>
                            {b.isVerified && <ShieldCheck className="h-4 w-4 text-blue-500" />}
                          </div>
                          <div className="text-[10px] text-muted-foreground">Owner ID: {b.ownerId}</div>
                        </TableCell>
                        <TableCell>
                          {b.isPaid ? <Badge className="bg-green-500 text-[10px]">Premium</Badge> : <Badge variant="secondary" className="text-[10px]">Free</Badge>}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-primary">{b.views || 0} Views</span>
                            <span className="text-[10px] text-muted-foreground">{(b.callCount || 0) + (b.whatsappCount || 0)} Leads</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => handleToggleVerify(b.id, !!b.isVerified)}>
                              {b.isVerified ? "Unverify" : "Verify"}
                            </Button>
                            <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => handleTogglePremium(b.id, !!b.isPaid)}>
                              {b.isPaid ? "Revoke" : "Grant"}
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>Delete Business?</AlertDialogTitle></AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteBusiness(b.id)} className="bg-destructive">Delete</AlertDialogAction>
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
