
'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useForm, type SubmitHandler, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ShoppingCart, Truck, Calendar as CalendarIcon, PlusCircle, Trash2, UserPlus, ChevronsUpDown, Check } from 'lucide-react';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Product } from '@/lib/types';
import { ProductSelection } from '../transactions/_components/product-selection';
import { Textarea } from '@/components/ui/textarea';


const purchaseItemSchema = z.object({
  productId: z.string().min(1, 'Product is required.'),
  productName: z.string(),
  unit: z.string(),
  quantity: z.coerce.number().min(0.01, 'Quantity must be positive.'),
  costPerUnit: z.coerce.number().min(0, "Cost must be non-negative."),
  totalCost: z.coerce.number().min(0.01, 'Cost must be positive.'),
  discount: z.coerce.number().default(0),
});

const purchaseSchema = z.object({
  supplierId: z.string().min(1, 'Please select a supplier.'),
  date: z.date({ required_error: "A date is required."}),
  expenses: z.coerce.number().optional().default(0),
  notes: z.string().optional(),
  items: z.array(purchaseItemSchema).min(1, 'At least one item is required.'),
  paidAmount: z.coerce.number().optional().default(0),
  bankAccountId: z.string().optional(),
  referenceNo: z.string().optional(),
});

type PurchaseFormValues = z.infer<typeof purchaseSchema>;

const supplierSchema = z.object({
  name: z.string().min(1, 'Supplier name is required'),
  contact: z.string().optional(),
});
type SupplierFormValues = z.infer<typeof supplierSchema>;

const defaultItemState = {
    product: null as Product | null,
    unit: '',
    quantity: 1,
    price: 0,
    totalAmount: 0,
};

export default function PurchasesPage() {
  const { purchases, addPurchase } = usePurchases();
  const { suppliers, addSupplier, isLoaded: suppliersLoaded } = useSuppliers();
  const { products, isLoaded: productsLoaded } = useProducts();
  const { bankAccounts, isLoaded: bankAccountsLoaded } = useBankAccounts();
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const productSelectionRef = useRef<HTMLButtonElement>(null);
  const [currentItem, setCurrentItem] = useState(defaultItemState);

  
  const [supplierSearch, setSupplierSearch] = useState('');
  const [isSupplierPopoverOpen, setIsSupplierPopoverOpen] = useState(false);


  useEffect(() => {
    setIsClient(true);
  }, []);
  
  useEffect(() => {
    const { quantity, price } = currentItem;
    setCurrentItem(prev => ({...prev, totalAmount: quantity * price}));
  }, [currentItem.quantity, currentItem.price]);

  const { register, handleSubmit, reset, setValue, control, watch, getValues } = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      items: [],
      expenses: 0,
      paidAmount: 0,
      bankAccountId: '',
      referenceNo: '',
      notes: '',
      date: new Date(),
    }
  });
  
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

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
    
  const handleProductSelect = useCallback((product: Product) => {
    if (!product || !productsLoaded) return;
    
    // Find the last purchase price for this product
    const lastPurchaseOfProduct = purchases
        .flatMap(p => p.items)
        .filter(item => item.productId === product.id)
        .pop(); // Assumes purchases are sorted by date, last one is the latest
    
    const lastPrice = lastPurchaseOfProduct ? lastPurchaseOfProduct.costPerUnit : product.purchasePrice;

    setCurrentItem(prev => ({
        ...prev,
        product,
        unit: product.mainUnit,
        price: lastPrice || 0,
    }));
  }, [productsLoaded, purchases]);

  const handleUnitChange = (unit: string) => {
    if (!currentItem.product) return;
    const product = currentItem.product;
    const isMainUnit = unit === product.mainUnit;
    
    let newPrice = 0;
    if(isMainUnit) {
        newPrice = product.purchasePrice || 0;
    } else if (product.subUnit && unit === product.subUnit.name) {
        newPrice = product.subUnit.purchasePrice || (product.purchasePrice / product.subUnit.conversionRate) || 0;
    }

    setCurrentItem(prev => ({
      ...prev,
      unit: unit,
      price: newPrice,
    }));
  };
  
  const handleAddItemToPurchase = useCallback(() => {
    const { product, quantity, price, totalAmount } = currentItem;
    if (!product) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please select a product first.' });
        return;
    }
    
    if (quantity <= 0 || price <= 0) {
        toast({ variant: 'destructive', title: 'Error', description: 'Quantity and Price must be positive.' });
        return;
    }

    append({
        productId: product.id!,
        productName: product.name,
        unit: currentItem.unit || product.mainUnit,
        quantity: quantity,
        costPerUnit: price,
        totalCost: totalAmount,
        discount: 0,
    });

    setCurrentItem(defaultItemState); // Reset for next item
    productSelectionRef.current?.focus();
  }, [append, currentItem, toast]);
  
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
    
    reset({
        supplierId: '',
        items: [],
        date: new Date(),
        expenses: 0,
        notes: '',
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

  const filteredSuppliers = useMemo(() => {
    if (!suppliersLoaded) return [];
    if (!supplierSearch) return suppliers;
    return suppliers.filter(s => s.name.toLowerCase().includes(supplierSearch.toLowerCase()));
  }, [suppliers, supplierSearch, suppliersLoaded]);


  if (!isClient) {
      return null;
  }

  return (
    <>
    <div className="p-4 md:p-8">
     <form onSubmit={handleSubmit(onPurchaseSubmit)}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Add Items to Purchase</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                    <div className="lg:col-span-3 space-y-1">
                        <Label>Product</Label>
                        <ProductSelection onProductSelect={handleProductSelect} ref={productSelectionRef} selectedProduct={currentItem.product} />
                    </div>
                     <div className="space-y-1">
                        <Label>Unit</Label>
                         <Select 
                            value={currentItem.unit}
                            onValueChange={handleUnitChange}
                            disabled={!currentItem.product || !currentItem.product.subUnit}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Unit" />
                            </SelectTrigger>
                            <SelectContent>
                                {currentItem.product && <SelectItem value={currentItem.product.mainUnit}>{currentItem.product.mainUnit}</SelectItem>}
                                {currentItem.product?.subUnit && <SelectItem value={currentItem.product.subUnit.name}>{currentItem.product.subUnit.name}</SelectItem>}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <Label>Qty</Label>
                        <Input type="number" step="any" value={currentItem.quantity} onChange={e => setCurrentItem(p => ({...p, quantity: parseFloat(e.target.value) || 0}))} />
                    </div>
                    <div className="space-y-1">
                        <Label>Price</Label>
                        <Input type="number" step="any" value={currentItem.price} onChange={e => setCurrentItem(p => ({...p, price: parseFloat(e.target.value) || 0}))} />
                    </div>
                     <div className="space-y-1">
                        <Label>Total Amount</Label>
                        <Input type="number" step="any" value={currentItem.totalAmount} onChange={e => {
                            const total = parseFloat(e.target.value) || 0;
                            const price = currentItem.price;
                            const newQty = price > 0 ? total / price : 0;
                            setCurrentItem(p => ({...p, totalAmount: total, quantity: newQty }));
                        }} />
                    </div>
                    <div className="lg:col-span-3">
                         <Button type="button" onClick={handleAddItemToPurchase}><PlusCircle className="mr-2"/>Add to Purchase</Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Purchase Items</CardTitle></CardHeader>
                <CardContent>
                    <div className="border rounded-lg overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Product</TableHead>
                                <TableHead>Unit</TableHead>
                                <TableHead>Purchase Price</TableHead>
                                <TableHead>Purchase Qty</TableHead>
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
                                    <TableCell>
                                        <Input type="number" step="any" {...register(`items.${index}.costPerUnit`)} onChange={e => {
                                            const cost = parseFloat(e.target.value) || 0;
                                            const qty = getValues(`items.${index}.quantity`);
                                            setValue(`items.${index}.totalCost`, qty * cost, { shouldTouch: true });
                                        }}/>
                                    </TableCell>
                                    <TableCell>
                                        <Input type="number" step="any" {...register(`items.${index}.quantity`)} onChange={e => {
                                            const qty = parseFloat(e.target.value) || 0;
                                            const cost = getValues(`items.${index}.costPerUnit`);
                                            setValue(`items.${index}.totalCost`, qty * cost, { shouldTouch: true });
                                        }}/>
                                    </TableCell>
                                    <TableCell>
                                        <Input type="number" step="any" {...register(`items.${index}.discount`)}/>
                                    </TableCell>
                                    <TableCell>
                                        <Input type="number" step="any" {...register(`items.${index}.totalCost`)} onChange={e => {
                                            const total = parseFloat(e.target.value) || 0;
                                            const cost = getValues(`items.${index}.costPerUnit`);
                                            if (cost > 0) {
                                                setValue(`items.${index}.quantity`, total / cost, { shouldTouch: true });
                                            }
                                        }}/>
                                    </TableCell>
                                    <TableCell>
                                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                            <Trash2 className="text-destructive w-4 h-4"/>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    </div>
                </CardContent>
            </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Finalize Purchase</CardTitle>
                    <CardDescription>Add supplier and payment details.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="space-y-1">
                        <Label>Supplier</Label>
                         <div className="flex items-center gap-2">
                            <Controller name="supplierId" control={control} render={({ field }) => (
                                <Popover open={isSupplierPopoverOpen} onOpenChange={setIsSupplierPopoverOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            className="w-full justify-between"
                                        >
                                            {field.value && suppliersLoaded
                                                ? suppliers.find((s) => s.id === field.value)?.name
                                                : "Select Supplier"}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                        <Command>
                                            <CommandInput placeholder="Search supplier..." onValueChange={setSupplierSearch} />
                                            <CommandList>
                                                <CommandEmpty>No supplier found.</CommandEmpty>
                                                <CommandGroup>
                                                    {filteredSuppliers.map((s) => (
                                                        <CommandItem
                                                            key={s.id}
                                                            value={s.id!}
                                                            onSelect={(currentValue) => {
                                                                field.onChange(currentValue === field.value ? '' : currentValue)
                                                                setIsSupplierPopoverOpen(false);
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    field.value === s.id ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            {s.name}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            )} />
                             <Button type="button" variant="outline" size="icon" onClick={() => setIsAddSupplierOpen(true)} title="Add new supplier"><UserPlus /></Button>
                         </div>
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
                        <Label>Notes / Description</Label>
                        <Textarea placeholder="e.g. PO-12345" {...register('notes')} />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                     <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span>Subtotal</span><span className="font-medium">{subTotal.toFixed(2)}</span></div>
                        <div className="flex justify-between items-center">
                            <Label htmlFor="expenses">Extra Expenses</Label>
                            <Input className="w-24 h-8" id="expenses" placeholder="RS 0" {...register('expenses')} />
                        </div>
                    </div>
                    <Separator/>
                     <div className="flex justify-between items-center font-bold text-lg">
                        <Label>Grand Total</Label>
                        <span>{grandTotal.toFixed(2)}</span>
                    </div>
                     <Separator/>
                     <div className="space-y-2 text-sm">
                      <h4 className="font-semibold">Supplier Account</h4>
                      <div className="flex justify-between"><span>Old Balance</span><span className="font-medium">{supplierBalance.toFixed(2)}</span></div>
                      <div className="flex justify-between font-bold text-md"><span>New Account Balance</span><span className={cn( (supplierBalance + grandTotal) >= 0 ? 'text-destructive' : 'text-green-600')}>{ (supplierBalance + grandTotal).toFixed(2)}</span></div>
                  </div>
                </CardContent>
                <CardFooter className="grid grid-cols-2 gap-2">
                    <Button type="button" variant="outline" size="lg" onClick={() => reset()}>Discard</Button>
                    <Button type="submit" size="lg">Save Purchase</Button>
                </CardFooter>
            </Card>
        </div>
      </div>
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
