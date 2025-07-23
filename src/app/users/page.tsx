
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
import { UserPlus, Terminal } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth.tsx';
import { useRouter } from 'next/navigation';
import { db, isFirebaseConfigured } from '@/lib/firebase-client';
import { ref, set, get, push, serverTimestamp } from 'firebase/database';
import Link from 'next/link';
import { PERMISSIONS } from '@/lib/types';

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
    // This check runs ONLY on the client-side after the component mounts.
    // It will not run until the `db` object is available.
    if (!isFirebaseConfigured() || !db) {
        // If firebase is not configured at all, just show the form.
        // This is mainly for local setup.
        setCheckingSetup(false);
        return;
    }

    const checkSetupStatus = async () => {
        try {
            const setupSnapshot = await get(ref(db, 'app_settings/isSuperAdminRegistered'));
            if (setupSnapshot.exists() && setupSnapshot.val() === true) {
                router.replace('/login');
            } else {
                setCheckingSetup(false);
            }
        } catch (error) {
            console.error("Error checking setup status:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not verify app setup status. Please try again.' });
            // Show form anyway on error
            setCheckingSetup(false);
        }
    };
    
    checkSetupStatus();
  }, [router, toast]);

  const onAddUserSubmit: SubmitHandler<NewUserFormValues> = useCallback(async (data) => {
    setLoading(true);
    if (!db) {
      toast({ variant: 'destructive', title: 'Error', description: 'Database connection is not available.'});
      setLoading(false);
      return;
    }

    try {
      const userCredential = await signUp({ email: data.email, password: data.password });
      const userId = userCredential.user.uid;

      // 1. Create the first institution
      const newInstitutionRef = push(ref(db, 'institutions'));
      const newInstitutionId = newInstitutionRef.key;
      if (!newInstitutionId) throw new Error("Could not create a new institution ID.");
      
      const institutionData = {
        name: data.institutionName,
        ownerId: userId,
        timestamp: serverTimestamp(),
      };
      await set(newInstitutionRef, institutionData);

      // 2. Create the default 'admin' role for this institution
      const adminRoleRef = ref(db, `institutions/${newInstitutionId}/roles/admin`);
      await set(adminRoleRef, {
        name: 'Admin',
        permissions: [...PERMISSIONS],
      });
      
      // 3. Create the mapping that assigns the new user the 'admin' role for the new institution
      const userMappingRef = ref(db, `userMappings/${userId}_${newInstitutionId}`);
      await set(userMappingRef, {
        userId: userId,
        institutionId: newInstitutionId,
        roleId: 'admin'
      });

      // 4. Set the global flag to prevent this page from being used again
      await set(ref(db, 'app_settings/isSuperAdminRegistered'), true);

      toast({ title: 'Super Admin Created!', description: 'Logging you in...' });
      
      // 5. Sign the user in and redirect
      await signIn({ email: data.email, password: data.password });
      router.replace('/');

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to Create Super Admin',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
        setLoading(false);
    }
  }, [signUp, signIn, toast, router]);
  
  if (checkingSetup) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Terminal/> Verifying Setup Status</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center gap-4 text-center">
                    <p>Please wait while we check the application setup...</p>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mt-4"></div>
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
