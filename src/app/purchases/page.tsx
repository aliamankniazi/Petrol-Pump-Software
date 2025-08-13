
'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
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

const LOCAL_STORAGE_KEY = 'global-transaction-date';

export default function PurchasesPage() {
  const { addPurchase } = usePurchases();
  const { suppliers, addSupplier, isLoaded: suppliersLoaded } = useSuppliers();
  const { products, isLoaded: productsLoaded } = useProducts();
  const { bankAccounts, isLoaded: bankAccountsLoaded } = useBankAccounts();
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  
  const [productSearch, setProductSearch] = useState('');
  const [supplierSearch, setSupplierSearch] = useState('');
  const [isProductPopoverOpen, setIsProductPopoverOpen] = useState(false);
  const [isSupplierPopoverOpen, setIsSupplierPopoverOpen] = useState(false);


  useEffect(() => {
    setIsClient(true);
  }, []);

  const { register, handleSubmit, reset, setValue, control, watch, getValues } = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      items: [],
      expenses: 0,
      paidAmount: 0,
      bankAccountId: '',
      referenceNo: '',
      notes: '',
    }
  });

  useEffect(() => {
    if (isClient) {
      const storedDate = localStorage.getItem(LOCAL_STORAGE_KEY);
      const defaultDate = storedDate ? new Date(storedDate) : new Date();
      setValue('date', defaultDate);
    }
  }, [setValue, isClient]);
  
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
    
  const handleAddItemToPurchase = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product || !product.id) return;

    append({
        productId: product.id,
        productName: product.name,
        unit: product.mainUnit,
        quantity: 1,
        costPerUnit: product.purchasePrice || 0,
        totalCost: product.purchasePrice || 0,
        discount: 0,
    });
    setIsProductPopoverOpen(false);
    setProductSearch('');
  }
  
  const { grandTotal } = useMemo(() => {
      const sub = watchedItems.reduce((sum, item) => sum + (item.totalCost || 0), 0);
      const expenses = Number(getValues('expenses')) || 0;
      const grand = sub + expenses;
      return { grandTotal: grand };
    }, [watchedItems, getValues]);

  const onPurchaseSubmit: SubmitHandler<PurchaseFormValues> = (data) => {
    const supplier = suppliers.find(s => s.id === data.supplierId);
    if (!supplier) return;

    const subTotal = data.items.reduce((sum, item) => sum + item.totalCost, 0);

    addPurchase({
      ...data,
      supplier: supplier.name, 
      totalCost: subTotal,
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

  const filteredProducts = useMemo(() => {
    if (!productsLoaded) return [];
    if (!productSearch) return products;
    return products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()));
  }, [products, productSearch, productsLoaded]);

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
     <Card>
            <CardHeader>
                <div className='flex justify-between items-center'>
                    <CardTitle className="flex items-center gap-2"><Truck /> New Purchase Invoice</CardTitle>
                    <CardDescription>Date: {format(new Date(), 'dd-MM-yyyy')}</CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <div className="p-4 rounded-lg bg-muted/50 border space-y-4">
                     <div className="space-y-1">
                        <Label>Product</Label>
                        <Popover open={isProductPopoverOpen} onOpenChange={setIsProductPopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                variant="outline"
                                role="combobox"
                                className="w-full justify-between"
                                >
                                Select Product
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command>
                                    <CommandInput placeholder="Search product..." onValueChange={setProductSearch}/>
                                    <CommandList>
                                        <CommandEmpty>No product found.</CommandEmpty>
                                        <CommandGroup>
                                        {filteredProducts.map((p) => (
                                            <CommandItem
                                            key={p.id}
                                            value={p.id!}
                                            onSelect={() => handleAddItemToPurchase(p.id!)}
                                            >
                                            {p.name}
                                            </CommandItem>
                                        ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
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
                                            setValue(`items.${index}.totalCost`, qty * cost);
                                        }}/>
                                    </TableCell>
                                    <TableCell>
                                        <Input type="number" step="any" {...register(`items.${index}.quantity`)} onChange={e => {
                                            const qty = parseFloat(e.target.value) || 0;
                                            const cost = getValues(`items.${index}.costPerUnit`);
                                            setValue(`items.${index}.totalCost`, qty * cost);
                                        }}/>
                                    </TableCell>
                                    <TableCell>
                                        <Input type="number" step="any" {...register(`items.${index}.discount`)}/>
                                    </TableCell>
                                    <TableCell>
                                        <Input type="number" step="any" {...register(`items.${index}.totalCost`)}/>
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
