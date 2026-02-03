
"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { 
  collection, 
  doc, 
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
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  UserCog,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function AdminDashboardPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else if (userProfile && userProfile.role !== "admin") {
        toast({ 
          variant: "destructive", 
          title: "Access Denied", 
          description: "This page is only for administrators." 
        });
        router.push("/");
      }
    }
  }, [user, userProfile, authLoading, router, toast]);

  const businessesRef = useMemoFirebase(() => collection(firestore, "businesses"), [firestore]);
  const { data: businesses, isLoading: loadingBusinesses } = useCollection<Business>(businessesRef);

  const usersRef = useMemoFirebase(() => collection(firestore, "users"), [firestore]);
  const { data: users, isLoading: loadingUsers } = useCollection<UserProfile>(usersRef);

  const productsRef = useMemoFirebase(() => collection(firestore, "products"), [firestore]);
  const { data: products, isLoading: loadingProducts } = useCollection<Product>(productsRef);

  const pendingProducts = useMemo(() => {
    return products?.filter(p => p.status === 'pending') || [];
  }, [products]);

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

  const handleProductAction = (productId: string, action: 'approved' | 'rejected') => {
    const productRef = doc(firestore, "products", productId);
    updateDocumentNonBlocking(productRef, {
      status: action
    });
    toast({ title: `Product ${action}`, description: `Listing has been marked as ${action}.` });
  };

  const handleUserRoleChange = (userId: string, newRole: string) => {
    if (userId === user?.uid) {
      toast({ variant: "destructive", title: "Error", description: "You cannot change your own role." });
      return;
    }
    const userRef = doc(firestore, "users", userId);
    updateDocumentNonBlocking(userRef, {
      role: newRole
    });
    toast({ title: "Role Updated", description: `User role changed to ${newRole}.` });
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
        <p className="text-muted-foreground">Opening Administrator Control Panel...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 text-primary rounded-xl">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-headline">Admin Control Panel</h1>
            <p className="text-muted-foreground">Full authority over platform data and moderation.</p>
          </div>
        </div>
        {pendingProducts.length > 0 && (
          <Badge className="animate-pulse bg-red-500 hover:bg-red-600 text-white px-4 py-2">
            {pendingProducts.length} Pending Approvals
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="font-bold uppercase text-[10px]">Total Businesses</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Store className="h-5 w-5 text-blue-500" />
              {businesses?.length || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="font-bold uppercase text-[10px]">Total Users</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              {users?.length || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="font-bold uppercase text-[10px]">Total Listings</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Package className="h-5 w-5 text-green-500" />
              {products?.length || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardDescription className="font-bold uppercase text-[10px]">Premium Revenue Est.</CardDescription>
            <CardTitle className="text-2xl text-primary font-black">
              ₹{(businesses?.filter(b => b.isPaid).length || 0) * 99}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="mb-8 overflow-x-auto h-auto p-1 bg-muted rounded-lg flex-nowrap w-full justify-start md:w-auto">
          <TabsTrigger value="pending" className="relative">
            Pending Products
            {pendingProducts.length > 0 && (
              <span className="ml-2 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                {pendingProducts.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="businesses">Businesses</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="all-products">All Listings</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Needs Approval</CardTitle>
              <CardDescription>Review and approve new products before they go live.</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingProducts.length === 0 ? (
                <div className="text-center py-10 opacity-50">No pending products to review.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Shop ID</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingProducts.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.title}</TableCell>
                        <TableCell>₹{p.price}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{p.businessId}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleProductAction(p.id, 'approved')}>
                            <ThumbsUp className="h-4 w-4 mr-1" /> Approve
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleProductAction(p.id, 'rejected')}>
                            <ThumbsDown className="h-4 w-4 mr-1" /> Reject
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

        <TabsContent value="businesses">
          <Card>
            <CardHeader>
              <CardTitle>Business Moderation</CardTitle>
              <CardDescription>Grant premium access or moderate shops.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Shop Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Premium</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {businesses?.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span className="font-bold">{b.shopName}</span>
                          <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">{b.address}</span>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline">{b.category}</Badge></TableCell>
                      <TableCell>
                        {b.isPaid ? (
                          <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Active</Badge>
                        ) : (
                          <Badge variant="secondary"><XCircle className="h-3 w-3 mr-1" /> None</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/business/${b.id}`} target="_blank">
                             <Eye className="h-4 w-4 mr-1" /> Inspect
                          </Link>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className={b.isPaid ? "text-destructive" : "text-green-600"}
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
              <CardTitle>User Directory</CardTitle>
              <CardDescription>Manage user roles and access.</CardDescription>
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
                        <Select 
                          defaultValue={u.role} 
                          onValueChange={(v) => handleUserRoleChange(u.id, v)}
                          disabled={u.id === user?.uid}
                        >
                          <SelectTrigger className="w-32 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="customer">Customer</SelectItem>
                            <SelectItem value="business">Business</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeleteEntry("users", u.id)}
                          disabled={u.id === user?.uid}
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

        <TabsContent value="all-products">
          <Card>
            <CardHeader>
              <CardTitle>Global Listings</CardTitle>
              <CardDescription>Moderate all products across the platform.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Shop Owner ID</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products?.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.title}</TableCell>
                      <TableCell>₹{p.price}</TableCell>
                      <TableCell>
                        <Badge variant={p.status === 'approved' ? 'default' : p.status === 'rejected' ? 'destructive' : 'secondary'}>
                          {p.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[10px] text-muted-foreground">{p.businessId}</TableCell>
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
