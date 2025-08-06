
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
import { Users, UserPlus, List, BookText, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { useCustomers } from '@/hooks/use-customers';
import Link from 'next/link';
import Barcode from 'react-barcode';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import type { Customer } from '@/lib/types';


const customerSchema = z.object({
  name: z.string().min(1, 'Customer name is required'),
  contact: z.string().min(1, 'Contact information is required'),
  vehicleNumber: z.string().optional(),
  area: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      aria-hidden="true"
      fill="currentColor"
      viewBox="0 0 448 512"
      {...props}
    >
      <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 .9c34.9 0 67.7 13.5 92.8 38.6 25.1 25.1 38.6 57.9 38.6 92.8 0 97.8-79.7 177.6-177.6 177.6-34.9 0-67.7-13.5-92.8-38.6s-38.6-57.9-38.6-92.8c0-97.8 79.7-177.6 177.6-177.6zm93.8 148.6c-3.3-1.5-19.8-9.8-23-11.5s-5.5-2.5-7.8 2.5c-2.3 5-8.7 11.5-10.7 13.8s-3.9 2.5-7.3 1c-3.3-1.5-14-5.2-26.6-16.5c-9.9-8.9-16.5-19.8-18.5-23s-2-5.5-.6-7.5c1.4-2 3-3.3 4.5-5.2s3-4.2 4.5-7.1c1.5-2.8.8-5.2-.4-6.8s-7.8-18.5-10.7-25.4c-2.8-6.8-5.6-5.8-7.8-5.8s-4.5-.4-6.8-.4-7.8 1.1-11.8 5.5c-4 4.4-15.2 14.8-15.2 36.1s15.5 41.9 17.5 44.8c2 2.8 30.4 46.4 73.8 65.4 10.8 4.8 19.3 7.6 25.9 9.8s11.1 1.5 15.2 1c4.8-.7 19.8-8.2 22.5-16.1s2.8-14.8 2-16.1c-.8-1.5-3.3-2.5-6.8-4z"></path>
    </svg>
);

export default function CustomersPage() {
  const { customers, addCustomer, updateCustomer, deleteCustomer, isLoaded } = useCustomers();
  const { toast } = useToast();
  
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
  });

  const { register: registerEdit, handleSubmit: handleSubmitEdit, reset: resetEdit, setValue: setEditValue, formState: { errors: editErrors } } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
  });

  const onAddSubmit: SubmitHandler<CustomerFormValues> = useCallback((data) => {
    addCustomer({ ...data, isPartner: false });
    toast({
      title: 'Customer Added',
      description: `${data.name} has been added to your customer list.`,
    });
    reset();
  }, [addCustomer, toast, reset]);
  
  const onEditSubmit: SubmitHandler<CustomerFormValues> = useCallback((data) => {
    if (!customerToEdit) return;
    updateCustomer(customerToEdit.id, data);
    toast({
        title: 'Customer Updated',
        description: "The customer's details have been saved."
    });
    setCustomerToEdit(null);
  }, [customerToEdit, updateCustomer, toast]);

  const handleDeleteCustomer = useCallback(() => {
    if (!customerToDelete) return;
    deleteCustomer(customerToDelete.id);
    toast({
        title: 'Customer Deleted',
        description: `${customerToDelete.name} has been removed.`,
    });
    setCustomerToDelete(null);
  }, [customerToDelete, deleteCustomer, toast]);
  
  useEffect(() => {
      if (customerToEdit) {
        setEditValue('name', customerToEdit.name);
        setEditValue('contact', customerToEdit.contact);
        setEditValue('vehicleNumber', customerToEdit.vehicleNumber || '');
        setEditValue('area', customerToEdit.area || '');
      } else {
        resetEdit();
      }
  }, [customerToEdit, setEditValue, resetEdit]);

  const formatPhoneNumberForWhatsApp = (phone: string) => {
    return phone.replace(/[^0-9]/g, '');
  }

  return (
    <>
    <div className="p-4 md:p-8 grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus /> New Customer
            </CardTitle>
            <CardDescription>Add a new customer to your records.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onAddSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Customer Name</Label>
                <Input id="name" {...register('name')} placeholder="e.g., John Doe" />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contact">Contact Info (Phone Number)</Label>
                <Input id="contact" {...register('contact')} placeholder="e.g., 923001234567" />
                {errors.contact && <p className="text-sm text-destructive">{errors.contact.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="vehicleNumber">Vehicle Number (Optional)</Label>
                <Input id="vehicleNumber" {...register('vehicleNumber')} placeholder="e.g., ABC-123" />
                {errors.vehicleNumber && <p className="text-sm text-destructive">{errors.vehicleNumber.message}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="area">Area (Optional)</Label>
                <Input id="area" {...register('area')} placeholder="e.g., Mianwali City" />
                {errors.area && <p className="text-sm text-destructive">{errors.area.message}</p>}
              </div>

              <Button type="submit" className="w-full">Add Customer</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <List /> Customer & Partner List
            </CardTitle>
            <CardDescription>
              A record of all your customers and business partners.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer Details</TableHead>
                  <TableHead>Barcode</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoaded ? (
                  customers.length > 0 ? (
                    customers.map(c => (
                      <TableRow key={c.id}>
                        <TableCell>
                          <div className="font-medium flex items-center gap-2">
                            {c.name}
                            {c.isPartner && <Badge variant="secondary">Partner</Badge>}
                          </div>
                          <div className="text-sm text-muted-foreground">{c.contact}</div>
                           <div className="text-xs text-muted-foreground">{c.area || 'N/A'}</div>
                          <div className="text-xs text-muted-foreground">{c.vehicleNumber || 'N/A'}</div>
                          <div className="text-xs text-muted-foreground">Added: {format(new Date(c.timestamp), 'PP')}</div>
                        </TableCell>
                        <TableCell>
                          <Barcode value={c.id} height={40} width={1.5} fontSize={10} margin={2} />
                        </TableCell>
                        <TableCell className="text-center space-x-0">
                           <Button asChild variant="ghost" size="icon" title="View Ledger">
                              <Link href={`/customers/${c.id}/ledger`}>
                                <BookText className="w-5 h-5" />
                              </Link>
                           </Button>
                           <Button variant="ghost" size="icon" title="Edit Customer" onClick={() => setCustomerToEdit(c)}>
                                <Pencil className="w-4 h-4" />
                           </Button>
                           {c.contact && (
                             <Button asChild variant="ghost" size="icon" className="text-green-500 hover:text-green-600" title={`Message ${c.name} on WhatsApp`}>
                               <a 
                                href={`https://wa.me/${formatPhoneNumberForWhatsApp(c.contact)}`}
                                target="_blank" 
                                rel="noopener noreferrer"
                              >
                                 <WhatsAppIcon className="w-5 h-5" />
                              </a>
                            </Button>
                           )}
                           <Button variant="ghost" size="icon" title="Delete Customer" className="text-destructive hover:text-destructive" onClick={() => setCustomerToDelete(c)}>
                                <Trash2 className="w-4 h-4" />
                           </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center">
                        <div className="flex flex-col items-center justify-center gap-4 text-center text-muted-foreground">
                            <Users className="w-16 h-16" />
                            <h3 className="text-xl font-semibold">No Customers Recorded</h3>
                            <p>Use the form to add your first customer.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                ) : (
                  <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center">
                          Loading customers...
                      </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
    
    <Dialog open={!!customerToEdit} onOpenChange={(isOpen) => { if (!isOpen) { setCustomerToEdit(null); resetEdit(); } }}>
        <DialogContent>
            <form onSubmit={handleSubmitEdit(onEditSubmit)}>
                <DialogHeader>
                    <DialogTitle>Edit Customer</DialogTitle>
                    <DialogDescription>
                        Update the details for this customer.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-name">Customer Name</Label>
                        <Input id="edit-name" {...registerEdit('name')} />
                        {editErrors.name && <p className="text-sm text-destructive">{editErrors.name.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-contact">Contact Info</Label>
                        <Input id="edit-contact" {...registerEdit('contact')} />
                        {editErrors.contact && <p className="text-sm text-destructive">{editErrors.contact.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-vehicleNumber">Vehicle Number</Label>
                        <Input id="edit-vehicleNumber" {...registerEdit('vehicleNumber')} />
                        {editErrors.vehicleNumber && <p className="text-sm text-destructive">{editErrors.vehicleNumber.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-area">Area</Label>
                        <Input id="edit-area" {...registerEdit('area')} />
                        {editErrors.area && <p className="text-sm text-destructive">{editErrors.area.message}</p>}
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setCustomerToEdit(null)}>Cancel</Button>
                    <Button type="submit">Save Changes</Button>
                </DialogFooter>
            </form>
        </DialogContent>
    </Dialog>

    <AlertDialog open={!!customerToDelete} onOpenChange={(isOpen) => !isOpen && setCustomerToDelete(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle/>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the customer: <br />
            <strong className="font-medium text-foreground">{customerToDelete?.name}</strong>.
            All their associated transactions will remain but will no longer be linked to them.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDeleteCustomer} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Yes, delete customer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
