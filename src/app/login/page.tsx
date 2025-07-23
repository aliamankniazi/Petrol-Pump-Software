
'use client';

import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { LogIn } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth.tsx';
import { useState, useEffect } from 'react';
import type { AuthFormValues } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase-client';
import { ref, get } from 'firebase/database';


const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const LoadingSpinner = () => (
    <div className="flex justify-center items-center gap-2">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-center">Checking setup...</p>
    </div>
);

export default function LoginPage() {
  const { signIn, user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isSetupCheckComplete, setIsSetupCheckComplete] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return; // Wait until auth state is known

    if(user) {
        router.replace('/dashboard');
        return;
    }
    
    const checkSetup = async () => {
      if (!db) {
        console.error("Firebase DB not initialized.");
        setIsSetupCheckComplete(true); // Allow showing the form on error
        return;
      }
      const setupRef = ref(db, 'app_settings/isSuperAdminRegistered');
      const snapshot = await get(setupRef);
      if (!snapshot.exists() || snapshot.val() === false) {
        router.replace('/users'); // Redirect to Super Admin creation
      } else {
        setIsSetupCheckComplete(true); // Setup is complete, show login form
      }
    };

    checkSetup();
  }, [authLoading, user, router]);
  
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
      // The layout effect will handle redirection to dashboard
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
        setLoading(false);
    }
  };

  if (!isSetupCheckComplete || authLoading) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                        <LogIn /> Initializing
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <LoadingSpinner />
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
