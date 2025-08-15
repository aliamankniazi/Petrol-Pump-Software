
'use client';

import * as React from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Settings, Trash2, AlertTriangle, Truck, UserPlus, BookText, LayoutDashboard } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import type { Supplier } from '@/lib/types';
import { useSuppliers } from '@/hooks/use-suppliers';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';
import { usePurchases } from '@/hooks/use-purchases';
import { usePurchaseReturns } from '@/hooks/use-purchase-returns';
import { useSupplierPayments } from '@/hooks/use-supplier-payments';

const supplierSchema = z.object({
  name: z.string().min(1, 'Supplier name is required'),
  contact: z.string().optional(),
});
type SupplierFormValues = z.infer<typeof supplierSchema>;


export default function SuppliersPage() {
  const { suppliers, addSupplier, deleteSupplier, isLoaded: suppliersLoaded } = useSuppliers();
  const { purchases, isLoaded: purchasesLoaded } = usePurchases();
  const { purchaseReturns, isLoaded: returnsLoaded } = usePurchaseReturns();
  const { supplierPayments, isLoaded: paymentsLoaded } = useSupplierPayments();
  const { toast } = useToast();
  const [supplierToDelete, setSupplierToDelete] = React.useState<Supplier | null>(null);

  const isDataLoaded = suppliersLoaded && purchasesLoaded && returnsLoaded && paymentsLoaded;

  const {
    register: registerSupplier,
    handleSubmit: handleSubmitSupplier,
    reset: resetSupplier,
    formState: { errors: supplierErrors }
  } = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema)
  });


  const onSupplierSubmit: SubmitHandler<SupplierFormValues> = React.useCallback((data) => {
    addSupplier(data);
    toast({
      title: 'Supplier Added',
      description: `${data.name} has been added to your supplier list.`,
    });
    resetSupplier();
  }, [addSupplier, toast, resetSupplier]);

  const handleDeleteSupplier = React.useCallback(() => {
    if (!supplierToDelete || !supplierToDelete.id) return;
    
    // Safeguard: Check for dependencies before deleting
    const hasDependencies = purchases.some(p => p.supplierId === supplierToDelete.id) ||
                            purchaseReturns.some(pr => pr.supplierId === supplierToDelete.id) ||
                            supplierPayments.some(sp => sp.supplierId === supplierToDelete.id);

    const supplierName = suppliers.find(s => s.id === supplierToDelete.id)?.name || 'The supplier';

    if (hasDependencies) {
        toast({
            variant: 'destructive',
            title: 'Deletion Prevented',
            description: `${supplierName} has existing transactions and cannot be deleted.`,
        });
        setSupplierToDelete(null);
        return;
    }
    
    deleteSupplier(supplierToDelete.id);
    setSupplierToDelete(null);
  }, [supplierToDelete, deleteSupplier, purchases, purchaseReturns, supplierPayments, suppliers, toast]);

  return (
    <>
    <div className="p-4 md:p-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Truck /> Supplier Management
            </CardTitle>
            <CardDescription>Add, view, or remove your suppliers.</CardDescription>
          </div>
          <Button asChild variant="outline">
              <Link href="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" /> Go to Dashboard</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2"><UserPlus /> Add New Supplier</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmitSupplier(onSupplierSubmit)} className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="supplierName">Supplier Name</Label>
                                <Input id="supplierName" {...registerSupplier('name')} placeholder="e.g., PSO" />
                                {supplierErrors.name && <p className="text-sm text-destructive">{supplierErrors.name.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="supplierContact">Contact (Optional)</Label>
                                <Input id="supplierContact" {...registerSupplier('contact')} placeholder="e.g., 0300-1234567" />
                                {supplierErrors.contact && <p className="text-sm text-destructive">{supplierErrors.contact.message}</p>}
                            </div>
                        </div>
                        <Button type="submit">Add Supplier</Button>
                    </form>
                    <Separator className="my-6" />
                    <h4 className="text-md font-medium mb-4">Existing Suppliers</h4>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Contact</TableHead><TableHead className="text-center">Actions</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {suppliersLoaded && suppliers.length > 0 ? suppliers.map(s => (
                                    <TableRow key={s.id}>
                                        <TableCell className="font-medium">{s.name}</TableCell>
                                        <TableCell>{s.contact || 'N/A'}</TableCell>
                                        <TableCell className="text-center">
                                            <Button asChild variant="ghost" size="icon" title="View Ledger"><Link href={`/customers/${s.id}/ledger`}><BookText className="w-5 h-5" /></Link></Button>
                                            <Button variant="ghost" size="icon" title="Delete Supplier" onClick={() => setSupplierToDelete(s)}><Trash2 className="w-5 h-5 text-destructive" /></Button>
                                        </TableCell>
                                    </TableRow>
                                )) : <TableRow><TableCell colSpan={3} className="h-24 text-center">{suppliersLoaded ? 'No suppliers added yet.' : 'Loading suppliers...'}</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </CardContent>
      </Card>
      
      <AlertDialog open={!!supplierToDelete} onOpenChange={(isOpen) => !isOpen && setSupplierToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle className="flex items-center gap-2"><AlertTriangle/>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete the supplier: <br /><strong className="font-medium text-foreground">{supplierToDelete?.name}</strong>. This is only possible if the supplier has no transaction history.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteSupplier} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Yes, delete supplier</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </>
  );
}
