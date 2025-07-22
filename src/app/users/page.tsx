
'use client';

import { useState, useCallback } from 'react';
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { UserCog, UserPlus, List, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRoles } from '@/hooks/use-roles';
import type { RoleId } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const newUserSchema = z.object({
  email: z.string().email('A valid email is required.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  roleId: z.string().min(1, 'Please select a role for the user.'),
});

type NewUserFormValues = z.infer<typeof newUserSchema>;

export default function UserManagementPage() {
  const { signUp, isFirstUser } = useAuth();
  const { roles, assignRoleToUser, userRoles, getRoleForUser } = useRoles();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<NewUserFormValues>({
    resolver: zodResolver(newUserSchema),
  });

  const onAddUserSubmit: SubmitHandler<NewUserFormValues> = useCallback(async (data) => {
    setLoading(true);
    try {
      const userCredential = await signUp({ email: data.email, password: data.password });
      const roleToAssign = isFirstUser ? 'super-admin' : data.roleId;
      assignRoleToUser(userCredential.user.uid, roleToAssign);
      
      toast({
        title: 'User Created',
        description: `Account for ${data.email} created with the ${roleToAssign} role.`,
      });
      reset({ email: '', password: '', roleId: '' });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to Create User',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setLoading(false);
    }
  }, [signUp, assignRoleToUser, toast, reset, isFirstUser]);
  
  const availableRoles = roles.filter(role => role.id !== 'super-admin');

  return (
    <div className="p-4 md:p-8 grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus /> {isFirstUser ? 'Create Super Admin' : 'Create New User'}
            </CardTitle>
            <CardDescription>
                {isFirstUser ? 'Create the first Super Admin account. This can only be done once.' : 'Add a new user and assign them a role.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onAddUserSubmit)} className="space-y-4">
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
              
              {!isFirstUser && (
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Controller
                        name="roleId"
                        control={control}
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value} defaultValue="">
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
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating...' : (isFirstUser ? 'Create Super Admin' : 'Create User')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <List /> User List
            </CardTitle>
            <CardDescription>A list of all registered users and their roles.</CardDescription>
          </CardHeader>
          <CardContent>
            {userRoles.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>Role</TableHead>
                    {/* Add actions column if needed */}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userRoles.map(userRole => (
                      <TableRow key={userRole.id}>
                        <TableCell className="font-mono">{userRole.id}</TableCell>
                        <TableCell className="font-medium capitalize">{userRole.roleId.replace('-', ' ')}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                <UserCog className="w-16 h-16" />
                <h3 className="text-xl font-semibold">No Users Found</h3>
                <p>{isFirstUser ? 'Create the Super Admin to begin.' : 'Use the form to create the first user.'}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
