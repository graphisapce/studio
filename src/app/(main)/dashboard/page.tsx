
"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { collection, query, where, doc } from "firebase/firestore";
import { 
  useFirestore, 
  useCollection, 
  useDoc, 
  useMemoFirebase,
  addDocumentNonBlocking,
  deleteDocumentNonBlocking,
  setDocumentNonBlocking
} from "@/firebase";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  PlusCircle, 
  Loader2, 
  Trash2, 
  Package, 
  Store, 
  MapPin,
  Crown,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  TrendingUp,
  Sparkles,
  QrCode,
  CreditCard,
  Zap,
  Download,
  Instagram,
  Facebook,
  Share2,
  PhoneCall,
  MessageCircle,
  BarChart4,
  Printer,
  History,
  Phone
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BusinessCategory, Business, Product } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { isBusinessPremium } from "@/lib/utils";
import { generateProductDescription } from "@/ai/flows/generate-description-flow";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const categoryList: BusinessCategory[] = [
  'Food', 'Groceries', 'Retail', 'Electronics', 'Repairs', 'Services', 
  'Beauty', 'Health', 'Education', 'Automobile', 'Gifts', 'Home Decor', 
  'Clothing', 'Jewelry', 'Hardware', 'Pharmacy', 'Stationery', 'Others'
];

const indianStates = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", 
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", 
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", 
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", 
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Puducherry"
];

export default function DashboardPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  
  const businessRef = useMemoFirebase(() => user ? doc(firestore, "businesses", user.uid) : null, [firestore, user]);
  const { data: businessData, isLoading: loadingBusiness } = useDoc<Business>(businessRef);

  const productsQuery = useMemoFirebase(() => 
    user ? query(collection(firestore, "products"), where("businessId", "==", user.uid)) : null, 
    [firestore, user]
  );
  const { data: products, isLoading: loadingProducts } = useCollection<Product>(productsQuery);

  const [newProduct, setNewProduct] = useState({ title: "", price: "", description: "", imageUrl: "" });
  const [shopProfile, setShopProfile] = useState({ 
    shopName: "", 
    shopCategory: "" as BusinessCategory | "", 
    shopDescription: "", 
    shopContact: "", 
    shopImageUrl: "", 
    shopLogoUrl: "",
    openingTime: "09:00",
    closingTime: "21:00",
    upiId: "",
    paymentQrUrl: "",
    flashDeal: "",
    instagramUrl: "",
    facebookUrl: ""
  });
  const [addressParts, setAddressParts] = useState({ region: "India", state: "", city: "", street: "", landmark: "", pincode: "" });

  const hasPremium = isBusinessPremium(businessData);

  useEffect(() => {
    if (businessData) {
      setShopProfile({
        shopName: businessData.shopName || "",
        shopCategory: businessData.category || "",
        shopDescription: businessData.description || "",
        shopContact: businessData.contactNumber || "",
        shopImageUrl: businessData.imageUrl || "",
        shopLogoUrl: businessData.logoUrl || "",
        openingTime: businessData.openingTime || "09:00",
        closingTime: businessData.closingTime || "21:00",
        upiId: businessData.upiId || "",
        paymentQrUrl: businessData.paymentQrUrl || "",
        flashDeal: businessData.flashDeal || "",
        instagramUrl: businessData.instagramUrl || "",
        facebookUrl: businessData.facebookUrl || ""
      });

      if (businessData.address) {
        const parts = businessData.address.split(", ").map(p => p.trim());
        if (parts.length >= 5) {
          setAddressParts({
            street: parts[0] || "",
            landmark: parts[1] || "",
            city: parts[2] || "",
            state: parts[3] || "",
            region: "India",
            pincode: businessData.address.split("-").pop()?.trim() || ""
          });
        }
      }
    }
  }, [businessData]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) router.push("/login");
      else if (userProfile && userProfile.role !== "business") router.push("/");
    }
  }, [user, userProfile, authLoading, router]);

  const activities = useMemo(() => {
    if (!businessData) return [];
    const list = [];
    if (businessData.views) list.push({ icon: <Eye className="h-4 w-4" />, text: `${businessData.views} logon ne shop profile dekhi.`, time: 'Hamesha updated' });
    if (businessData.callCount) list.push({ icon: <Phone className="h-4 w-4" />, text: `${businessData.callCount} logon ne call button dabaya.`, time: 'Real-time Lead' });
    if (businessData.whatsappCount) list.push({ icon: <MessageCircle className="h-4 w-4" />, text: `${businessData.whatsappCount} logon ne WhatsApp enquire kiya.`, time: 'Potential Sale' });
    return list;
  }, [businessData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => callback(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAIDescription = async () => {
    if (!newProduct.title) {
      toast({ variant: "destructive", title: "Wait!", description: "Please enter product name first." });
      return;
    }
    setIsGeneratingAI(true);
    try {
      const res = await generateProductDescription({ 
        title: newProduct.title, 
        category: businessData?.category || 'General' 
      });
      setNewProduct(prev => ({ ...prev, description: res.description }));
      toast({ title: "AI Magic Done!", description: "Description generated successfully." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "AI Error", description: err.message });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmittingProduct(true);
    addDocumentNonBlocking(collection(firestore, "products"), {
      businessId: user.uid,
      title: newProduct.title,
      price: parseFloat(newProduct.price),
      description: newProduct.description,
      imageUrl: newProduct.imageUrl || "",
      imageHint: 'product',
      status: 'pending',
      createdAt: new Date().toISOString()
    });
    toast({ title: "Product Submitted", description: "Your item is pending admin approval." });
    setNewProduct({ title: "", price: "", description: "", imageUrl: "" });
    setIsProductDialogOpen(false);
    setIsSubmittingProduct(false);
  };

  const handleUpdateShopProfile = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user) return;
    setIsUpdatingProfile(true);
    const fullAddress = `${addressParts.street}, ${addressParts.landmark}, ${addressParts.city}, ${addressParts.state}, ${addressParts.region} - ${addressParts.pincode}`;
    setDocumentNonBlocking(doc(firestore, "businesses", user.uid), {
      id: user.uid,
      ownerId: user.uid,
      shopName: shopProfile.shopName,
      address: fullAddress,
      category: shopProfile.shopCategory,
      description: shopProfile.shopDescription,
      contactNumber: shopProfile.shopContact,
      whatsappLink: `https://wa.me/${shopProfile.shopContact.replace(/\D/g, '')}`,
      imageUrl: shopProfile.shopImageUrl || "",
      logoUrl: shopProfile.shopLogoUrl || "",
      openingTime: shopProfile.openingTime,
      closingTime: shopProfile.closingTime,
      upiId: shopProfile.upiId,
      paymentQrUrl: shopProfile.paymentQrUrl,
      flashDeal: shopProfile.flashDeal,
      instagramUrl: shopProfile.instagramUrl,
      facebookUrl: shopProfile.facebookUrl,
      isPaid: businessData?.isPaid || false,
      premiumUntil: businessData?.premiumUntil || null,
      premiumStatus: businessData?.premiumStatus || 'none'
    }, { merge: true });
    toast({ title: "Updated", description: "Shop details saved successfully." });
    setIsUpdatingProfile(false);
  };

  const printShopFlyer = () => {
    window.print();
  };

  if (authLoading || loadingBusiness || loadingProducts) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Syncing Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Printable Flyer Template (Hidden from screen) */}
      <div className="hidden print:block p-8 bg-white border-8 border-primary rounded-3xl text-center font-headline">
        <h1 className="text-6xl font-black mb-4 text-primary">LocalVyapar</h1>
        <h2 className="text-4xl font-bold mb-8">Scan & Shop at <span className="underline">{businessData?.shopName}</span></h2>
        <div className="flex justify-center mb-8">
          <Image 
            src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(window.location.origin + '/business/' + user?.uid)}`} 
            alt="Shop QR" 
            width={300} 
            height={300} 
            className="border-4 border-black p-2"
          />
        </div>
        <p className="text-2xl font-bold mb-4">View our Menu, Inventory & Offers directly on your phone!</p>
        <div className="flex justify-center gap-8 items-center mt-12">
          {businessData?.isVerified && <div className="flex items-center gap-2 text-blue-600"><CheckCircle2 className="h-8 w-8" /> <span className="text-xl font-bold">Verified Shop</span></div>}
          <div className="bg-primary text-white px-6 py-2 rounded-full text-xl font-bold">Powered by LocalVyapar</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4 print:hidden">
        <div className="flex items-center gap-4">
           <Avatar className="h-16 w-16 border-2 border-primary">
             <AvatarImage src={businessData?.logoUrl} />
             <AvatarFallback className="bg-primary/10 text-primary"><Store className="h-8 w-8" /></AvatarFallback>
           </Avatar>
           <div>
             <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
               {businessData?.shopName || "My Business"}
             </h1>
             <div className="flex flex-wrap items-center gap-2 mt-1">
               <p className="text-muted-foreground text-sm">Manage your digital storefront</p>
               {hasPremium && (
                 <Badge className="bg-yellow-500 flex gap-1 text-[10px]">
                   <Crown className="h-3 w-3" /> Premium Active
                 </Badge>
               )}
             </div>
           </div>
        </div>

        <div className="flex gap-2">
           <Button variant="outline" className="border-primary text-primary" onClick={printShopFlyer}>
             <Printer className="mr-2 h-4 w-4" /> Print Flyer
           </Button>

           <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-5 w-5" /> Add New Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleAddProduct}>
                <DialogHeader>
                  <DialogTitle>Add New Product</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Item Name</Label>
                    <Input id="title" required value={newProduct.title} onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })} placeholder="e.g. Special Thali" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="price">Price (₹)</Label>
                    <Input id="price" type="number" required value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="desc">Description</Label>
                      <Button type="button" variant="ghost" size="sm" className="h-7 text-[10px] text-primary hover:bg-primary/10" onClick={handleAIDescription} disabled={isGeneratingAI}>
                        {isGeneratingAI ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
                        AI Write
                      </Button>
                    </div>
                    <Textarea id="desc" value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })} placeholder="Tell customers about your item..." />
                  </div>
                  <div className="grid gap-2">
                    <Label>Product Image</Label>
                    <Input type="file" accept="image/*" onChange={(e) => handleFileChange(e, (b) => setNewProduct({ ...newProduct, imageUrl: b }))} />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSubmittingProduct} className="w-full">
                    {isSubmittingProduct ? "Publishing..." : "Submit for Approval"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 print:hidden">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="p-4 pb-2"><CardTitle className="text-xs font-bold flex items-center gap-2"><Eye className="h-3 w-3" /> Profile Views</CardTitle></CardHeader>
          <CardContent className="p-4 pt-0"><p className="text-2xl font-black">{businessData?.views || 0}</p></CardContent>
        </Card>
        <Card className="bg-green-50/50 border-green-200/50">
          <CardHeader className="p-4 pb-2"><CardTitle className="text-xs font-bold flex items-center gap-2"><PhoneCall className="h-3 w-3" /> Phone Leads</CardTitle></CardHeader>
          <CardContent className="p-4 pt-0"><p className="text-2xl font-black">{businessData?.callCount || 0}</p></CardContent>
        </Card>
        <Card className="bg-blue-50/50 border-blue-200/50">
          <CardHeader className="p-4 pb-2"><CardTitle className="text-xs font-bold flex items-center gap-2"><MessageCircle className="h-3 w-3" /> WhatsApp Leads</CardTitle></CardHeader>
          <CardContent className="p-4 pt-0"><p className="text-2xl font-black">{businessData?.whatsappCount || 0}</p></CardContent>
        </Card>
        <Card className="bg-yellow-50/50 border-yellow-200/50">
          <CardHeader className="p-4 pb-2"><CardTitle className="text-xs font-bold flex items-center gap-2"><Zap className="h-3 w-3" /> Active Offer</CardTitle></CardHeader>
          <CardContent className="p-4 pt-0"><p className="text-lg font-bold truncate">{businessData?.flashDeal || "None"}</p></CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 print:hidden">
        <div className="lg:col-span-2 space-y-8">
          <Tabs defaultValue="listings" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="listings">Your Listings</TabsTrigger>
              <TabsTrigger value="growth">Marketing Tools</TabsTrigger>
              <TabsTrigger value="profile">Shop Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="listings">
              <Card>
                <CardHeader><CardTitle>Inventory</CardTitle></CardHeader>
                <CardContent>
                  {!products || products.length === 0 ? (
                    <div className="text-center py-20 border-2 border-dashed rounded-xl">
                      <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <p>No items found. Start by adding your first product.</p>
                    </div>
                  ) : (
                    <div className="grid gap-6 sm:grid-cols-2">
                      {products.map((p) => (
                        <Card key={p.id} className="overflow-hidden group relative">
                          <div className="absolute top-2 left-2 z-10">
                            {p.status === 'approved' ? (
                              <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" /> Approved</Badge>
                            ) : p.status === 'rejected' ? (
                              <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Rejected</Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 border-yellow-200">
                                <Clock className="h-3 w-3 mr-1" /> Pending
                              </Badge>
                            )}
                          </div>
                          <div className="relative aspect-video bg-muted">
                            <Image src={p.imageUrl || `https://picsum.photos/seed/prod-${p.id}/400/300`} alt={p.title} fill className="object-cover" />
                          </div>
                          <CardHeader className="p-4 pb-2">
                            <div className="flex justify-between font-bold">
                              <span>{p.title}</span>
                              <span className="text-primary">₹{p.price}</span>
                            </div>
                          </CardHeader>
                          <CardFooter className="p-4 pt-0">
                            <Button variant="destructive" size="sm" className="w-full" onClick={() => deleteDocumentNonBlocking(doc(firestore, "products", p.id))}>
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="growth">
               <div className="grid sm:grid-cols-2 gap-6">
                  <Card className="border-primary/20 bg-primary/5">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm"><Zap className="h-4 w-4 text-yellow-500" /> Flash Deal</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Input placeholder="e.g. 20% Discount today!" value={shopProfile.flashDeal} onChange={(e) => setShopProfile({...shopProfile, flashDeal: e.target.value})} />
                      <Button className="w-full" size="sm" onClick={() => handleUpdateShopProfile()}>Update Live Offer</Button>
                    </CardContent>
                  </Card>

                  <Card className="border-blue-200 bg-blue-50/30">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm"><CreditCard className="h-4 w-4 text-blue-500" /> UPI Pay</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Input placeholder="name@okaxis" value={shopProfile.upiId} onChange={(e) => setShopProfile({...shopProfile, upiId: e.target.value})} />
                      {hasPremium ? <Button className="w-full bg-blue-600" size="sm" onClick={() => handleUpdateShopProfile()}>Save UPI</Button> : <Badge variant="secondary" className="w-full text-center">Premium Only</Badge>}
                    </CardContent>
                  </Card>

                  <Card className="sm:col-span-2 border-purple-200 bg-purple-50/30">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm"><Share2 className="h-4 w-4 text-purple-600" /> Social Links</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                      <Input placeholder="Instagram Link" value={shopProfile.instagramUrl} onChange={(e) => setShopProfile({...shopProfile, instagramUrl: e.target.value})} />
                      <Input placeholder="Facebook Link" value={shopProfile.facebookUrl} onChange={(e) => setShopProfile({...shopProfile, facebookUrl: e.target.value})} />
                      <Button className="col-span-2 w-full bg-purple-600" size="sm" onClick={() => handleUpdateShopProfile()}>Save Socials</Button>
                    </CardContent>
                  </Card>
               </div>
            </TabsContent>

            <TabsContent value="profile">
              <Card>
                <CardHeader><CardTitle>Shop Profile</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateShopProfile} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Shop Name</Label><Input value={shopProfile.shopName} onChange={(e) => setShopProfile({...shopProfile, shopName: e.target.value})} /></div>
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select value={shopProfile.shopCategory} onValueChange={(v: BusinessCategory) => setShopProfile({...shopProfile, shopCategory: v})}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{categoryList.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Contact</Label><Input value={shopProfile.shopContact} onChange={(e) => setShopProfile({...shopProfile, shopContact: e.target.value})} /></div>
                      <div className="space-y-2"><Label>Pincode</Label><Input value={addressParts.pincode} onChange={(e) => setAddressParts({...addressParts, pincode: e.target.value})} /></div>
                    </div>
                    <Textarea placeholder="Shop Description..." value={shopProfile.shopDescription} onChange={(e) => setShopProfile({...shopProfile, shopDescription: e.target.value})} />
                    <Button type="submit" className="w-full" disabled={isUpdatingProfile}>{isUpdatingProfile ? "Saving..." : "Save Shop Settings"}</Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-8">
           <Card className="border-primary/20">
             <CardHeader className="pb-2">
               <CardTitle className="text-sm font-bold flex items-center gap-2"><History className="h-4 w-4 text-primary" /> Recent Activity</CardTitle>
               <CardDescription className="text-[10px]">Real-time customer interactions</CardDescription>
             </CardHeader>
             <CardContent>
               <div className="space-y-4">
                 {activities.length > 0 ? activities.map((act, i) => (
                   <div key={i} className="flex items-start gap-3 p-2 rounded-lg bg-muted/50 border border-border/50">
                     <div className="p-2 bg-white rounded-full text-primary shadow-sm">{act.icon}</div>
                     <div>
                       <p className="text-xs font-medium leading-tight">{act.text}</p>
                       <p className="text-[10px] text-muted-foreground mt-1">{act.time}</p>
                     </div>
                   </div>
                 )) : (
                   <div className="text-center py-10 opacity-50">Abhi tak koi activity nahi hui.</div>
                 )}
               </div>
             </CardContent>
           </Card>

           <Card className="bg-gradient-to-br from-primary to-blue-600 text-white border-none">
             <CardHeader>
               <CardTitle className="text-sm font-bold flex items-center gap-2"><QrCode className="h-4 w-4" /> Marketing Kit</CardTitle>
               <CardDescription className="text-white/70 text-[10px]">Apni dukan ko promote karein!</CardDescription>
             </CardHeader>
             <CardContent className="space-y-4">
               <div className="p-4 bg-white rounded-xl shadow-lg flex justify-center">
                 <Image 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.origin + '/business/' + user?.uid)}`} 
                    alt="Shop QR" 
                    width={150} 
                    height={150} 
                 />
               </div>
               <Button className="w-full bg-white text-primary hover:bg-white/90 font-bold" onClick={printShopFlyer}>
                 <Printer className="mr-2 h-4 w-4" /> Print Shop Flyer
               </Button>
               <p className="text-[10px] text-center opacity-80 italic">Tip: Ise print karke shop ke bahar lagayein!</p>
             </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}
