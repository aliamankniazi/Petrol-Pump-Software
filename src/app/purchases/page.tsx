

'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useForm, type SubmitHandler, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ShoppingCart, Package, Truck, Calendar as CalendarIcon, PlusCircle, Trash2, LayoutDashboard, AlertTriangle, Edit, Wallet, CreditCard, Smartphone } from 'lucide-react';
import { format } from 'date-fns';
import { usePurchases } from '@/hooks/use-purchases';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useSuppliers } from '@/hooks/use-suppliers';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useProducts } from '@/hooks/use-products';
import Link from 'next/link';
import type { Purchase } from '@/lib/types';
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
import { useSupplierBalance } from '@/hooks/use-supplier-balance';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';


const purchaseItemSchema = z.object({
  productId: z.string().min(1, 'Product is required.'),
  productName: z.string().optional(), // Added for edit form
  quantity: z.coerce.number().min(0.01, 'Quantity must be positive.'),
  costPerUnit: z.coerce.number().min(0, "Cost must be non-negative."),
  totalCost: z.coerce.number().min(0.01, 'Cost must be positive.'),
});

const purchaseSchema = z.object({
  supplierId: z.string().min(1, 'Please select a supplier.'),
  date: z.date({ required_error: "A date is required."}),
  expenses: z.coerce.number().optional(),
  notes: z.string().optional(),
  items: z.array(purchaseItemSchema).min(1, 'At least one item is required.'),
  paymentMethod: z.enum(['On Credit', 'Cash', 'Card', 'Mobile']).default('On Credit'),
  paidAmount: z.coerce.number().optional(),
});

type PurchaseFormValues = z.infer<typeof purchaseSchema>;

const supplierSchema = z.object({
  name: z.string().min(1, 'Supplier name is required'),
  contact: z.string().optional(),
});
type SupplierFormValues = z.infer<typeof supplierSchema>;

const LOCAL_STORAGE_KEY = 'global-transaction-date';

export default function PurchasesPage() {
  const { purchases, addPurchase, updatePurchase, deletePurchase } = usePurchases();
  const { suppliers, addSupplier, isLoaded: suppliersLoaded } = useSuppliers();
  const { products, isLoaded: productsLoaded } = useProducts();
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isEditCalendarOpen, setIsEditCalendarOpen] = useState(false);
  const [purchaseToEdit, setPurchaseToEdit] = useState<Purchase | null>(null);
  const [purchaseToDelete, setPurchaseToDelete] = useState<Purchase | null>(null);
  const [lastFocused, setLastFocused] = useState<'quantity' | 'amount'>('quantity');

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  let defaultDate: Date;
  if (isClient) {
    const storedDate = localStorage.getItem(LOCAL_STORAGE_KEY);
    defaultDate = storedDate ? new Date(storedDate) : new Date();
  } else {
    defaultDate = new Date();
  }

  const { register, handleSubmit, reset, setValue, control, watch, formState: { errors } } = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      items: [{ productId: '', quantity: 0, costPerUnit: 0, totalCost: 0 }],
      expenses: 0,
      paymentMethod: 'On Credit',
      date: defaultDate,
    }
  });
  
  const { 
      control: controlEdit, 
      handleSubmit: handleSubmitEdit, 
      register: registerEdit,
      reset: resetEdit, 
      watch: watchEdit,
      setValue: setEditValue,
      formState: { errors: editErrors }
  } = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseSchema),
  });
  
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const { fields: editFields, append: appendEdit, remove: removeEdit } = useFieldArray({ control: controlEdit, name: 'items' });

  useEffect(() => {
    if (purchaseToEdit) {
      resetEdit({
        supplierId: purchaseToEdit.supplierId,
        date: new Date(purchaseToEdit.timestamp!),
        expenses: purchaseToEdit.expenses || 0,
        notes: purchaseToEdit.notes || '',
        items: purchaseToEdit.items.map(item => ({...item})),
        paymentMethod: purchaseToEdit.paymentMethod || 'On Credit',
        paidAmount: purchaseToEdit.paidAmount || 0,
      });
    }
  }, [purchaseToEdit, resetEdit]);

  const watchedItems = watch('items');
  const watchedEditItems = watchEdit('items');
  const selectedDate = watch('date');
  const watchedSupplierId = watch('supplierId');
  const watchedPaymentMethod = watch('paymentMethod');

  const { balance: supplierBalance, isLoaded: balanceLoaded } = useSupplierBalance(watchedSupplierId || null);

  useEffect(() => {
    if (selectedDate && typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY, selectedDate.toISOString());
    }
  }, [selectedDate]);

  const totalCost = useMemo(() => {
    if (!watchedItems) return 0;
    return watchedItems.reduce((sum, item) => sum + (item.totalCost || 0), 0);
  }, [watchedItems]);

  const totalEditCost = useMemo(() => {
    if (!watchedEditItems) return 0;
    return watchedEditItems.reduce((sum, item) => sum + (item.totalCost || 0), 0);
  }, [watchedEditItems]);

  const {
    register: registerSupplier,
    handleSubmit: handleSubmitSupplier,
    reset: resetSupplier,
    formState: { errors: supplierErrors }
  } = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema)
  });
  
  useEffect(() => {
    if (fields.length === 0) {
        append({ productId: '', quantity: 0, costPerUnit: 0, totalCost: 0 });
    }
  }, [fields.length, append]);
  
    const handleProductChange = (index: number, productId: string) => {
        const product = products.find(p => p.id === productId);
        if (product) {
            const lastPurchaseOfProduct = purchases
                .filter(p => p.items.some(item => item.productId === productId))
                .sort((a,b) => new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime())[0];
            
            let lastPrice = product.purchasePrice || 0;
            if(lastPurchaseOfProduct) {
                const lastItem = lastPurchaseOfProduct.items.find(item => item.productId === productId);
                if(lastItem) {
                    lastPrice = lastItem.costPerUnit;
                }
            }
            
            setValue(`items.${index}.costPerUnit`, lastPrice, { shouldValidate: true });
            const quantity = watch(`items.${index}.quantity`);
            if (quantity > 0) {
                setValue(`items.${index}.totalCost`, quantity * lastPrice, { shouldValidate: true });
            }
        }
    };
    
    const handleQuantityChange = (index: number, quantity: number) => {
        if (lastFocused !== 'quantity') return;
        const costPerUnit = watch(`items.${index}.costPerUnit`);
        setValue(`items.${index}.quantity`, quantity, { shouldValidate: true });
        if (costPerUnit > 0) {
            setValue(`items.${index}.totalCost`, quantity * costPerUnit, { shouldValidate: true });
        }
    }
    
    const handleTotalCostChange = (index: number, cost: number) => {
        if (lastFocused !== 'amount') return;
        const costPerUnit = watch(`items.${index}.costPerUnit`);
        setValue(`items.${index}.totalCost`, cost, { shouldValidate: true });
        if (costPerUnit > 0) {
            setValue(`items.${index}.quantity`, cost / costPerUnit, { shouldValidate: true });
        }
    }

  const handleCostPerUnitChange = (index: number, cost: number) => {
    const quantity = watch(`items.${index}.quantity`);
    setValue(`items.${index}.totalCost`, quantity * cost, { shouldValidate: true });
  }

  const onPurchaseSubmit: SubmitHandler<PurchaseFormValues> = (data) => {
    const supplier = suppliers.find(s => s.id === data.supplierId);
    if (!supplier) return;

    const itemsWithNames = data.items.map(item => {
        const product = products.find(p => p.id === item.productId);
        return {
            ...item,
            productName: product?.name || 'Unknown Product',
        }
    });

    addPurchase({
      ...data,
      items: itemsWithNames,
      supplier: supplier.name, 
      timestamp: data.date.toISOString(),
      totalCost,
    });
    toast({
      title: 'Purchase Recorded',
      description: `Delivery from ${supplier.name} has been logged.`,
    });
    const lastDate = watch('date');
    reset({
        supplierId: '',
        items: [{ productId: '', quantity: 0, costPerUnit: 0, totalCost: 0 }],
        date: lastDate,
        expenses: 0,
        notes: '',
        paymentMethod: 'On Credit',
        paidAmount: 0
    });
  };
  
  const onEditSubmit: SubmitHandler<PurchaseFormValues> = (data) => {
      if (!purchaseToEdit) return;
      const supplier = suppliers.find(s => s.id === data.supplierId);
      if (!supplier) return;
  
      const itemsWithNames = data.items.map(item => {
          const product = products.find(p => p.id === item.productId);
          return {
              ...item,
              productName: product?.name || 'Unknown Product',
          }
      });
  
      const updatedPurchase = {
        ...data,
        items: itemsWithNames,
        supplier: supplier.name,
        timestamp: data.date.toISOString(),
        totalCost: totalEditCost,
      };
      
      updatePurchase(purchaseToEdit.id!, purchaseToEdit, updatedPurchase);
      
      toast({
        title: 'Purchase Updated',
        description: `The purchase from ${supplier.name} has been updated.`,
      });
      setPurchaseToEdit(null);
  }
  
  const onSupplierSubmit: SubmitHandler<SupplierFormValues> = useCallback((data) => {
    addSupplier(data);
    toast({
        title: 'Supplier Added',
        description: `${data.name} has been added. You can now select them from the list.`,
    });
    resetSupplier();
    setIsAddSupplierOpen(false);
  }, [addSupplier, toast, resetSupplier]);

  const handleDeletePurchase = useCallback(() => {
    if (!purchaseToDelete) return;
    deletePurchase(purchaseToDelete);
    toast({
        title: 'Purchase Deleted',
        description: 'The purchase record has been removed.',
    });
    setPurchaseToDelete(null);
  }, [purchaseToDelete, deletePurchase, toast]);


  return (
    <>
    <div className="p-4 md:p-8 grid gap-8 lg:grid-cols-3">
     <form onSubmit={handleSubmit(onPurchaseSubmit)} className="lg:col-span-3 grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <Card>
           <CardHeader className="flex flex-row justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2"><Truck /> New Purchase</CardTitle>
                <CardDescription>Select products and enter quantities to record a new delivery.</CardDescription>
              </div>
              <Button asChild variant="outline">
                  <Link href="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" /> Go to Dashboard</Link>
              </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                {fields.map((field, index) => (
                    <Card key={field.id} className="p-4 relative bg-muted/40">
                         <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            <div className="md:col-span-2 space-y-2">
                                <Label>Product</Label>
                                <Controller
                                  name={`items.${index}.productId`}
                                  control={control}
                                  render={({ field }) => (
                                     <Select onValueChange={(value) => {
                                        field.onChange(value);
                                        handleProductChange(index, value);
                                    }} value={field.value} defaultValue="">
                                      <SelectTrigger><SelectValue placeholder="Select a product" /></SelectTrigger>
                                      <SelectContent>
                                        {productsLoaded ? products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>) : <SelectItem value="loading" disabled>Loading...</SelectItem>}
                                      </SelectContent>
                                    </Select>
                                  )}
                                />
                                {errors.items?.[index]?.productId && <p className="text-sm text-destructive">{errors.items?.[index]?.productId?.message}</p>}
                            </div>
                             <div className="space-y-2">
                              <Label>Quantity</Label>
                              <Input type="number" {...register(`items.${index}.quantity`)} placeholder="e.g., 5000" step="0.01" onFocus={() => setLastFocused('quantity')} onChange={(e) => handleQuantityChange(index, +e.target.value)} />
                               {errors.items?.[index]?.quantity && <p className="text-sm text-destructive">{errors.items?.[index]?.quantity?.message}</p>}
                            </div>
                            <div className="space-y-2">
                              <Label>Total Cost</Label>
                              <Input type="number" {...register(`items.${index}.totalCost`)} placeholder="e.g., 250" step="0.01" onFocus={() => setLastFocused('amount')} onChange={(e) => handleTotalCostChange(index, +e.target.value)} />
                               {errors.items?.[index]?.totalCost && <p className="text-sm text-destructive">{errors.items?.[index]?.totalCost?.message}</p>}
                            </div>
                            <div className="space-y-2">
                              <Label>Cost / Unit</Label>
                              <Input type="number" {...register(`items.${index}.costPerUnit`)} placeholder="e.g., 250" step="0.01" onChange={(e) => handleCostPerUnitChange(index, +e.target.value)} />
                               {errors.items?.[index]?.costPerUnit && <p className="text-sm text-destructive">{errors.items?.[index]?.costPerUnit?.message}</p>}
                            </div>
                         </div>
                        <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 w-6 h-6" onClick={() => remove(index)}><Trash2 className="w-4 h-4" /></Button>
                    </Card>
                ))}
            </div>
            {errors.items && typeof errors.items !== 'undefined' && 'message' in errors.items && <p className="text-sm text-destructive">{errors.items.message}</p>}
             <Button type="button" variant="outline" onClick={() => append({ productId: '', quantity: 0, costPerUnit: 0, totalCost: 0 })} className="w-full"><PlusCircle /> Add Another Product</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-1 space-y-8">
        <Card>
            <CardHeader>
                <CardTitle>Supplier & Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="space-y-2">
                    <Label htmlFor="supplierId">Supplier</Label>
                    <div className="flex items-center gap-2">
                        <Controller
                          name="supplierId"
                          control={control}
                          render={({ field }) => (
                             <Select onValueChange={field.onChange} value={field.value} defaultValue="">
                              <SelectTrigger>
                                <SelectValue placeholder="Select a supplier" />
                              </SelectTrigger>
                              <SelectContent>
                                 {suppliersLoaded ? suppliers.map(s => (
                                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                )) : <SelectItem value="loading" disabled>Loading...</SelectItem>}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        <Button type="button" variant="outline" size="icon" onClick={() => setIsAddSupplierOpen(true)} title="Add new supplier">
                            <PlusCircle className="h-4 w-4" />
                        </Button>
                    </div>
                    {errors.supplierId && <p className="text-sm text-destructive">{errors.supplierId.message}</p>}
                  </div>

                   <div className="space-y-2">
                      <Label>Date</Label>
                      {isClient && <Controller
                        name="date"
                        control={control}
                        render={({ field }) => (
                          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={(date) => {
                                  field.onChange(date);
                                  if (date) setIsCalendarOpen(false);
                                }}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        )}
                      />}
                      {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Purchase Notes</Label>
                      <Textarea id="notes" {...register('notes')} placeholder="e.g., Delivery vehicle number, etc." />
                    </div>
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>Purchase Summary</CardTitle>
            </CardHeader>
             <CardContent className="space-y-4">
                {watchedSupplierId && (
                  <Card className="bg-muted/40 p-4">
                    <CardHeader className="p-0 pb-2">
                      <CardTitle className="text-md">Supplier Account</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 text-sm space-y-2">
                       {balanceLoaded ? (
                         <>
                          <div className='flex justify-between'>
                            <span className='text-muted-foreground'>Previous Balance:</span>
                            <span className='font-medium'>PKR {supplierBalance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                          </div>
                          <Separator/>
                           <div className='flex justify-between font-bold text-base'>
                            <span>New Balance:</span>
                            <span className={cn(supplierBalance + totalCost >= 0 ? 'text-green-600' : 'text-destructive' )}>PKR {(supplierBalance + totalCost - (watchedPaymentMethod !== 'On Credit' ? (watch('paidAmount') || 0) : 0)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                          </div>
                         </>
                       ) : <p>Loading balance...</p>}
                    </CardContent>
                  </Card>
                )}
                 <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between items-center text-lg">
                        <h3 className="font-semibold">Items Total Cost</h3>
                        <p className="font-semibold text-primary">PKR {totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expenses">Other Expenses (Not credited to supplier)</Label>
                      <Input id="expenses" type="number" {...register('expenses')} placeholder="e.g., transportation" step="0.01" />
                    </div>
                     <div className="space-y-2">
                        <Label>Payment Method</Label>
                        <Controller name="paymentMethod" control={control} render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger><SelectValue placeholder="Select payment method" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="On Credit"><CreditCard className="inline-block mr-2"/>On Credit</SelectItem>
                                    <SelectItem value="Cash"><Wallet className="inline-block mr-2"/>Cash</SelectItem>
                                    <SelectItem value="Card"><CreditCard className="inline-block mr-2"/>Card</SelectItem>
                                    <SelectItem value="Mobile"><Smartphone className="inline-block mr-2"/>Mobile</SelectItem>
                                </SelectContent>
                            </Select>
                        )}/>
                    </div>
                    {watchedPaymentMethod !== 'On Credit' && (
                        <div className="space-y-2">
                            <Label htmlFor="paidAmount">Amount Paid to Supplier</Label>
                            <Input id="paidAmount" type="number" {...register('paidAmount')} placeholder="e.g., 50000" step="0.01" />
                        </div>
                    )}
                    <Separator/>
                    <div className="flex justify-between items-center text-xl font-bold">
                        <span>Amount Credited to Supplier</span>
                         <span>PKR {totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                 </div>
             </CardContent>
            <CardFooter>
                 <Button type="submit" className="w-full">Record Purchase</Button>
            </CardFooter>
        </Card>
      </div>
      </form>
       <div className="lg:col-span-3">
        <Card>
          <CardHeader className="flex flex-row justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart /> Purchase History
              </CardTitle>
              <CardDescription>
                A record of all incoming stock and product deliveries.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {purchases.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead className="text-right">Expenses</TableHead>
                    <TableHead className="text-right">Total Cost</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.map(p => {
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium whitespace-nowrap">{format(new Date(p.timestamp!), 'PP')}</TableCell>
                        <TableCell>{p.supplier}</TableCell>
                        <TableCell>
                          <ul className="list-disc pl-4 text-xs">
                           {p.items.map((item, index) => (
                             <li key={index}>
                                {item.quantity.toLocaleString()} x {item.productName} @ {item.costPerUnit.toFixed(2)}
                             </li>
                           ))}
                          </ul>
                        </TableCell>
                        <TableCell className="text-right font-mono">PKR {(p.expenses || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        <TableCell className="text-right font-mono font-semibold">PKR {p.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        <TableCell className="text-center space-x-0">
                            <Button variant="ghost" size="icon" title="Edit" onClick={() => setPurchaseToEdit(p)}>
                                <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" title="Delete" className="text-destructive hover:text-destructive" onClick={() => setPurchaseToDelete(p)}>
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                <Package className="w-16 h-16" />
                <h3 className="text-xl font-semibold">No Purchases Recorded</h3>
                <p>Use the form to log your first product delivery.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
    
    <Dialog open={isAddSupplierOpen} onOpenChange={setIsAddSupplierOpen}>
        <DialogContent>
            <form onSubmit={handleSubmitSupplier(onSupplierSubmit)}>
                <DialogHeader>
                    <DialogTitle>Add New Supplier</DialogTitle>
                    <DialogDescription>
                        Enter the details for the new supplier.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="new-supplier-name">Supplier Name</Label>
                        <Input id="new-supplier-name" {...registerSupplier('name')} placeholder="e.g., Shell Pakistan" />
                        {supplierErrors.name && <p className="text-sm text-destructive">{supplierErrors.name.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="new-supplier-contact">Contact (Optional)</Label>
                        <Input id="new-supplier-contact" {...registerSupplier('contact')} placeholder="e.g., 0300-1122333" />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsAddSupplierOpen(false)}>Cancel</Button>
                    <Button type="submit">Save Supplier</Button>
                </DialogFooter>
            </form>
        </DialogContent>
    </Dialog>
    
    <Dialog open={!!purchaseToEdit} onOpenChange={(isOpen) => !isOpen && setPurchaseToEdit(null)}>
        <DialogContent className="max-w-4xl">
            <form onSubmit={handleSubmitEdit(onEditSubmit)}>
                <DialogHeader>
                    <DialogTitle>Edit Purchase Invoice</DialogTitle>
                    <DialogDescription>
                        Update the details for this purchase. Inventory will be adjusted accordingly.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-6">
                    <div className="grid lg:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Supplier</Label>
                            <Controller name="supplierId" control={controlEdit} render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        {suppliersLoaded ? suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>) : <SelectItem value="loading" disabled>Loading...</SelectItem>}
                                    </SelectContent>
                                </Select>
                            )}/>
                            {editErrors.supplierId && <p className="text-sm text-destructive">{editErrors.supplierId.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label>Date</Label>
                            {isClient && <Controller name="date" control={controlEdit} render={({ field }) => (
                                <Popover open={isEditCalendarOpen} onOpenChange={setIsEditCalendarOpen}>
                                    <PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}</Button></PopoverTrigger>
                                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={(date) => {field.onChange(date); if (date) setIsEditCalendarOpen(false);}} /></PopoverContent>
                                </Popover>
                            )}/>}
                            {editErrors.date && <p className="text-sm text-destructive">{editErrors.date.message}</p>}
                        </div>
                         <div className="space-y-2">
                            <Label>Purchase Notes</Label>
                            <Textarea {...registerEdit('notes')} />
                        </div>
                        <div className="space-y-2">
                            <Label>Purchase Expenses</Label>
                            <Input type="number" {...registerEdit('expenses')} />
                        </div>
                    </div>
                    <Separator/>
                    <h4 className="text-lg font-medium">Items</h4>
                    <div className="space-y-4">
                        {editFields.map((field, index) => (
                             <Card key={field.id} className="p-4 relative bg-muted/40">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="md:col-span-2 space-y-2">
                                        <Label>Product</Label>
                                        <Controller name={`items.${index}.productId`} control={controlEdit} render={({ field }) => (
                                            <Select onValueChange={(val) => { field.onChange(val); }} value={field.value}>
                                                <SelectTrigger><SelectValue/></SelectTrigger>
                                                <SelectContent>
                                                    {productsLoaded ? products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>) : <SelectItem value="loading" disabled>Loading...</SelectItem>}
                                                </SelectContent>
                                            </Select>
                                        )}/>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Quantity</Label>
                                        <Input type="number" {...registerEdit(`items.${index}.quantity`)} step="0.01" onChange={(e) => {}} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Cost / Unit</Label>
                                        <Input type="number" {...registerEdit(`items.${index}.costPerUnit`)} step="0.01" onChange={(e) => {}} />
                                    </div>
                                </div>
                                <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 w-6 h-6" onClick={() => removeEdit(index)}><Trash2 className="w-4 h-4" /></Button>
                            </Card>
                        ))}
                    </div>
                    <Button type="button" variant="outline" onClick={() => appendEdit({ productId: '', quantity: 0, costPerUnit: 0, totalCost: 0 })}><PlusCircle /> Add Another Product</Button>
                </div>
                <DialogFooter>
                    <div className="w-full flex justify-between items-center">
                        <span className="text-xl font-bold">Total: PKR {totalEditCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        <div>
                            <Button type="button" variant="outline" onClick={() => setPurchaseToEdit(null)}>Cancel</Button>
                            <Button type="submit" className="ml-2">Save Changes</Button>
                        </div>
                    </div>
                </DialogFooter>
            </form>
        </DialogContent>
    </Dialog>

    <AlertDialog open={!!purchaseToDelete} onOpenChange={(isOpen) => !isOpen && setPurchaseToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle/>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the purchase from <br />
              <strong className="font-medium text-foreground">{purchaseToDelete?.supplier}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePurchase} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Yes, delete entry
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

