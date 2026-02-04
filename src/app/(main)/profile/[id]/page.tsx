
"use client";

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc } from "firebase/firestore";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { 
  Loader2, 
  ArrowLeft,
  Mail,
  Phone,
  User as UserIcon,
  ShieldCheck,
  Calendar,
  Store
} from 'lucide-react';
import type { UserProfile } from "@/lib/types";
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';

export default function UserProfilePage() {
  const params = useParams();
  const id = params.id as string;
  const firestore = useFirestore();
  const { userProfile: currentUser } = useAuth();
  const router = useRouter();

  const profileRef = useMemoFirebase(() => id ? doc(firestore, "users", id) : null, [firestore, id]);
  const { data: profile, isLoading } = useDoc<UserProfile>(profileRef);

  const isStaff = useMemo(() => {
    return currentUser && ['admin', 'moderator'].includes(currentUser.role);
  }, [currentUser]);

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) return (
    <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
      <p className="text-xl font-bold">User profile not found.</p>
      <Button variant="outline" onClick={() => router.back()}>Go Back</Button>
    </div>
  );

  return (
    <div className="container mx-auto max-w-4xl py-12 px-4">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-primary" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        {isStaff && (
          <Button asChild variant="outline" size="sm" className="gap-2 border-primary/20 text-primary">
            <Link href="/admin">
              Admin Panel
            </Link>
          </Button>
        )}
      </div>

      <Card className="overflow-hidden border-none shadow-xl bg-gradient-to-br from-white to-secondary/30">
        <CardHeader className="text-center pb-8 border-b">
          <div className="flex justify-center mb-4">
            <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
              <AvatarImage src={profile.photoURL} className="object-cover" />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-black">
                {profile.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </div>
          <CardTitle className="text-3xl font-black font-headline mb-2">{profile.name}</CardTitle>
          <div className="flex justify-center gap-2">
            <Badge variant={profile.role === 'admin' ? 'destructive' : profile.role === 'moderator' ? 'default' : profile.role === 'business' ? 'secondary' : 'outline'} className="uppercase px-4 font-black">
              {profile.role}
            </Badge>
            {profile.role === 'business' && <Badge className="bg-yellow-500 uppercase px-4 font-black">Business Owner</Badge>}
          </div>
        </CardHeader>
        <CardContent className="pt-8 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase text-muted-foreground tracking-widest">About User</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-white rounded-xl border shadow-sm">
                  <UserIcon className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-[10px] text-muted-foreground font-bold">FULL NAME</p>
                    <p className="text-sm font-medium">{profile.name}</p>
                  </div>
                </div>
                {isStaff && (
                  <div className="flex items-center gap-3 p-3 bg-white rounded-xl border shadow-sm">
                    <Mail className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-[10px] text-muted-foreground font-bold">EMAIL (Staff Only)</p>
                      <p className="text-sm font-medium">{profile.email}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase text-muted-foreground tracking-widest">Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-white rounded-xl border shadow-sm">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-[10px] text-muted-foreground font-bold">MEMBER SINCE</p>
                    <p className="text-sm font-medium">{profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Unknown'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white rounded-xl border shadow-sm">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-[10px] text-muted-foreground font-bold">STATUS</p>
                    <p className="text-sm font-medium uppercase tracking-tighter">Verified User</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {profile.role === 'business' && (
            <div className="pt-6 border-t">
              <Button asChild className="w-full h-12 rounded-xl shadow-lg gap-2">
                <Link href={`/business/${profile.id}`}>
                  <Store className="h-5 w-5" /> View Business Shop Profile
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
