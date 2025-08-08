
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { ShoppingCart, Package, Truck, Calendar as CalendarIcon, PlusCircle, Trash2, LayoutDashboard } from 'lucide-react';
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

const purchaseItemSchema = z.object({
  productId: z.string().min(1, 'Product is required.'),
  quantity: z.coerce.number().min(0.01, 'Quantity must be positive.'),
  costPerUnit: z.coerce.number().min(0, "Cost must be non-negative."),
  totalCost: z.coerce.number().min(0.01, 'Cost must be positive.'),
});

const purchaseSchema = z.object({
  supplierId: z.string().min(1, 'Please select a supplier.'),
  date: z.date({ required_error: "A date is required."}),
  items: z.array(purchaseItemSchema).min(1, 'At least one item is required.'),
});

type PurchaseFormValues = z.infer<typeof purchaseSchema>;

const supplierSchema = z.object({
  name: z.string().min(1, 'Supplier name is required'),
  contact: z.string().optional(),
});
type SupplierFormValues = z.infer<typeof supplierSchema>;

const LOCAL_STORAGE_KEY = 'global-transaction-date';

export default function PurchasesPage() {
  const { purchases, addPurchase } = usePurchases();
  const { suppliers, addSupplier, isLoaded: suppliersLoaded } = useSuppliers();
  const { products, isLoaded: productsLoaded } = useProducts();
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const { register, handleSubmit, reset, setValue, control, watch, formState: { errors } } = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: () => {
      if (typeof window !== 'undefined') {
        const storedDate = localStorage.getItem(LOCAL_STORAGE_KEY);
        return { date: storedDate ? new Date(storedDate) : new Date(), items: [] };
      }
      return { date: new Date(), items: [] };
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const watchedItems = watch('items');
  const selectedDate = watch('date');

  useEffect(() => {
    if (selectedDate && typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY, selectedDate.toISOString());
    }
  }, [selectedDate]);

  const totalCost = useMemo(() => {
    if (!watchedItems) return 0;
    return watchedItems.reduce((sum, item) => sum + (item.totalCost || 0), 0);
  }, [watchedItems]);

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
      setValue(`items.${index}.costPerUnit`, product.cost || 0, { shouldValidate: true });
      const quantity = watch(`items.${index}.quantity`);
      if (quantity > 0) {
        setValue(`items.${index}.totalCost`, quantity * (product.cost || 0), { shouldValidate: true });
      }
    }
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    const costPerUnit = watch(`items.${index}.costPerUnit`);
    setValue(`items.${index}.totalCost`, quantity * costPerUnit, { shouldValidate: true });
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
      supplier: supplier.name, // Pass the name for display purposes
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
        items: [],
        date: lastDate,
    });
  };
  
  const onSupplierSubmit: SubmitHandler<SupplierFormValues> = useCallback((data) => {
    addSupplier(data);
    toast({
        title: 'Supplier Added',
        description: `${data.name} has been added. You can now select them from the list.`,
    });
    resetSupplier();
    setIsAddSupplierOpen(false);
  }, [addSupplier, toast, resetSupplier]);


  return (
    <>
    <div className="p-4 md:p-8 grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck /> New Purchase
            </CardTitle>
            <CardDescription>Record a new delivery with one or more products.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onPurchaseSubmit)} className="space-y-4">
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
                      <Popover>
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
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  />}
                  {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
                </div>
                
                <Separator />
                
                <div className="space-y-4 max-h-[35vh] overflow-y-auto pr-2">
                    {fields.map((field, index) => (
                        <Card key={field.id} className="p-4 relative bg-muted/30">
                             <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 space-y-2">
                                    <Label>Product</Label>
                                    <Controller
                                      name={`items.${index}.productId`}
                                      control={control}
                                      render={({ field }) => (
                                         <Select onValueChange={(value) => {
                                            field.onChange(value);
                                            handleProductChange(index, value);
                                        }} value={field.value} defaultValue="">
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select a product" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {productsLoaded ? products.map(p => (
                                              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                            )) : <SelectItem value="loading" disabled>Loading...</SelectItem>}
                                          </SelectContent>
                                        </Select>
                                      )}
                                    />
                                </div>
                                 <div className="space-y-2">
                                  <Label htmlFor={`items.${index}.quantity`}>Quantity</Label>
                                  <Input id={`items.${index}.quantity`} type="number" {...register(`items.${index}.quantity`)} placeholder="e.g., 5000" step="0.01" onChange={(e) => handleQuantityChange(index, +e.target.value)} />
                                  {errors.items?.[index]?.quantity && <p className="text-sm text-destructive">{errors.items?.[index]?.quantity?.message}</p>}
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`items.${index}.costPerUnit`}>Cost / Unit</Label>
                                  <Input id={`items.${index}.costPerUnit`} type="number" {...register(`items.${index}.costPerUnit`)} placeholder="e.g., 250" step="0.01" onChange={(e) => handleCostPerUnitChange(index, +e.target.value)} />
                                  {errors.items?.[index]?.costPerUnit && <p className="text-sm text-destructive">{errors.items?.[index]?.costPerUnit?.message}</p>}
                                </div>
                                <div className="col-span-2 space-y-2">
                                  <Label htmlFor={`items.${index}.totalCost`}>Total Cost (PKR)</Label>
                                  <Input id={`items.${index}.totalCost`} type="number" {...register(`items.${index}.totalCost`)} placeholder="e.g., 1000000" step="0.01" className="font-bold" />
                                  {errors.items?.[index]?.totalCost && <p className="text-sm text-destructive">{errors.items?.[index]?.totalCost?.message}</p>}
                                </div>
                             </div>
                            <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 w-6 h-6" onClick={() => remove(index)}><Trash2 className="w-4 h-4" /></Button>
                        </Card>
                    ))}
                </div>
                 <Button type="button" variant="outline" onClick={() => append({ productId: '', quantity: 0, costPerUnit: 0, totalCost: 0 })} className="w-full"><PlusCircle /> Add Product</Button>
              
              <div className="border-t pt-4 space-y-2">
                <h3 className="text-lg font-semibold">Total Purchase Cost</h3>
                <p className="text-2xl font-bold text-primary">PKR {totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>

              <Button type="submit" className="w-full">Record Purchase</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
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
             <Button asChild variant="outline">
                <Link href="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" /> Go to Dashboard</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {purchases.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead className="text-right">Total Cost</TableHead>
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
                                {item.quantity.toLocaleString()} x {item.productName}
                             </li>
                           ))}
                          </ul>
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold">PKR {p.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
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
    </>
  );
