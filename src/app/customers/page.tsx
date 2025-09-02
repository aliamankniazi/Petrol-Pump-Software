
'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useForm, type SubmitHandler, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Users, UserPlus, List, BookText, Pencil, Trash2, AlertTriangle, Percent, LayoutDashboard, Search, PlusCircle, Car } from 'lucide-react';
import { format } from 'date-fns';
import { useCustomers } from '@/hooks/use-customers';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import type { Customer } from '@/lib/types';
import { Checkbox } from '@/components/ui/checkbox';
import { useTransactions } from '@/hooks/use-transactions';
import { useCustomerPayments } from '@/hooks/use-customer-payments';
import { useCashAdvances } from '@/hooks/use-cash-advances';
import { cn } from '@/lib/utils';


const customerSchema = z.object({
  name: z.string().min(1, 'Customer name is required'),
  contact: z.string().min(1, 'Contact information is required'),
  vehicleNumbers: z.array(z.object({ value: z.string().min(1, "Vehicle number cannot be empty") })).optional(),
  area: z.string().optional(),
  isPartner: z.boolean().default(false),
  sharePercentage: z.coerce.number().optional(),
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
  const { transactions, isLoaded: txLoaded } = useTransactions();
  const { customerPayments, isLoaded: paymentsLoaded } = useCustomerPayments();
  const { cashAdvances, isLoaded: advancesLoaded } = useCashAdvances();
  const { toast } = useToast();
  
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [vehicleToEdit, setVehicleToEdit] = useState<{ customer: Customer; vehicleIndex: number } | null>(null);
  const [updatedVehicleNumber, setUpdatedVehicleNumber] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const { register, handleSubmit, reset, control, watch, formState: { errors } } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: { vehicleNumbers: [{ value: '' }] }
  });
  
  const { fields, append, remove } = useFieldArray({ control, name: "vehicleNumbers" });

  const { register: registerEdit, handleSubmit: handleSubmitEdit, reset: resetEdit, setValue: setEditValue, control: controlEdit, watch: watchEdit, formState: { errors: editErrors } } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
  });

  const { fields: fieldsEdit, append: appendEdit, remove: removeEdit } = useFieldArray({ control: controlEdit, name: "vehicleNumbers" });


  const isPartner = watch('isPartner');
  const isPartnerEdit = watchEdit('isPartner');

  const isDataLoaded = isLoaded && txLoaded && paymentsLoaded && advancesLoaded;

  const onAddSubmit: SubmitHandler<CustomerFormValues> = useCallback((data) => {
    addCustomer({
        name: data.name,
        contact: data.contact,
        vehicleNumbers: data.vehicleNumbers?.map(v => v.value).filter(Boolean),
        area: data.area,
        isPartner: data.isPartner,
        sharePercentage: data.isPartner ? data.sharePercentage : 0,
    });
    toast({
      title: 'Record Added',
      description: `${data.name} has been added to your records.`,
    });
    reset({name: '', contact: '', vehicleNumbers: [{ value: '' }], area: '', isPartner: false, sharePercentage: 0});
  }, [addCustomer, toast, reset]);
  
  const onEditSubmit: SubmitHandler<CustomerFormValues> = useCallback((data) => {
    if (!customerToEdit) return;
    updateCustomer(customerToEdit.id!, {
        ...data,
        vehicleNumbers: data.vehicleNumbers?.map(v => v.value).filter(Boolean),
    });
    toast({
        title: 'Record Updated',
        description: "The record's details have been saved."
    });
    setCustomerToEdit(null);
  }, [customerToEdit, updateCustomer, toast]);

  const handleDeleteCustomer = useCallback(() => {
    if (!customerToDelete) return;
    
    // Safeguard: Check if customer has any associated transactions
    const hasTransactions = transactions.some(tx => tx.customerId === customerToDelete.id) ||
                            customerPayments.some(p => p.customerId === customerToDelete.id) ||
                            cashAdvances.some(ca => ca.customerId === customerToDelete.id);

    if (hasTransactions) {
        toast({
            variant: 'destructive',
            title: 'Deletion Prevented',
            description: `${customerToDelete.name} has existing transactions and cannot be deleted.`,
        });
        setCustomerToDelete(null);
        return;
    }

    deleteCustomer(customerToDelete.id!);
    toast({
        title: 'Record Deleted',
        description: `${customerToDelete.name} has been removed.`,
    });
    setCustomerToDelete(null);
  }, [customerToDelete, deleteCustomer, toast, transactions, customerPayments, cashAdvances]);
  
  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return customers;
    return customers.filter(c =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.contact?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [customers, searchTerm]);

  const lastTransactionsByCustomer = useMemo(() => {
    if (!isDataLoaded) return {};
    
    const allCustomerActivity: Record<string, { type: 'Sale' | 'Payment'; amount: number; timestamp: string }[]> = {};
    
    transactions.forEach(tx => {
      if (tx.customerId && tx.timestamp) {
        if (!allCustomerActivity[tx.customerId]) allCustomerActivity[tx.customerId] = [];
        allCustomerActivity[tx.customerId].push({ type: 'Sale', amount: tx.totalAmount, timestamp: tx.timestamp });
      }
    });

    customerPayments.forEach(p => {
      if (p.customerId && p.timestamp) {
        if (!allCustomerActivity[p.customerId]) allCustomerActivity[p.customerId] = [];
        allCustomerActivity[p.customerId].push({ type: 'Payment', amount: p.amount, timestamp: p.timestamp });
      }
    });

    Object.keys(allCustomerActivity).forEach(customerId => {
      allCustomerActivity[customerId].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    });

    return allCustomerActivity;
  }, [isDataLoaded, transactions, customerPayments]);


  useEffect(() => {
      if (customerToEdit) {
        setEditValue('name', customerToEdit.name);
        setEditValue('contact', customerToEdit.contact);
        setEditValue('vehicleNumbers', customerToEdit.vehicleNumbers?.map(v => ({ value: v })) || [{value: ''}]);
        setEditValue('area', customerToEdit.area || '');
        setEditValue('isPartner', customerToEdit.isPartner || false);
        setEditValue('sharePercentage', customerToEdit.sharePercentage || 0);
      } else {
        resetEdit();
      }
  }, [customerToEdit, setEditValue, resetEdit]);

  useEffect(() => {
    if (vehicleToEdit) {
      setUpdatedVehicleNumber(vehicleToEdit.customer.vehicleNumbers![vehicleToEdit.vehicleIndex]);
    } else {
      setUpdatedVehicleNumber('');
    }
  }, [vehicleToEdit]);

  const handleUpdateVehicle = useCallback(() => {
    if (!vehicleToEdit || !updatedVehicleNumber) return;
    const { customer, vehicleIndex } = vehicleToEdit;
    const newVehicleNumbers = [...(customer.vehicleNumbers || [])];
    newVehicleNumbers[vehicleIndex] = updatedVehicleNumber;
    updateCustomer(customer.id!, { vehicleNumbers: newVehicleNumbers });
    toast({ title: 'Vehicle Updated', description: "The vehicle number has been successfully updated." });
    setVehicleToEdit(null);
  }, [vehicleToEdit, updatedVehicleNumber, updateCustomer, toast]);

  const handleDeleteVehicle = useCallback(() => {
    if (!vehicleToEdit) return;
    const { customer, vehicleIndex } = vehicleToEdit;
    const newVehicleNumbers = [...(customer.vehicleNumbers || [])];
    newVehicleNumbers.splice(vehicleIndex, 1);
    updateCustomer(customer.id!, { vehicleNumbers: newVehicleNumbers });
    toast({ title: 'Vehicle Deleted', description: "The vehicle number has been successfully removed." });
    setVehicleToEdit(null);
  }, [vehicleToEdit, updateCustomer, toast]);

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
              <UserPlus /> Customer, Employee & Partner Ledger
            </CardTitle>
            <CardDescription>Add a new person or business partner to your records.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onAddSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" {...register('name')} placeholder="e.g., John Doe" />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contact">Contact Info (Phone Number)</Label>
                <Input id="contact" {...register('contact')} placeholder="e.g., 923001234567" />
                {errors.contact && <p className="text-sm text-destructive">{errors.contact.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Vehicle Numbers (Optional)</Label>
                {fields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2">
                        <Input
                            {...register(`vehicleNumbers.${index}.value`)}
                            placeholder={`e.g., ABC-${123 + index}`}
                        />
                        <Button type="button" variant="outline" size="icon" onClick={() => remove(index)}>
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => append({ value: "" })}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Vehicle
                </Button>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="area">Area (Optional)</Label>
                <Input id="area" {...register('area')} placeholder="e.g., Mianwali City" />
              </div>

              <div className="flex items-center space-x-2">
                <Controller
                  name="isPartner"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="isPartner"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <label htmlFor="isPartner" className="text-sm font-medium leading-none">
                  This is a Business Partner
                </label>
              </div>

              {isPartner && (
                <div className="space-y-2">
                  <Label htmlFor="sharePercentage" className="flex items-center gap-2"><Percent className="w-4 h-4"/> Share Percentage</Label>
                  <Input id="sharePercentage" type="number" step="0.01" {...register('sharePercentage')} placeholder="e.g., 50" />
                </div>
              )}

              <Button type="submit" className="w-full">Add Record</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <List /> Customer, Employee & Partner Ledger
                </CardTitle>
                <CardDescription>
                  A record of all your customers, employees, and business partners.
                </CardDescription>
              </div>
               <div className="flex items-center gap-2">
                  <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                          placeholder="Search by name/contact..." 
                          className="pl-10 max-w-sm"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                      />
                  </div>
                   <Button asChild variant="outline">
                      <Link href="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" /> Go to Dashboard</Link>
                  </Button>
               </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Details</TableHead>
                  <TableHead>Last 3 Transactions</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isDataLoaded ? (
                  filteredCustomers.length > 0 ? (
                    filteredCustomers.map(c => (
                      <TableRow key={c.id}>
                        <TableCell>
                          <div className="font-medium flex items-center gap-2">
                            <Link href={`/customers/${c.id}/ledger`} className="hover:underline">{c.name}</Link>
                            {c.isPartner && <Badge variant="secondary">Partner</Badge>}
                            {c.isEmployee && <Badge>Employee</Badge>}
                          </div>
                          <div className="text-sm text-muted-foreground">{c.contact}</div>
                           <div className="text-xs text-muted-foreground">{c.area || 'N/A'}</div>
                           <div className="text-xs text-muted-foreground mt-2 flex flex-wrap gap-1 items-center">
                            <Car className="w-3 h-3 mr-1" />
                            {c.vehicleNumbers && c.vehicleNumbers.length > 0 ? (
                                c.vehicleNumbers.map((vehicle, index) => (
                                <Badge 
                                    key={index} 
                                    variant="outline" 
                                    className="cursor-pointer hover:bg-muted"
                                    onClick={() => setVehicleToEdit({ customer: c, vehicleIndex: index })}
                                >
                                    {vehicle}
                                </Badge>
                                ))
                            ) : (
                                'No vehicles'
                            )}
                           </div>
                          <div className="text-xs text-muted-foreground mt-1">Added: {c.timestamp ? format(new Date(c.timestamp), 'PP') : 'N/A'}</div>
                        </TableCell>
                        <TableCell>
                          {(lastTransactionsByCustomer[c.id!] || []).slice(0, 3).map((tx, index) => (
                            <div key={index} className="flex justify-between items-center text-xs py-0.5">
                              <span className={cn("font-medium", tx.type === 'Sale' ? 'text-destructive' : 'text-green-600')}>{tx.type}</span>
                              <span className="font-mono">{tx.amount.toFixed(0)}</span>
                              <span className="text-muted-foreground">{format(new Date(tx.timestamp), 'dd/MM')}</span>
                            </div>
                          ))}
                          {(lastTransactionsByCustomer[c.id!] || []).length === 0 && (
                            <div className="text-xs text-muted-foreground">No transactions</div>
                          )}
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
                            <h3 className="text-xl font-semibold">{searchTerm ? 'No Matching Records' : 'No Customers Recorded'}</h3>
                            <p>{searchTerm ? 'Try a different search term.' : 'Use the form to add your first customer.'}</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                ) : (
                  <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center">
                          <p className="text-muted-foreground">Loading customers...</p>
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
                    <DialogTitle>Edit Record</DialogTitle>
                    <DialogDescription>
                        Update the details for this customer or partner.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-name">Full Name</Label>
                        <Input id="edit-name" {...registerEdit('name')} />
                        {editErrors.name && <p className="text-sm text-destructive">{editErrors.name.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-contact">Contact Info</Label>
                        <Input id="edit-contact" {...registerEdit('contact')} />
                        {editErrors.contact && <p className="text-sm text-destructive">{editErrors.contact.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label>Vehicle Numbers</Label>
                        {fieldsEdit.map((field, index) => (
                            <div key={field.id} className="flex items-center gap-2">
                                <Input
                                    {...registerEdit(`vehicleNumbers.${index}.value`)}
                                    placeholder={`e.g., ABC-${123 + index}`}
                                />
                                <Button type="button" variant="outline" size="icon" onClick={() => removeEdit(index)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" onClick={() => appendEdit({ value: "" })}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Vehicle
                        </Button>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-area">Area</Label>
                        <Input id="edit-area" {...registerEdit('area')} />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Controller
                        name="isPartner"
                        control={controlEdit}
                        render={({ field }) => (
                           <Checkbox id="edit-isPartner" checked={field.value} onCheckedChange={field.onChange} />
                        )}
                      />
                      <label htmlFor="edit-isPartner" className="text-sm font-medium leading-none">
                        This is a Business Partner
                      </label>
                    </div>

                    {isPartnerEdit && (
                      <div className="space-y-2">
                        <Label htmlFor="edit-sharePercentage" className="flex items-center gap-2"><Percent className="w-4 h-4"/> Share Percentage</Label>
                        <Input id="edit-sharePercentage" type="number" step="0.01" {...registerEdit('sharePercentage')} />
                      </div>
                    )}
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setCustomerToEdit(null)}>Cancel</Button>
                    <Button type="submit">Save Changes</Button>
                </DialogFooter>
            </form>
        </DialogContent>
    </Dialog>

    <Dialog open={!!vehicleToEdit} onOpenChange={(isOpen) => !isOpen && setVehicleToEdit(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Edit Vehicle Number</DialogTitle>
                <DialogDescription>Update the vehicle number for {vehicleToEdit?.customer.name}.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="edit-vehicle-number">Vehicle Number</Label>
                    <Input 
                        id="edit-vehicle-number" 
                        value={updatedVehicleNumber}
                        onChange={(e) => setUpdatedVehicleNumber(e.target.value)}
                    />
                </div>
            </div>
            <DialogFooter className="justify-between">
                <Button variant="destructive" onClick={handleDeleteVehicle}><Trash2 className="mr-2 h-4 w-4" /> Delete Vehicle</Button>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setVehicleToEdit(null)}>Cancel</Button>
                    <Button onClick={handleUpdateVehicle}>Save Changes</Button>
                </div>
            </DialogFooter>
        </DialogContent>
    </Dialog>

    <AlertDialog open={!!customerToDelete} onOpenChange={(isOpen) => !isOpen && setCustomerToDelete(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle/>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the record for: <br />
            <strong className="font-medium text-foreground">{customerToDelete?.name}</strong>.
            This is only possible if the customer has no transaction history.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDeleteCustomer} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Yes, delete record
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
