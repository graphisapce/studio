"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { 
  collection, 
  query, 
  doc, 
  deleteDoc, 
  updateDoc 
} from "firebase/firestore";
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
  ExternalLink
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

export default function AdminDashboardPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();

  // Guard: Only admins allowed
  useEffect(() => {
    if (!authLoading) {
      if (!user) router.push("/login");
      else if (userProfile && userProfile.role !== "admin") {
        toast({ variant: "destructive", title: "Access Denied", description: "Only administrators can view this page." });
        router.push("/");
      }
    }
  }, [user, userProfile, authLoading, router, toast]);

  // Data Fetching
  const businessesQuery = useMemoFirebase(() => collection(firestore, "businesses"), [firestore]);
  const { data: businesses, isLoading: loadingBusinesses } = useCollection<Business>(businessesQuery);

  const usersQuery = useMemoFirebase(() => collection(firestore, "users"), [firestore]);
  const { data: users, isLoading: loadingUsers } = useCollection<UserProfile>(usersQuery);

  const productsQuery = useMemoFirebase(() => collection(firestore, "products"), [firestore]);
  const { data: products, isLoading: loadingProducts } = useCollection<Product>(productsQuery);

  const handleTogglePremium = (businessId: string, currentStatus: boolean) => {
    const businessRef = doc(firestore, "businesses", businessId);
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    updateDocumentNonBlocking(businessRef, {
      isPaid: !currentStatus,
      premiumStatus: !currentStatus ? 'active' : 'none',
      premiumUntil: !currentStatus ? expiryDate.toISOString() : null
    });

    toast({ 
      title: "Status Updated", 
      description: `Premium status for business ${currentStatus ? 'removed' : 'activated'}.` 
    });
  };

  const handleDeleteEntry = (collectionName: string, id: string) => {
    if (!confirm("Are you sure you want to delete this entry? This action cannot be undone.")) return;
    
    const docRef = doc(firestore, collectionName, id);
    deleteDocumentNonBlocking(docRef);
    
    toast({ title: "Deleted", description: "The entry has been removed from the database." });
  };

  if (authLoading || loadingBusinesses || loadingUsers || loadingProducts) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading Administrator Control Panel...</p>
      </div>
    );
  }

  if (userProfile?.role !== 'admin') return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-red-100 text-red-600 rounded-xl">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-headline">Admin Control Panel</h1>
          <p className="text-muted-foreground">Manage users, businesses, and platform-wide settings.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-blue-50 border-blue-100">
          <CardHeader className="pb-2">
            <CardDescription className="text-blue-600 font-bold uppercase text-[10px]">Total Businesses</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <Store className="h-6 w-6 text-blue-500" />
              {businesses?.length || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-purple-50 border-purple-100">
          <CardHeader className="pb-2">
            <CardDescription className="text-purple-600 font-bold uppercase text-[10px]">Registered Users</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <Users className="h-6 w-6 text-purple-500" />
              {users?.length || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-green-50 border-green-100">
          <CardHeader className="pb-2">
            <CardDescription className="text-green-600 font-bold uppercase text-[10px]">Total Listings</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <Package className="h-6 w-6 text-green-500" />
              {products?.length || 0}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="businesses" className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-md mb-8">
          <TabsTrigger value="businesses">Businesses</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
        </TabsList>

        <TabsContent value="businesses">
          <Card>
            <CardHeader>
              <CardTitle>Manage Shopfronts</CardTitle>
              <CardDescription>Approve premium status or remove shops.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Shop Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Owner ID</TableHead>
                    <TableHead>Premium</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {businesses?.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">
                        <Link href={`/business/${b.id}`} className="hover:underline flex items-center gap-2">
                          {b.shopName} <ExternalLink className="h-3 w-3 opacity-50" />
                        </Link>
                      </TableCell>
                      <TableCell><Badge variant="outline">{b.category}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{b.ownerId}</TableCell>
                      <TableCell>
                        {b.isPaid ? (
                          <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Active</Badge>
                        ) : (
                          <Badge variant="secondary"><XCircle className="h-3 w-3 mr-1" /> None</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className={b.isPaid ? "text-red-500" : "text-green-600"}
                          onClick={() => handleTogglePremium(b.id, !!b.isPaid)}
                        >
                          <Crown className="h-4 w-4 mr-1" /> {b.isPaid ? "Revoke" : "Grant"}
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeleteEntry("businesses", b.id)}
                        >
                          <Trash2 className="h-4 w-4" />
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
            <CardHeader>
              <CardTitle>Registered Users</CardTitle>
              <CardDescription>View all platform participants.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <Badge variant={u.role === 'admin' ? 'destructive' : u.role === 'business' ? 'default' : 'secondary'}>
                          {u.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeleteEntry("users", u.id)}
                          disabled={u.role === 'admin'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Global Inventory</CardTitle>
              <CardDescription>Monitor and moderate product listings.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Business ID</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products?.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.title}</TableCell>
                      <TableCell>₹{p.price}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{p.businessId}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeleteEntry("products", p.id)}
                        >
                          <Trash2 className="h-4 w-4" />
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
