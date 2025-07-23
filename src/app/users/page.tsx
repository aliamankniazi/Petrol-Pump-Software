
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
import { db } from '@/lib/firebase-client';
import { ref, set, get, push, serverTimestamp } from 'firebase/database';
import Link from 'next/link';

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
  const [isReadyForSetup, setIsReadyForSetup] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || user) {
        if (user) router.replace('/dashboard');
        return;
    }

    const checkSetupStatus = async () => {
        if (!db) {
            console.error("Firebase DB not initialized.");
            setIsReadyForSetup(false);
            return;
        }

        const setupRef = ref(db, 'app_settings/isSuperAdminRegistered');
        try {
            const snapshot = await get(setupRef);
            if (snapshot.exists() && snapshot.val() === true) {
                toast({ title: "Setup Already Complete", description: "Redirecting to login." });
                router.replace('/login');
            } else {
                setIsReadyForSetup(true);
            }
        } catch (error) {
            console.error("Error checking app setup:", error);
            toast({ variant: 'destructive', title: 'Error', description: "Could not verify app setup status." });
            router.replace('/login');
        }
    };
    
    checkSetupStatus();
  }, [isClient, user, router, toast]);

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

      const newInstitutionRef = push(ref(db, 'institutions'));
      const newInstitutionId = newInstitutionRef.key;

      if (!newInstitutionId) {
        throw new Error("Could not create a new institution.");
      }
      
      await set(newInstitutionRef, {
        name: data.institutionName,
        ownerId: userCredential.user.uid,
        timestamp: serverTimestamp(),
      });
      
      await set(ref(db, 'app_settings/isSuperAdminRegistered'), true);

      toast({ title: 'Super Admin Created!', description: 'Logging you in...' });
      
      await signIn({ email: data.email, password: data.password });
      router.push('/dashboard');

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

  if (!isReadyForSetup) {
    return (
       <div className="flex min-h-screen items-center justify-center bg-background p-4">
           <div className="flex items-center gap-2 text-muted-foreground">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              Verifying setup status...
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
                {loading ? 'Creating...' : 'Create Super Admin & Login'}
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
