
"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { collection, doc } from "firebase/firestore";
import { 
  useFirestore, 
  useCollection, 
  useMemoFirebase,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking
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
  Trash2, 
  Store, 
  Users, 
  Package, 
  ShieldAlert, 
  Crown,
  CheckCircle,
  XCircle,
  ThumbsUp,
  ThumbsDown,
  Eye,
  BarChart3
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
import { Business, Product, UserProfile } from "@/lib/types";
import Link from "next/link";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";

export default function AdminDashboardPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();

  useEffect(() => {
    if (!authLoading) {
      if (!user) router.push("/login");
      else if (userProfile && userProfile.role !== "admin") router.push("/");
    }
  }, [user, userProfile, authLoading, router]);

  const businessesRef = useMemoFirebase(() => collection(firestore, "businesses"), [firestore]);
  const { data: businesses, isLoading: loadingBusinesses } = useCollection<Business>(businessesRef);

  const usersRef = useMemoFirebase(() => collection(firestore, "users"), [firestore]);
  const { data: users, isLoading: loadingUsers } = useCollection<UserProfile>(usersRef);

  const productsRef = useMemoFirebase(() => collection(firestore, "products"), [firestore]);
  const { data: products, isLoading: loadingProducts } = useCollection<Product>(productsRef);

  const pendingProducts = useMemo(() => products?.filter(p => p.status === 'pending') || [], [products]);

  const chartData = useMemo(() => {
    if (!businesses) return [];
    const categories = businesses.reduce((acc, b) => {
      acc[b.category] = (acc[b.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  }, [businesses]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

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

  const handleProductAction = (productId: string, action: 'approved' | 'rejected') => {
    const productRef = doc(firestore, "products", productId);
    updateDocumentNonBlocking(productRef, { status: action });
    toast({ title: `Product ${action}` });
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
            <p className="text-muted-foreground">Full authority over platform data and moderation.</p>
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
              <CardDescription className="font-bold uppercase text-[10px]">Active Users</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2"><Users className="h-6 w-6 text-purple-500" />{users?.length || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="shadow-sm bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardDescription className="font-bold uppercase text-[10px]">Premium Users</CardDescription>
              <CardTitle className="text-3xl text-primary font-black"><Crown className="h-6 w-6" />{businesses?.filter(b => b.isPaid).length || 0}</CardTitle>
            </CardHeader>
          </Card>
        </div>
        
        <Card className="lg:col-span-1 shadow-sm">
          <CardHeader className="pb-2">
             <CardTitle className="text-sm font-bold flex items-center gap-2">
               <BarChart3 className="h-4 w-4" /> Category Distribution
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

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="pending">Approvals ({pendingProducts.length})</TabsTrigger>
          <TabsTrigger value="businesses">Businesses</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="all-products">Global Inventory</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
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
                          <Button size="sm" className="bg-green-600" onClick={() => handleProductAction(p.id, 'approved')}><ThumbsUp className="h-4 w-4 mr-1" /> Approve</Button>
                          <Button size="sm" variant="destructive" onClick={() => handleProductAction(p.id, 'rejected')}><ThumbsDown className="h-4 w-4 mr-1" /> Reject</Button>
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
                    <TableHead>Premium</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {businesses?.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">{b.shopName}</TableCell>
                      <TableCell>{b.isPaid ? <Badge className="bg-green-500">Active</Badge> : <Badge variant="secondary">None</Badge>}</TableCell>
                      <TableCell>{b.views || 0}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" asChild><Link href={`/business/${b.id}`}><Eye className="h-4 w-4 mr-1" /> View</Link></Button>
                        <Button variant="outline" size="sm" className={b.isPaid ? "text-destructive" : "text-green-600"} onClick={() => handleTogglePremium(b.id, !!b.isPaid)}>
                          <Crown className="h-4 w-4 mr-1" /> {b.isPaid ? "Revoke" : "Grant"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>{u.name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell><Badge variant="outline">{u.role}</Badge></TableCell>
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
