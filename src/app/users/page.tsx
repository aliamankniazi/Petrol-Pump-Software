
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
import { UserPlus, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth.tsx';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase-client';
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
  const { signUp, signIn, user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);
  const [setupComplete, setSetupComplete] = useState(false);

  useEffect(() => {
    // This check runs only on the client side to avoid SSR/hydration issues.
    async function checkSetupStatus() {
      if (!db) {
        setCheckingSetup(false);
        return;
      }
      try {
        const setupRef = ref(db, 'app_settings/isSuperAdminRegistered');
        const snapshot = await get(setupRef);
        if (snapshot.exists() && snapshot.val() === true) {
          setSetupComplete(true);
          router.replace('/login');
        }
      } catch (error) {
        console.error("Error checking setup status:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not verify application setup.' });
      } finally {
        setCheckingSetup(false);
      }
    }
    checkSetupStatus();
  }, [router, toast]);

  const { register, handleSubmit, formState: { errors } } = useForm<NewUserFormValues>({
    resolver: zodResolver(newUserSchema),
  });

  const onAddUserSubmit: SubmitHandler<NewUserFormValues> = useCallback(async (data) => {
    setLoading(true);
    if (!db) {
      toast({ variant: 'destructive', title: 'Error', description: 'Database connection is not available.'});
      setLoading(false);
      return;
    }

    try {
      const userCredential = await signUp({ email: data.email, password: data.password });

      if (!userCredential || !userCredential.user) {
        throw new Error("User creation failed.");
      }

      const newInstitutionRef = push(ref(db, 'institutions'));
      const newInstitutionId = newInstitutionRef.key;

      if (!newInstitutionId) {
        throw new Error("Could not create a new institution.");
      }
      
      const institutionData = {
        name: data.institutionName,
        ownerId: userCredential.user.uid,
        timestamp: serverTimestamp(),
      };
      
      // Set the institution data
      await set(newInstitutionRef, institutionData);

      // Create the default 'admin' role for this new institution
      const adminRoleRef = ref(db, `institutions/${newInstitutionId}/roles/admin`);
      await set(adminRoleRef, {
        name: 'Admin',
        permissions: [...PERMISSIONS],
      });

      // Set the flag to prevent future registrations
      await set(ref(db, 'app_settings/isSuperAdminRegistered'), true);

      toast({ title: 'Super Admin Created!', description: 'Logging you in...' });
      
      // Log the new user in and redirect
      await signIn({ email: data.email, password: data.password });
      router.replace('/dashboard');

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to Create Super Admin',
        description: error.message || 'An unexpected error occurred.',
      });
      setLoading(false);
    }
  }, [signUp, signIn, toast, router]);

  if (checkingSetup || setupComplete) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Verifying setup status...</p>
        </div>
      </div>
    );
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
