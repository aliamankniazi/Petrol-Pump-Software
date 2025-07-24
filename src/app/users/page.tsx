
'use client';

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
import type { AuthFormValues } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ref, get, set } from 'firebase/database';
import { db } from '@/lib/firebase-client';
import Link from 'next/link';

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

const SetupStatus = {
  Verifying: 'Verifying',
  SuperAdminExists: 'SuperAdminExists',
  NoSuperAdmin: 'NoSuperAdmin',
  Error: 'Error',
};

export default function UsersPage() {
  const { signUp } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [setupStatus, setSetupStatus] = useState(SetupStatus.Verifying);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout | null = null;

    const checkSetup = async () => {
      // The db object can be null on initial load. We must wait for it.
      if (!db) {
        // If db is not ready, set a timeout to check again.
        timeoutId = setTimeout(checkSetup, 250);
        return;
      }

      try {
        const superAdminFlagRef = ref(db, 'app_settings/isSuperAdminRegistered');
        const snapshot = await get(superAdminFlagRef);
        if (!isMounted) return;

        if (snapshot.exists()) {
          setSetupStatus(SetupStatus.SuperAdminExists);
          toast({
            title: 'Setup Complete',
            description: 'A Super Admin already exists. Redirecting to login.',
          });
          router.replace('/login');
        } else {
          setSetupStatus(SetupStatus.NoSuperAdmin);
        }
      } catch (error: any) {
        if (!isMounted) return;
        console.error("Setup check failed:", error);
        setSetupStatus(SetupStatus.Error);
        toast({
          variant: 'destructive',
          title: 'Setup Error',
          description: `Could not verify application setup: ${error.message}`,
        });
      }
    };

    checkSetup();

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [router, toast]);

  const { register, handleSubmit, formState: { errors } } = useForm<AuthFormValues>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit: SubmitHandler<AuthFormValues> = async (data) => {
    setLoading(true);
    try {
      const userCredential = await signUp(data);
      if (db && userCredential.user) {
        const superAdminFlagRef = ref(db, 'app_settings/isSuperAdminRegistered');
        await set(superAdminFlagRef, true);
        
        toast({
          title: 'Super Admin Created',
          description: 'You can now log in and set up your first institution.',
        });
        
        router.push('/login');
      } else {
        throw new Error("Could not finalize setup. DB connection might be missing.");
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Sign Up Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (setupStatus === SetupStatus.Verifying) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Terminal/> Verifying Setup Status</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center gap-4 text-center">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
             <p className="text-muted-foreground">Please wait while we check your application's configuration.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <UserPlus /> Create Super Admin
          </CardTitle>
          <CardDescription>
            This will be the primary administrative account for the entire application.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register('email')} placeholder="admin@example.com" />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...register('password')} />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Super Admin Account'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex-col items-start text-sm">
            <p className="text-muted-foreground">
                Already have an account?{' '}
                <Link href="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
                     Log In
                </Link>
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
