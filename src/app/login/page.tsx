
'use client';

import { useState } from 'react';
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

const authSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters long.'),
});

type AuthFormValues = z.infer<typeof authSchema>;

export default function LoginPage() {
  const { login, signUp } = useAuth();
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register: registerLogin,
    handleSubmit: handleSubmitLogin,
    formState: { errors: loginErrors },
  } = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
  });

  const {
    register: registerSignUp,
    handleSubmit: handleSubmitSignUp,
    formState: { errors: signUpErrors },
  } = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
  });

  const handleLogin: SubmitHandler<AuthFormValues> = async (data) => {
    setError(null);
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      router.push('/dashboard');
    } catch (err: any) {
      handleAuthError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp: SubmitHandler<AuthFormValues> = async (data) => {
    setError(null);
    setIsLoading(true);
    try {
      await signUp(data.email, data.password);
      router.push('/dashboard');
    } catch (err: any) {
      handleAuthError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthError = (err: any) => {
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
          message = 'The password is too weak. It must be at least 6 characters long.';
          break;
        case 'auth/invalid-email':
          message = 'Please enter a valid email address.';
          break;
        default:
          message = err.message || 'An unexpected error occurred. Please try again.';
      }
    }
    setError(message);
  };


  return (
    <main className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <div className="flex justify-center items-center gap-2 mb-4">
               <Fuel className="w-8 h-8 text-primary" />
               <CardTitle>PumpPal</CardTitle>
            </div>
          <CardDescription>
            {isSignUp ? 'Create an account to get started.' : 'Sign in to your account.'}
          </CardDescription>
        </CardHeader>

        {error && (
            <div className="px-6 pb-4">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>{isSignUp ? 'Sign Up Failed' : 'Sign In Failed'}</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
        )}
        
        <form onSubmit={handleSubmitLogin(handleLogin)} hidden={isSignUp}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="m@example.com"
                {...registerLogin('email')}
                disabled={isLoading}
              />
              {loginErrors.email && <p className="text-sm text-destructive">{loginErrors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">Password</Label>
              <Input
                id="login-password"
                type="password"
                {...registerLogin('password')}
                disabled={isLoading}
              />
              {loginErrors.password && <p className="text-sm text-destructive">{loginErrors.password.message}</p>}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </CardFooter>
        </form>

        <form onSubmit={handleSubmitSignUp(handleSignUp)} hidden={!isSignUp}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signup-email">Email</Label>
              <Input
                id="signup-email"
                type="email"
                placeholder="m@example.com"
                {...registerSignUp('email')}
                disabled={isLoading}
              />
              {signUpErrors.email && <p className="text-sm text-destructive">{signUpErrors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-password">Password</Label>
              <Input
                id="signup-password"
                type="password"
                {...registerSignUp('password')}
                disabled={isLoading}
              />
              {signUpErrors.password && <p className="text-sm text-destructive">{signUpErrors.password.message}</p>}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign Up
            </Button>
          </CardFooter>
        </form>
        
        <div className="p-6 pt-0 text-center">
            <Button
              type="button"
              variant="link"
              className="text-sm"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              disabled={isLoading}
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </Button>
        </div>
      </Card>
    </main>
  );
}
