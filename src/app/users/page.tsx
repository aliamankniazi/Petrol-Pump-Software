
'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { UserCog, UserPlus, List, Building } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth.tsx';
import { useRoles } from '@/hooks/use-roles.tsx';
import type { RoleId } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { db } from '@/lib/firebase-client';
import { ref, set, get } from 'firebase/database';
import { useRouter } from 'next/navigation';

const newUserSchema = z.object({
  email: z.string().email('A valid email is required.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  roleId: z.string().min(1, 'Please select a role for the user.'),
  institutionName: z.string().optional(),
});

type NewUserFormValues = z.infer<typeof newUserSchema>;

export default function UserManagementPage() {
  const { signUp, user, loading: authLoading } = useAuth();
  const { roles, assignRoleToUser, userMappings, isReady, currentInstitution, addInstitution, userInstitutions } = useRoles();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isFirstUserSetup, setIsFirstUserSetup] = useState(false);
  const [isCheckingSetup, setIsCheckingSetup] = useState(true);
  const router = useRouter();
  
  const { register, handleSubmit, reset, control, setValue, watch, formState: { errors } } = useForm<NewUserFormValues>({
    resolver: zodResolver(newUserSchema),
  });
  
  useEffect(() => {
    const checkSetup = async () => {
        if (!db || authLoading) return;
        
        if(user) { // If a user is already logged in
            setIsFirstUserSetup(false);
            setIsCheckingSetup(false);
            return;
        }

        const setupRef = ref(db, 'app_settings/isSuperAdminRegistered');
        const snapshot = await get(setupRef);

        if (!snapshot.exists() || snapshot.val() === false) {
            setIsFirstUserSetup(true);
            setValue('roleId', 'admin');
        } else {
            setIsFirstUserSetup(false);
            router.replace('/login'); // Redirect to login if setup is already complete
        }
        setIsCheckingSetup(false);
    };
    checkSetup();
  }, [authLoading, user, router, setValue]);

  const institutionUsers = useMemo(() => {
    if (!currentInstitution || !userMappings) return [];
    return userMappings.filter(m => m.institutionId === currentInstitution.id);
  }, [currentInstitution, userMappings]);

  const onAddUserSubmit: SubmitHandler<NewUserFormValues> = useCallback(async (data) => {
    setLoading(true);
    let targetInstitution = currentInstitution;
    
    try {
        if (isFirstUserSetup) {
            if (!data.institutionName) {
                toast({ variant: 'destructive', title: 'Institution Required', description: 'Please provide a name for your first institution.' });
                setLoading(false);
                return;
            }
            targetInstitution = await addInstitution({ name: data.institutionName, logoUrl: '' });
            if (!targetInstitution) throw new Error("Failed to create the first institution.");
        }

        if (!targetInstitution) {
            toast({ variant: 'destructive', title: 'No Institution Selected', description: 'Please select an institution before adding users.' });
            setLoading(false);
            return;
        }

      const userCredential = await signUp({ email: data.email, password: data.password });
      await assignRoleToUser(userCredential.user.uid, data.roleId as RoleId, targetInstitution.id);
      
      if (isFirstUserSetup) {
          // Set the flag to true to prevent future super admin registrations
          await set(ref(db, 'app_settings/isSuperAdminRegistered'), true);
      }

      toast({
        title: 'User Created',
        description: `Account for ${data.email} created with the ${data.roleId} role for ${targetInstitution.name}.`,
      });
      
      if(isFirstUserSetup) {
          // Manually sign in the user, as Firebase doesn't do this automatically on this flow sometimes
          // The layout effect will then redirect to the dashboard
          window.location.href = '/dashboard';
      } else {
        reset({ email: '', password: '', roleId: '', institutionName: '' });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to Create User',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      if (!isFirstUserSetup) {
        setLoading(false);
      }
    }
  }, [signUp, assignRoleToUser, toast, reset, currentInstitution, isFirstUserSetup, addInstitution]);
  
  const availableRoles = useMemo(() => {
      if (isFirstUserSetup) {
          return [{ id: 'admin', name: 'Super Admin' }];
      }
      return roles.filter(role => role.id !== 'super-admin');
  }, [roles, isFirstUserSetup]);
  
  if (isCheckingSetup) {
    return (
        <div className="p-4 md:p-8 flex justify-center items-center">
             <Skeleton className="h-96 w-full" />
        </div>
     )
  }

  if (!currentInstitution && !isFirstUserSetup) {
    return (
        <div className="p-4 md:p-8">
            <Card>
                <CardHeader>
                    <CardTitle>No Institution Selected</CardTitle>
                    <CardDescription>Please select an institution from the selector to manage users.</CardDescription>
                </CardHeader>
            </Card>
        </div>
    )
  }

  return (
    <div className="p-4 md:p-8 grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus /> {isFirstUserSetup ? 'Create Super Admin' : 'Create New User'}
            </CardTitle>
            <CardDescription>
                {isFirstUserSetup 
                    ? 'Create the first Super Admin account and your primary institution.'
                    : `Add a new user to the '${currentInstitution?.name}' institution and assign them a role.`
                }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onAddUserSubmit)} className="space-y-4">
              {isFirstUserSetup && (
                <div className="space-y-2">
                    <Label htmlFor="institutionName">Institution Name</Label>
                    <Input id="institutionName" {...register('institutionName')} placeholder="e.g., Mianwali Petroleum" />
                    {errors.institutionName && <p className="text-sm text-destructive">{errors.institutionName.message}</p>}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register('email')} placeholder="user@example.com" />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" {...register('password')} placeholder="••••••••" />
                {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
              </div>
              
              <div className="space-y-2">
                <Label>Role</Label>
                <Controller
                    name="roleId"
                    control={control}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value} defaultValue={isFirstUserSetup ? 'admin' : ''} disabled={isFirstUserSetup}>
                            <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent>
                            {availableRoles.map(role => (
                                <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                    )}
                />
                {errors.roleId && <p className="text-sm text-destructive">{errors.roleId.message}</p>}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating...' : 'Create User'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
       {isFirstUserSetup ? (
         <Alert>
            <Building className="h-4 w-4" />
            <AlertTitle>Welcome!</AlertTitle>
            <AlertDescription>
                You are about to set up the first account for this system. This account will have Super Admin privileges, allowing you to manage everything. Please create your account and your first institution using the form.
            </AlertDescription>
         </Alert>
       ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <List /> User List
            </CardTitle>
            <CardDescription>A list of all registered users and their roles for this institution.</CardDescription>
          </CardHeader>
          <CardContent>
            {isReady ? (
              institutionUsers.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User ID (UID)</TableHead>
                      <TableHead>Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {institutionUsers.map(userItem => {
                        const roleName = roles.find(r => r.id === userItem.roleId)?.name || userItem.roleId;
                        return (
                        <TableRow key={userItem.id}>
                          <TableCell className="font-mono text-xs">{userItem.userId}</TableCell>
                          <TableCell className="font-medium capitalize">{roleName}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center gap-4 text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                  <UserCog className="w-16 h-16" />
                  <h3 className="text-xl font-semibold">No Users Found</h3>
                  <p>Use the form to create the first user for this institution.</p>
                </div>
              )
            ) : (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            )}
          </CardContent>
        </Card>
       )}
      </div>
    </div>
  );
}
