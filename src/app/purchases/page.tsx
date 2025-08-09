
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
import { ShoppingCart, Package, Truck, Calendar as CalendarIcon, PlusCircle, Trash2, LayoutDashboard, UserPlus, FileText } from 'lucide-react';
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
import { useSupplierBalance } from '@/hooks/use-supplier-balance';
import { useBankAccounts } from '@/hooks/use-bank-accounts';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';


const purchaseItemSchema = z.object({
  productId: z.string().min(1, 'Product is required.'),
  productName: z.string(),
  unit: z.string(),
  quantity: z.coerce.number().min(0.01, 'Quantity must be positive.'),
  costPerUnit: z.coerce.number().min(0, "Cost must be non-negative."),
  totalCost: z.coerce.number().min(0.01, 'Cost must be positive.'),
  bonus: z.coerce.number().default(0),
  discount: z.coerce.number().default(0),
});

const purchaseSchema = z.object({
  supplierId: z.string().min(1, 'Please select a supplier.'),
  date: z.date({ required_error: "A date is required."}),
  orderDeliveryDate: z.date().optional(),
  expenses: z.coerce.number().optional(),
  notes: z.string().optional(),
  items: z.array(purchaseItemSchema).min(1, 'At least one item is required.'),
  paymentMethod: z.enum(['On Credit', 'Cash', 'Card', 'Mobile']).default('On Credit'),
  paidAmount: z.coerce.number().optional(),
  bankAccountId: z.string().optional(),
  referenceNo: z.string().optional(),
});

type PurchaseFormValues = z.infer<typeof purchaseSchema>;

const supplierSchema = z.object({
  name: z.string().min(1, 'Supplier name is required'),
  contact: z.string().optional(),
});
type SupplierFormValues = z.infer<typeof supplierSchema>;

const LOCAL_STORAGE_KEY = 'global-transaction-date';

export default function PurchasesPage() {
  const { addPurchase } = usePurchases();
  const { suppliers, addSupplier, isLoaded: suppliersLoaded } = useSuppliers();
  const { products, isLoaded: productsLoaded } = useProducts();
  const { bankAccounts, isLoaded: bankAccountsLoaded } = useBankAccounts();
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const [lastFocused, setLastFocused] = useState<'quantity' | 'total'>('quantity');
  
  const [currentItem, setCurrentItem] = useState({ productId: '', quantity: '', costPerUnit: '', bonus: '', discountAmount: '', discountPercent: '', totalValue: '' });

  useEffect(() => {
    setIsClient(true);
  }, []);

  const { register, handleSubmit, reset, setValue, control, watch, getValues } = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      items: [],
      expenses: 0,
      paymentMethod: 'On Credit',
    }
  });

  useEffect(() => {
    if (isClient) {
      const storedDate = localStorage.getItem(LOCAL_STORAGE_KEY);
      const defaultDate = storedDate ? new Date(storedDate) : new Date();
      setValue('date', defaultDate);
      setValue('orderDeliveryDate', defaultDate);
    }
  }, [setValue, isClient]);
  
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  useEffect(() => {
    const selectedProduct = products.find(p => p.id === currentItem.productId);
    const quantity = parseFloat(currentItem.quantity) || 0;
    const price = parseFloat(currentItem.costPerUnit) || 0;
    const discountAmount = parseFloat(currentItem.discountAmount) || 0;
    const totalValue = parseFloat(currentItem.totalValue) || 0;
    
    if (lastFocused === 'quantity') {
        let total = quantity * price;
        if (discountAmount > 0) {
            total -= discountAmount;
        }
        setCurrentItem(prev => ({...prev, totalValue: total > 0 ? total.toFixed(2) : ''}));
    } else if (lastFocused === 'total' && price > 0) {
        let calculatedQty = totalValue / price;
        setCurrentItem(prev => ({...prev, quantity: calculatedQty > 0 ? calculatedQty.toFixed(2) : ''}));
    }

  }, [currentItem.quantity, currentItem.costPerUnit, currentItem.discountAmount, currentItem.totalValue, lastFocused, products]);

  const watchedItems = watch('items');
  const watchedSupplierId = watch('supplierId');
  
  const { balance: supplierBalance } = useSupplierBalance(watchedSupplierId || null);

  const {
    register: registerSupplier,
    handleSubmit: handleSubmitSupplier,
    reset: resetSupplier,
    formState: { errors: supplierErrors }
  } = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema)
  });
    
    const handleCurrentProductChange = (productId: string) => {
        const product = products.find(p => p.id === productId);
        if(product) {
            setCurrentItem(prev => ({...prev, productId, costPerUnit: product.purchasePrice?.toString() || '0' }));
        }
    }
  
    const handleAddItemToPurchase = () => {
        const product = products.find(p => p.id === currentItem.productId);
        if (!product) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please select a product.'});
            return;
        }
        const quantity = parseFloat(currentItem.quantity);
        if (!quantity || quantity <= 0) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please enter a valid quantity.'});
            return;
        }
    
        const costPerUnit = parseFloat(currentItem.costPerUnit);
        const discount = parseFloat(currentItem.discountAmount) || 0;
        const totalCost = parseFloat(currentItem.totalValue);
    
        append({
            productId: product.id!,
            productName: product.name,
            unit: product.mainUnit,
            quantity: quantity,
            costPerUnit: costPerUnit,
            totalCost: totalCost,
            discount: discount,
            bonus: parseFloat(currentItem.bonus) || 0,
        });
        
        // Reset temporary item form
        setCurrentItem({ productId: '', quantity: '', costPerUnit: '', bonus: '', discountAmount: '', discountPercent: '', totalValue: '' });
    }
  
    const { subTotal, grandTotal } = useMemo(() => {
        const sub = watchedItems.reduce((sum, item) => sum + (item.totalCost || 0), 0);
        const expenses = Number(getValues('expenses')) || 0;
        const grand = sub + expenses;
        return { subTotal: sub, grandTotal: grand };
      }, [watchedItems, getValues]);

  const onPurchaseSubmit: SubmitHandler<PurchaseFormValues> = (data) => {
    const supplier = suppliers.find(s => s.id === data.supplierId);
    if (!supplier) return;

    addPurchase({
      ...data,
      supplier: supplier.name, 
      totalCost: grandTotal,
    });
    toast({
      title: 'Purchase Recorded',
      description: `Delivery from ${supplier.name} has been logged.`,
    });
    
    const defaultDate = isClient && localStorage.getItem(LOCAL_STORAGE_KEY) ? new Date(localStorage.getItem(LOCAL_STORAGE_KEY)!) : new Date();
    reset({
        supplierId: '',
        items: [],
        date: defaultDate,
        orderDeliveryDate: defaultDate,
        expenses: 0,
        notes: '',
        paymentMethod: 'On Credit',
        paidAmount: 0,
        bankAccountId: '',
        referenceNo: '',
    });
  };
  
  const onSupplierSubmit: SubmitHandler<SupplierFormValues> = useCallback((data) => {
    addSupplier(data);
    toast({
        title: 'Supplier Added',
        description: `${data.name} has been added. You can now select them for purchases.`,
    });
    resetSupplier();
    setIsAddSupplierOpen(false);
  }, [addSupplier, toast, resetSupplier]);


  if (!isClient) {
      return null;
  }

  return (
    <>
    <div className="p-4 md:p-8">
     <form onSubmit={handleSubmit(onPurchaseSubmit)}>
     <Card>
            <CardHeader>
                <div className='flex justify-between items-center'>
                    <CardTitle className="flex items-center gap-2"><Truck /> New Purchase Invoice</CardTitle>
                    <CardDescription>Date: {format(new Date(), 'dd-MM-yyyy')}</CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <div className="p-4 rounded-lg bg-muted/50 border space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-1">
                            <Label>Product</Label>
                            <Select onValueChange={handleCurrentProductChange} value={currentItem.productId}>
                                <SelectTrigger><SelectValue placeholder="Select Product" /></SelectTrigger>
                                <SelectContent>
                                    {productsLoaded ? products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>) : <SelectItem value='loading' disabled>Loading...</SelectItem>}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label>Unit</Label>
                            <Input value={products.find(p => p.id === currentItem.productId)?.mainUnit || ''} disabled />
                        </div>
                         <div className="space-y-1">
                            <Label>Enter Qty</Label>
                            <Input type="number" placeholder="0" value={currentItem.quantity} onFocus={() => setLastFocused('quantity')} onChange={e => setCurrentItem(prev => ({...prev, quantity: e.target.value}))}/>
                        </div>
                        <div className="space-y-1">
                            <Label>Purchase At</Label>
                            <Input type="number" placeholder="0.00" value={currentItem.costPerUnit} onChange={e => setCurrentItem(prev => ({...prev, costPerUnit: e.target.value}))} />
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                         <div className="space-y-1">
                            <Label>Bonus</Label>
                            <Input type="number" placeholder="bonus qty" value={currentItem.bonus} onChange={e => setCurrentItem(prev => ({...prev, bonus: e.target.value}))}/>
                        </div>
                        <div className="space-y-1">
                            <Label>Discount (Amount)</Label>
                            <Input type="number" placeholder="RS 0" value={currentItem.discountAmount} onChange={e => setCurrentItem(prev => ({...prev, discountAmount: e.target.value}))}/>
                        </div>
                        <div className="space-y-1">
                            <Label>Total Value</Label>
                            <Input type="number" placeholder="0.00" value={currentItem.totalValue} onFocus={() => setLastFocused('total')} onChange={e => setCurrentItem(prev => ({...prev, totalValue: e.target.value}))}/>
                        </div>
                        <Button type="button" onClick={handleAddItemToPurchase}><PlusCircle/> Add To Purchase</Button>
                    </div>
                </div>

                <div className="mt-6 border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Product</TableHead>
                                <TableHead>Unit</TableHead>
                                <TableHead>Purchase Price</TableHead>
                                <TableHead>Purchase Qty</TableHead>
                                <TableHead>Bonus</TableHead>
                                <TableHead>Discount</TableHead>
                                <TableHead>T.Price</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {fields.map((field, index) => (
                                <TableRow key={field.id}>
                                    <TableCell>{field.productName}</TableCell>
                                    <TableCell>{field.unit}</TableCell>
                                    <TableCell>{field.costPerUnit.toFixed(2)}</TableCell>
                                    <TableCell>{field.quantity}</TableCell>
                                    <TableCell>{field.bonus}</TableCell>
                                    <TableCell>{field.discount.toFixed(2)}</TableCell>
                                    <TableCell>{field.totalCost.toFixed(2)}</TableCell>
                                    <TableCell>
                                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                            <Trash2 className="text-destructive w-4 h-4"/>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <div className="p-4 text-right space-y-2">
                        <div className="flex justify-end items-center gap-4">
                            <Label>Extra Expenses:</Label>
                            <Input className="w-24" placeholder="RS 0" {...register('expenses')} />
                        </div>
                         <div className="flex justify-end items-center gap-4 font-bold text-xl">
                            <Label>Grand Total:</Label>
                            <span>{grandTotal.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
                
                <Separator className="my-6" />

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
                     <div className="space-y-1">
                        <Label>Supplier</Label>
                         <div className="flex items-center gap-2">
                            <Controller name="supplierId" control={control} render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger><SelectValue placeholder="Select Supplier" /></SelectTrigger>
                                <SelectContent>
                                    {suppliersLoaded ? suppliers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>) : <SelectItem value="loading" disabled>Loading...</SelectItem>}
                                </SelectContent>
                                </Select>
                            )} />
                             <Button type="button" variant="outline" size="icon" onClick={() => setIsAddSupplierOpen(true)} title="Add new supplier"><UserPlus /></Button>
                         </div>
                    </div>
                     <div className="space-y-1">
                        <Label>Old Balance</Label>
                        <Input disabled value={supplierBalance.toFixed(2)} />
                    </div>
                    <div className="space-y-1">
                        <Label>Purchase Date</Label>
                         <Controller name="date" control={control} render={({ field }) => (
                            <Popover>
                                <PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}</Button></PopoverTrigger>
                                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={(d) => {if (d) field.onChange(d);}} initialFocus /></PopoverContent>
                            </Popover>
                        )}/>
                    </div>
                    <div className="space-y-1">
                        <Label>Order Delivery Date</Label>
                         <Controller name="orderDeliveryDate" control={control} render={({ field }) => (
                            <Popover>
                                <PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}</Button></PopoverTrigger>
                                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={(d) => {if (d) field.onChange(d);}} initialFocus /></PopoverContent>
                            </Popover>
                        )}/>
                    </div>
                    <div className="space-y-1">
                        <Label>Paid (Amount)</Label>
                        <div className="flex gap-2">
                             <Input type="number" placeholder="RS 0" {...register('paidAmount')} />
                             <Controller name="bankAccountId" control={control} render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger><SelectValue placeholder="@Bank" /></SelectTrigger>
                                    <SelectContent>
                                        {bankAccountsLoaded ? bankAccounts.map(b => <SelectItem key={b.id} value={b.id}>{b.bankName}</SelectItem>) : <SelectItem value="loading" disabled>Loading...</SelectItem>}
                                    </SelectContent>
                                </Select>
                             )}/>
                        </div>
                    </div>
                    <div className="space-y-1 lg:col-span-2">
                        <Label>Reference No.</Label>
                        <Input placeholder="e.g. PO-12345" {...register('referenceNo')} />
                    </div>
                    <div className="space-y-1 lg:col-span-2">
                        <Label>Purchase Description</Label>
                        <Input placeholder="type purchase description" {...register('notes')} />
                    </div>
                </div>

            </CardContent>
            <CardFooter className="gap-2">
                 <Button type="submit" size="lg">Save/Submit</Button>
                 <Button type="button" variant="outline" size="lg" onClick={() => reset()}>Discard/Reset</Button>
            </CardFooter>
        </Card>
      </form>
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
    </>
  );
}

    

    