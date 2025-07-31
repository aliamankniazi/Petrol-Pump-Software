
'use client';

import { useState, useTransition } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth.tsx';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Fuel, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters long.'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login, signUp } = useAuth();
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit: SubmitHandler<LoginFormValues> = (data) => {
    setError(null);
    startTransition(async () => {
      try {
        const authAction = isSignUp ? signUp : login;
        const userCredential = await authAction(data.email, data.password);
        if (userCredential?.user) {
          router.push('/dashboard');
        }
      } catch (err: any) {
        let message = 'An unknown error occurred.';
        if (err.code) {
          switch (err.code) {
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
              message = 'Invalid email or password. Please try again.';
              break;
            case 'auth/email-already-in-use':
              message = 'An account with this email address already exists.';
              break;
            case 'auth/weak-password':
              message = 'Password is too weak. It must be at least 6 characters long.';
              break;
            case 'auth/invalid-email':
              message = 'Please enter a valid email address.';
              break;
            default:
              message = err.message || 'Login failed. Please check your credentials.';
          }
        }
        setError(message);
      }
    });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <div className="flex justify-center items-center gap-2 mb-4">
               <Fuel className="w-8 h-8 text-primary" />
               <CardTitle>Petrol Pump Manager</CardTitle>
            </div>
          <CardDescription>
            {isSignUp ? 'Create an account to get started.' : 'Sign in to your account.'}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {error && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>{isSignUp ? 'Sign Up Failed' : 'Sign In Failed'}</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                {...register('email')}
                disabled={isPending}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                {...register('password')}
                disabled={isPending}
              />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </Button>
            <Button
              type="button"
              variant="link"
              className="text-sm"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              disabled={isPending}
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
