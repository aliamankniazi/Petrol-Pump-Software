
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { UserPlus } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth.tsx';
import { useRouter } from 'next/navigation';
import { db, isFirebaseConfigured } from '@/lib/firebase-client';
import { ref, get, push, serverTimestamp, update } from 'firebase/database';
import Link from 'next/link';
import { PERMISSIONS } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

const newUserSchema = z.object({
  email: z.string().email('A valid email is required.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  institutionName: z.string().min(1, 'Institution name is required'),
});

type NewUserFormValues = z.infer<typeof newUserSchema>;

export default function UsersPage() {
  const { signUp, signIn } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);
  
  const { register, handleSubmit, formState: { errors } } = useForm<NewUserFormValues>({
    resolver: zodResolver(newUserSchema),
  });
  
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkSetup = async () => {
      // The db object can be null on initial load. We must wait for it.
      if (!isFirebaseConfigured() || !db) {
         setTimeout(checkSetup, 100); // Retry after a short delay
         return;
      }
      
      try {
        const setupSnapshot = await get(ref(db, 'app_settings/isSuperAdminRegistered'));
        if (setupSnapshot.exists() && setupSnapshot.val() === true) {
          router.replace('/login');
        } else {
           setCheckingSetup(false);
        }
      } catch (error: any) {
        toast({ 
            variant: 'destructive', 
            title: 'Setup Check Failed', 
            description: 'Could not verify app setup status. Please check your Firebase rules and connection.' 
        });
        setCheckingSetup(false); // Ensure we stop loading even on error
      }
    };
    
    checkSetup();
  }, [router, toast]);


  const onAddUserSubmit: SubmitHandler<NewUserFormValues> = useCallback(async (data) => {
    setLoading(true);
    if (!db) {
      toast({ variant: 'destructive', title: 'Error', description: 'Database connection is not available.'});
      setLoading(false);
      return;
    }

    try {
      // 1. Create the user account
      const userCredential = await signUp({ email: data.email, password: data.password });
      const userId = userCredential.user.uid;

      // 2. Prepare all database writes
      const newInstitutionRef = push(ref(db, 'institutions'));
      const newInstitutionId = newInstitutionRef.key;
      if (!newInstitutionId) throw new Error("Could not create a new institution ID.");
      
      const updates: { [key: string]: any } = {};
      
      // Path for the new institution
      updates[`/institutions/${newInstitutionId}/name`] = data.institutionName;
      updates[`/institutions/${newInstitutionId}/ownerId`] = userId;
      updates[`/institutions/${newInstitutionId}/timestamp`] = serverTimestamp();
      
      // Path for the default Admin role within the new institution
      updates[`/institutions/${newInstitutionId}/roles/admin`] = {
        name: 'Admin',
        permissions: [...PERMISSIONS],
      };
      
      // Path for the user-to-institution mapping
      updates[`/userMappings/${userId}_${newInstitutionId}`] = {
        userId: userId,
        institutionId: newInstitutionId,
        roleId: 'admin'
      };
      
      // Path for the global setup flag
      updates['/app_settings/isSuperAdminRegistered'] = true;
      
      // 3. Execute all writes in a single atomic operation
      await update(ref(db), updates);

      toast({ title: 'Super Admin Created!', description: 'Logging you in...' });
      
      // Set the newly created institution as the current one
      localStorage.setItem('currentInstitutionId', newInstitutionId);
      
      await signIn({ email: data.email, password: data.password });
      router.replace('/');

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to Create Super Admin',
        description: error.message || 'An unexpected error occurred. Please check the console for details.',
      });
      console.error("Super Admin Creation Error:", error);
    } finally {
        setLoading(false);
    }
  }, [signUp, signIn, toast, router]);

  if (checkingSetup) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserPlus /> Create Super Admin
                    </CardTitle>
                    <CardDescription>
                       Verifying setup status...
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </CardContent>
            </Card>
        </div>
      )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus /> Create Super Admin
            </CardTitle>
            <CardDescription>
              Create the first Super Admin account and your primary institution. This is a one-time setup.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onAddUserSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="institutionName">Institution Name</Label>
                <Input id="institutionName" {...register('institutionName')} placeholder="e.g., Mianwali Petroleum" />
                {errors.institutionName && <p className="text-sm text-destructive">{errors.institutionName.message}</p>}
              </div>
            
              <div className="space-y-2">
                <Label htmlFor="email">Admin Email</Label>
                <Input id="email" type="email" {...register('email')} placeholder="admin@example.com" />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Admin Password</Label>
                <Input id="password" type="password" {...register('password')} placeholder="••••••••" />
                {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Registering...' : 'Create Super Admin & Login'}
              </Button>
            </form>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link href="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
                     Login here
                </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
