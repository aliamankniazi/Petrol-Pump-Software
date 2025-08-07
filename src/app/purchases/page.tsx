
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
import { ShoppingCart, Package, Truck, Calendar as CalendarIcon, PlusCircle, Trash2 } from 'lucide-react';
import type { FuelType } from '@/lib/types';
import { format } from 'date-fns';
import { usePurchases } from '@/hooks/use-purchases';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useSuppliers } from '@/hooks/use-suppliers';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

const FUEL_TYPES: FuelType[] = ['Unleaded', 'Premium', 'Diesel'];

const purchaseItemSchema = z.object({
  fuelType: z.enum(FUEL_TYPES, { required_error: 'Fuel type is required.'}),
  volume: z.coerce.number().min(0.01, 'Volume must be positive.'),
  cost: z.coerce.number().min(0.01, 'Cost must be positive.'),
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


export default function PurchasesPage() {
  const { purchases, addPurchase } = usePurchases();
  const { suppliers, addSupplier, isLoaded: suppliersLoaded } = useSuppliers();
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const { register, handleSubmit, reset, setValue, control, watch, formState: { errors } } = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      date: new Date(),
      items: [],
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const watchedItems = watch('items');
  const totalCost = useMemo(() => {
    return watchedItems.reduce((sum, item) => sum + (item.cost || 0), 0);
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
        append({ fuelType: 'Unleaded', volume: 0, cost: 0 });
    }
  }, [fields.length, append]);

  const onPurchaseSubmit: SubmitHandler<PurchaseFormValues> = (data) => {
    const supplier = suppliers.find(s => s.id === data.supplierId);
    if (!supplier) return;

    addPurchase({
      ...data,
      supplier: supplier.name, // Pass the name for display purposes
      timestamp: data.date.toISOString(),
      totalCost,
    });
    toast({
      title: 'Purchase Recorded',
      description: `Delivery from ${supplier.name} has been logged.`,
    });
    reset({
        supplierId: '',
        items: [],
        date: new Date(),
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
            <CardDescription>Record a new fuel delivery with one or more products.</CardDescription>
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
                                    <Label>Fuel Type</Label>
                                    <Controller
                                      name={`items.${index}.fuelType`}
                                      control={control}
                                      render={({ field }) => (
                                         <Select onValueChange={field.onChange} value={field.value} defaultValue="">
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select a fuel type" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {FUEL_TYPES.map(fuel => (
                                              <SelectItem key={fuel} value={fuel}>{fuel}</SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      )}
                                    />
                                </div>
                                 <div className="space-y-2">
                                  <Label htmlFor={`items.${index}.volume`}>Volume (L)</Label>
                                  <Input id={`items.${index}.volume`} type="number" {...register(`items.${index}.volume`)} placeholder="e.g., 5000" step="0.01" />
                                  {errors.items?.[index]?.volume && <p className="text-sm text-destructive">{errors.items?.[index]?.volume?.message}</p>}
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`items.${index}.cost`}>Total Cost (PKR)</Label>
                                  <Input id={`items.${index}.cost`} type="number" {...register(`items.${index}.cost`)} placeholder="e.g., 1000000" step="0.01" />
                                  {errors.items?.[index]?.cost && <p className="text-sm text-destructive">{errors.items?.[index]?.cost?.message}</p>}
                                </div>
                             </div>
                            <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 w-6 h-6" onClick={() => remove(index)}><Trash2 className="w-4 h-4" /></Button>
                        </Card>
                    ))}
                </div>
                 <Button type="button" variant="outline" onClick={() => append({ fuelType: 'Unleaded', volume: 0, cost: 0 })} className="w-full"><PlusCircle /> Add Product</Button>
              
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
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart /> Purchase History
            </CardTitle>
            <CardDescription>
              A record of all incoming stock and fuel deliveries.
            </CardDescription>
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
                                {item.volume.toLocaleString()}L of {item.fuelType}
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
                <p>Use the form to log your first fuel delivery.</p>
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
}
