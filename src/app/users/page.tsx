
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ref, get, set } from 'firebase/database';
import { db, isFirebaseConfigured } from '@/lib/firebase-client';
import { useAuth } from '@/hooks/use-auth.tsx';
import type { AuthFormValues } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { UserCog, Terminal, LogIn } from 'lucide-react';
import Link from 'next/link';

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

type SetupStatus = 'checking' | 'needs-setup' | 'setup-complete';

export default function UsersPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const { toast } = useToast();
  
  const [setupStatus, setSetupStatus] = useState<SetupStatus>('checking');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
        setSetupStatus('needs-setup');
        return;
    }

    const checkSetup = async () => {
      // This is the key fix: We must wait for `db` to be initialized.
      if (!db) {
          // Retry after a short delay if db is not ready yet.
          setTimeout(checkSetup, 100);
          return;
      }

      try {
        const settingRef = ref(db, 'app_settings/isSuperAdminRegistered');
        const snapshot = await get(settingRef);
        if (snapshot.exists() && snapshot.val() === true) {
          setSetupStatus('setup-complete');
        } else {
          setSetupStatus('needs-setup');
        }
      } catch (error) {
        console.error("Failed to check super admin status:", error);
        toast({
          variant: "destructive",
          title: "Configuration Check Failed",
          description: "Could not verify application setup. Please check your connection or Firebase configuration.",
        });
        setSetupStatus('needs-setup'); // Default to allowing setup if check fails
      }
    };

    checkSetup();
  }, [toast]);

  const { register, handleSubmit, formState: { errors } } = useForm<AuthFormValues>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit: SubmitHandler<AuthFormValues> = async (data) => {
    setLoading(true);
    try {
      // Step 1: Create the user
      await signUp(data);
      
      // Step 2: Set the flag in the database to prevent re-setup
      const settingRef = ref(db, 'app_settings/isSuperAdminRegistered');
      await set(settingRef, true);

      toast({
        title: 'Super Admin Created',
        description: 'Your administrative account has been set up. Please log in.',
      });

      router.push('/login');

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Setup Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (setupStatus === 'checking') {
    return (
       <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Terminal/> Verifying Setup Status...</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center gap-4 text-center">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                 <p className="text-muted-foreground">Please wait while we check your application's configuration.</p>
            </CardContent>
        </Card>
      </div>
    );
  }

  if (setupStatus === 'setup-complete') {
    return (
       <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><UserCog/> Setup Complete</CardTitle>
            </CardHeader>
            <CardContent>
                 <p className="text-center text-muted-foreground">The Super Admin account for this application has already been created.</p>
            </CardContent>
            <CardFooter>
                <Button asChild className="w-full">
                    <Link href="/login"><LogIn className="mr-2"/> Go to Login</Link>
                </Button>
            </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog /> Super Admin Setup
          </CardTitle>
          <CardDescription>Create the first administrative account for the application.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Admin Email</Label>
              <Input id="email" type="email" {...register('email')} placeholder="admin@example.com" />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Admin Password</Label>
              <Input id="password" type="password" {...register('password')} />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Super Admin'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex-col items-start text-sm">
            <p className="text-muted-foreground">
                Already have an account?{' '}
                <Link href="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
                     Login instead
                </Link>
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
