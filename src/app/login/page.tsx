
'use client';

import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { LogIn, UserPlus, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth.tsx';
import type { AuthFormValues } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ref, get } from 'firebase/database';
import { db } from '@/lib/firebase-client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export default function LoginPage() {
  const { signIn, user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isCheckingSetup, setIsCheckingSetup] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    if (user) {
      router.replace('/dashboard');
    }
  }, [user, router]);
  
  useEffect(() => {
    const checkSetup = async () => {
        if (!db) {
            console.error("Database not initialized, cannot check setup.");
            setIsCheckingSetup(false);
            return;
        }
        try {
            const setupRef = ref(db, 'app_settings/isSuperAdminRegistered');
            const snapshot = await get(setupRef);
            if (snapshot.exists() && snapshot.val() === true) {
                setNeedsSetup(false);
            } else {
                setNeedsSetup(true);
            }
        } catch (error) {
            console.error("Setup check failed:", error);
            // Default to login form if there's an error
            setNeedsSetup(false);
        } finally {
            setIsCheckingSetup(false);
        }
    };
    checkSetup();
  }, []);

  const { register, handleSubmit, formState: { errors } } = useForm<AuthFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit: SubmitHandler<AuthFormValues> = async (data) => {
    setLoading(true);
    try {
      await signIn(data);
      toast({
        title: 'Login Successful',
        description: 'Welcome back!',
      });
      // The useEffect will handle redirection
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error.message || 'An unexpected error occurred.',
      });
      setLoading(false);
    }
  };

  if (isCheckingSetup) {
      return (
          <div className="flex min-h-screen items-center justify-center bg-background p-4">
               <div className="flex justify-center items-center gap-2">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                 <p className="text-center">Checking application setup...</p>
               </div>
          </div>
      );
  }
  
  if (needsSetup) {
      return (
           <div className="flex min-h-screen items-center justify-center bg-background p-4">
              <Card className="w-full max-w-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <UserPlus /> Initial Setup Required
                  </CardTitle>
                  <CardDescription>Welcome! The application needs to be set up by creating the first Super Admin account.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Action Required</AlertTitle>
                      <AlertDescription>
                        No Super Admin account has been registered yet. Please proceed to create one to start using the application.
                      </AlertDescription>
                    </Alert>
                    <Button asChild className="w-full mt-6">
                        <Link href="/users">Create Super Admin</Link>
                    </Button>
                </CardContent>
              </Card>
           </div>
      )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <LogIn /> Login
          </CardTitle>
          <CardDescription>Enter your credentials to access your account.</CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register('email')} placeholder="you@example.com" />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                </div>

                <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" {...register('password')} />
                {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Logging in...' : 'Login'}
                </Button>
            </form>
        </CardContent>
      </Card>
    </div>
  );
}
