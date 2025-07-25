
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth.tsx';
import type { AuthFormValues } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { UserCog, LogIn } from 'lucide-react';
import Link from 'next/link';
import { isFirebaseConfigured } from '@/lib/firebase-client';

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export default function UsersPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<AuthFormValues>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit: SubmitHandler<AuthFormValues> = async (data) => {
    if (!isFirebaseConfigured()) {
        toast({
            variant: 'destructive',
            title: 'Firebase Not Configured',
            description: 'Please configure Firebase in src/lib/firebase-client.ts to create an account.'
        });
        return;
    }
    
    setLoading(true);
    try {
      await signUp(data);
      
      toast({
        title: 'Account Created',
        description: 'Your account has been successfully created. Please log in.',
      });

      router.replace('/login');

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Signup Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog /> Create Admin Account
          </CardTitle>
          <CardDescription>Create a new administrative account for the application.</CardDescription>
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
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
            <p className="text-muted-foreground text-sm">
                Already have an account?{' '}
                <Link href="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
                     Login
                </Link>
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
