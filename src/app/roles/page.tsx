
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Shield, ShieldPlus, List, Edit, Trash2, AlertTriangle, KeyRound } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useRoles, PERMISSIONS } from '@/hooks/use-roles.tsx';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import type { Role, Permission } from '@/lib/types';
import { useInstitution } from '@/hooks/use-institution.tsx';
import { Skeleton } from '@/components/ui/skeleton';

const PERMISSION_CATEGORIES: Record<string, Permission[]> = {
    'General': ['view_dashboard', 'view_all_transactions', 'view_summary', 'generate_ai_summary', 'view_reports'],
    'Customers & Partners': ['view_customers', 'add_customer', 'edit_customer', 'delete_customer', 'view_partner_ledger', 'view_credit_recovery'],
    'Inventory & Purchases': ['view_inventory', 'view_purchases', 'add_purchase', 'delete_purchase', 'view_purchase_returns', 'add_purchase_return', 'delete_purchase_return', 'view_tank_readings', 'add_tank_reading'],
    'Financial': ['view_ledger', 'view_expenses', 'add_expense', 'delete_expense', 'view_other_incomes', 'add_other_income', 'delete_other_income', 'view_investments', 'add_investment', 'delete_investment', 'view_cash_advances', 'add_cash_advance', 'delete_cash_advance', 'view_supplier_payments', 'add_supplier_payment', 'delete_supplier_payment'],
    'Administration': ['manage_institutions', 'view_settings', 'manage_roles', 'manage_users', 'manage_employees', 'manage_banks'],
};


const roleSchema = z.object({
  name: z.string().min(1, 'Role name is required'),
  permissions: z.array(z.string()).min(1, 'At least one permission is required.'),
});

type RoleFormValues = z.infer<typeof roleSchema>;

export default function RolesPage() {
  const { roles, addRole, updateRole, deleteRole, isReady } = useRoles();
  const { currentInstitution } = useInstitution();
  const { toast } = useToast();
  
  const [roleToEdit, setRoleToEdit] = useState<Role | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
  });
  
  const selectedPermissions = watch('permissions') || [];

  useEffect(() => {
    if (roleToEdit) {
        setValue('name', roleToEdit.name);
        setValue('permissions', roleToEdit.permissions);
    } else {
        reset({ name: '', permissions: [] });
    }
  }, [roleToEdit, setValue, reset]);

  const onFormSubmit: SubmitHandler<RoleFormValues> = (data) => {
    if (roleToEdit) {
      updateRole(roleToEdit.id, data as Partial<Role>);
      toast({ title: 'Role Updated', description: `The "${data.name}" role has been updated.` });
    } else {
      addRole(data as Omit<Role, 'id'>);
      toast({ title: 'Role Added', description: `The "${data.name}" role has been created.` });
    }
    setRoleToEdit(null);
    reset({ name: '', permissions: [] });
  };
  
  const openEditDialog = (role: Role) => {
    setRoleToEdit(role);
  }

  const handleDeleteRole = () => {
    if (!roleToDelete) return;
    if (roleToDelete.id === 'admin') {
        toast({ variant: 'destructive', title: 'Action Denied', description: 'The Admin role cannot be deleted.' });
        setRoleToDelete(null);
        return;
    }
    deleteRole(roleToDelete.id);
    toast({ title: 'Role Deleted', description: `The "${roleToDelete.name}" role has been removed.` });
    setRoleToDelete(null);
  }
  
  if (!currentInstitution) {
    return (
        <div className="p-4 md:p-8">
            <Card>
                <CardHeader>
                    <CardTitle>No Institution Selected</CardTitle>
                    <CardDescription>Please select an institution to manage roles.</CardDescription>
                </CardHeader>
            </Card>
        </div>
    )
  }

  return (
    <>
    <div className="p-4 md:p-8 grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldPlus /> {roleToEdit ? 'Edit Role' : 'Create New Role'}
            </CardTitle>
            <CardDescription>
                {roleToEdit ? `Editing the "${roleToEdit.name}" role.` : 'Define a new role and assign permissions.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Role Name</Label>
                <Input id="name" {...register('name')} placeholder="e.g., Manager, Attendant" />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-4">
                <Label>Permissions</Label>
                {Object.entries(PERMISSION_CATEGORIES).map(([category, perms]) => (
                    <div key={category}>
                        <h4 className="font-medium text-sm mb-2">{category}</h4>
                        <div className="space-y-2 pl-2 border-l-2">
                         {perms.map(permission => (
                            <div key={permission} className="flex items-center gap-2">
                                <Checkbox
                                    id={permission}
                                    checked={selectedPermissions.includes(permission)}
                                    onCheckedChange={(checked) => {
                                        const currentPermissions = selectedPermissions;
                                        const newPermissions = checked
                                        ? [...currentPermissions, permission]
                                        : currentPermissions.filter(p => p !== permission);
                                        setValue('permissions', newPermissions, { shouldValidate: true });
                                    }}
                                />
                                <Label htmlFor={permission} className="font-normal capitalize text-sm">
                                    {permission.replace(/_/g, ' ')}
                                </Label>
                            </div>
                         ))}
                        </div>
                    </div>
                ))}
                {errors.permissions && <p className="text-sm text-destructive">{errors.permissions.message}</p>}
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="w-full">{roleToEdit ? 'Save Changes' : 'Create Role'}</Button>
                {roleToEdit && <Button type="button" variant="outline" onClick={() => { setRoleToEdit(null); reset({ name: '', permissions: []}); }}>Cancel</Button>}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <List /> Role List
            </CardTitle>
            <CardDescription>
              A list of all defined roles in '{currentInstitution.name}'.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isReady ? (
              roles.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role Name</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map(role => (
                      <TableRow key={role.id}>
                        <TableCell className="font-medium">{role.name}</TableCell>
                        <TableCell>{role.id === 'admin' ? 'All' : `${role.permissions.length} permissions`}</TableCell>
                        <TableCell className="text-center space-x-0">
                           <Button variant="ghost" size="icon" title="Edit Role" onClick={() => openEditDialog(role)}>
                                <Edit className="w-4 h-4" />
                           </Button>
                           <Button variant="ghost" size="icon" title="Delete Role" className="text-destructive hover:text-destructive" onClick={() => setRoleToDelete(role)} disabled={role.id === 'admin'}>
                                <Trash2 className="w-4 h-4" />
                           </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
              ) : (
                <div className="flex flex-col items-center justify-center gap-4 text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                  <Shield className="w-16 h-16" />
                  <h3 className="text-xl font-semibold">No Roles Found</h3>
                  <p>Use the form to create your first role for this institution.</p>
                </div>
              )
            ) : (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
    
    <AlertDialog open={!!roleToDelete} onOpenChange={(isOpen) => !isOpen && setRoleToDelete(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle/>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the role: <br />
            <strong className="font-medium text-foreground">{roleToDelete?.name}</strong>. Users assigned this role will lose their permissions.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDeleteRole} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Yes, delete role
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
