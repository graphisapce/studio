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
  User as UserIcon
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

/**
 * AdminDashboardPage
 * Global control center for LocalVyapar administrators.
 */
export default function AdminDashboardPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const [announcementText, setAnnouncementText] = useState("");

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading) {
      if (!user) router.push("/login");
      else if (userProfile && userProfile.role !== "admin") router.push("/");
    }
  }, [user, userProfile, authLoading, router]);

  // Platform Configuration
  const configRef = useMemoFirebase(() => doc(firestore, "config", "platform"), [firestore]);
  const { data: config } = useDoc<PlatformConfig>(configRef);

  useEffect(() => {
    if (config?.announcement) setAnnouncementText(config.announcement);
  }, [config]);

  // Data Collections
  const businessesRef = useMemoFirebase(() => collection(firestore, "businesses"), [firestore]);
  const { data: businesses, isLoading: loadingBusinesses } = useCollection<Business>(businessesRef);

  const usersRef = useMemoFirebase(() => collection(firestore, "users"), [firestore]);
  const { data: allUsers, isLoading: loadingUsers } = useCollection<UserProfile>(usersRef);

  const productsRef = useMemoFirebase(() => collection(firestore, "products"), [firestore]);
  const { data: products, isLoading: loadingProducts } = useCollection<Product>(productsRef);

  // Statistics
  const pendingProducts = useMemo(() => products?.filter(p => p.status === 'pending') || [], [products]);

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

  const handleUpdateUserRole = (userId: string, newRole: 'customer' | 'business' | 'admin') => {
    const userRef = doc(firestore, "users", userId);
    updateDocumentNonBlocking(userRef, { role: newRole });
    toast({ 
      title: "Role Updated", 
      description: `User role changed to ${newRole.toUpperCase()}.` 
    });
  };

  if (authLoading || loadingBusinesses || loadingUsers || loadingProducts) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Opening Administrator Panel...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 text-primary rounded-xl"><ShieldAlert className="h-8 w-8" /></div>
          <div>
            <h1 className="text-3xl font-bold font-headline">Platform Administration</h1>
            <p className="text-muted-foreground">Global settings, users, and shop moderation.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="font-bold uppercase text-[10px]">Total Businesses</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2"><Store className="h-6 w-6 text-blue-500" />{businesses?.length || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="font-bold uppercase text-[10px]">Total Users</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2"><UsersIcon className="h-6 w-6 text-purple-500" />{allUsers?.length || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="shadow-sm bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardDescription className="font-bold uppercase text-[10px]">Premium Subscriptions</CardDescription>
              <CardTitle className="text-3xl text-primary font-black"><Crown className="h-6 w-6" />{businesses?.filter(b => b.isPaid).length || 0}</CardTitle>
            </CardHeader>
          </Card>
        </div>
        
        <Card className="lg:col-span-1 shadow-sm overflow-hidden">
          <CardHeader className="pb-2">
             <CardTitle className="text-sm font-bold flex items-center gap-2">
               <BarChart3 className="h-4 w-4" /> Shops by Category
             </CardTitle>
          </CardHeader>
          <CardContent className="h-[120px] p-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <Bar dataKey="value">
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
                <Tooltip />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="approvals" className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="approvals">Approvals ({pendingProducts.length})</TabsTrigger>
          <TabsTrigger value="users">Manage Users</TabsTrigger>
          <TabsTrigger value="businesses">Shops</TabsTrigger>
          <TabsTrigger value="config">Platform Config</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><UserCog className="h-5 w-5" /> User Accounts</CardTitle>
              <CardDescription>View all users and update their platform roles.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User Detail</TableHead>
                    <TableHead>Current Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allUsers?.map((u) => (
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
                        <Badge variant={u.role === 'admin' ? 'destructive' : u.role === 'business' ? 'default' : 'secondary'} className="uppercase text-[10px]">
                          {u.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Select 
                          defaultValue={u.role} 
                          onValueChange={(val: any) => handleUpdateUserRole(u.id, val)}
                        >
                          <SelectTrigger className="w-[140px] ml-auto h-8 text-xs">
                            <SelectValue placeholder="Change Role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="customer">Customer</SelectItem>
                            <SelectItem value="business">Business</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config">
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center gap-2"><Megaphone className="h-5 w-5" /> Homepage Announcement</CardTitle>
               <CardDescription>Changes the marquee text shown to all users.</CardDescription>
             </CardHeader>
             <CardContent className="space-y-4">
               <div className="space-y-2">
                 <Label>Announcement Text</Label>
                 <Input 
                   value={announcementText} 
                   onChange={(e) => setAnnouncementText(e.target.value)} 
                   placeholder="e.g. 50% Discount at local shops today!"
                 />
               </div>
               <Button onClick={handleUpdateConfig} className="gap-2">
                 <Save className="h-4 w-4" /> Update Globally
               </Button>
             </CardContent>
           </Card>
        </TabsContent>

        <TabsContent value="approvals">
          <Card>
            <CardHeader><CardTitle>Review Queue</CardTitle></CardHeader>
            <CardContent>
              {pendingProducts.length === 0 ? (
                <div className="text-center py-10 opacity-50">All caught up! No pending approvals.</div>
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
                          <Button size="sm" className="bg-green-600" onClick={() => handleProductAction(p.id, 'approved')}>Approve</Button>
                          <Button size="sm" variant="destructive" onClick={() => handleProductAction(p.id, 'rejected')}>Reject</Button>
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Shop Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Engagement</TableHead>
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
                        <div className="flex flex-col gap-1">
                          {b.isPaid ? <Badge className="bg-green-500 w-fit text-[10px]">Premium</Badge> : <Badge variant="secondary" className="w-fit text-[10px]">Free Plan</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-bold text-primary">{b.views || 0} Views</span>
                        <div className="text-[10px] text-muted-foreground">{(b.callCount || 0) + (b.whatsappCount || 0)} Leads</div>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => handleToggleVerify(b.id, !!b.isVerified)}>
                           {b.isVerified ? "Unverify" : "Verify"}
                        </Button>
                        <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => handleTogglePremium(b.id, !!b.isPaid)}>
                          {b.isPaid ? "Revoke" : "Grant"} Premium
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
