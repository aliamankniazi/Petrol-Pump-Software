
'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { UserCog, UserPlus } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth.tsx';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase-client';
import { ref, set, get } from 'firebase/database';
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
  const [isSetupAllowed, setIsSetupAllowed] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);

  useEffect(() => {
    if (user) {
        router.replace('/dashboard');
        return;
    }

    const checkSetupStatus = async () => {
        if (!db) {
            setIsSetupAllowed(true);
            setCheckingSetup(false);
            return;
        }
        const setupRef = ref(db, 'app_settings/isSuperAdminRegistered');
        try {
            const snapshot = await get(setupRef);
            if (snapshot.exists() && snapshot.val() === true) {
                // Setup is complete, redirect to login
                router.replace('/login');
            } else {
                // Setup is not complete, allow rendering the form
                setIsSetupAllowed(true);
            }
        } catch (error) {
            console.error("Error checking app setup:", error);
            toast({ variant: 'destructive', title: 'Error', description: "Could not verify app setup status." });
            router.replace('/login');
        } finally {
            setCheckingSetup(false);
        }
    };
    checkSetupStatus();
  }, [user, router, toast]);

  const { register, handleSubmit, formState: { errors } } = useForm<NewUserFormValues>({
    resolver: zodResolver(newUserSchema),
  });

  const onAddUserSubmit: SubmitHandler<NewUserFormValues> = useCallback(async (data) => {
    setLoading(true);
    
    // This is a simplified version of adding the institution and user.
    // In a real app, this would involve creating the institution, then the user, then assigning roles.
    try {
        const userCredential = await signUp({ email: data.email, password: data.password });
        
        // Create the first institution
        const institutionsRef = ref(db, 'institutions');
        const newInstitutionRef = push(institutionsRef);
        await set(newInstitutionRef, {
            name: data.institutionName,
            ownerId: userCredential.user.uid,
            timestamp: serverTimestamp(),
        });
        
        // Mark setup as complete
        await set(ref(db, 'app_settings/isSuperAdminRegistered'), true);

        toast({ title: 'Super Admin Created!', description: 'Logging you in...' });
        
        // Sign in the new user to start their session
        await signIn({email: data.email, password: data.password});
        router.push('/dashboard'); // Manually redirect after successful sign-in

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
             <div className="flex items-center gap-2 text-muted-foreground">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                Verifying setup status...
             </div>
         </div>
      );
  }
  
  if (!isSetupAllowed) {
    // This state should ideally not be seen as the user is redirected.
    // It's a fallback.
    return (
       <div className="flex min-h-screen items-center justify-center bg-background p-4">
           <p>Redirecting...</p>
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
                    Create the first Super Admin account and your primary institution.
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
            </Card>
        </div>
    </div>
  );
}
