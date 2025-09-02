
'use client';

import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Undo2, PackageMinus, ListRestart, LayoutDashboard, ChevronsUpDown, Check } from 'lucide-react';
import { format } from 'date-fns';
import { usePurchaseReturns } from '@/hooks/use-purchase-returns';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useSuppliers } from '@/hooks/use-suppliers';
import { useState, useEffect, useMemo } from 'react';
import { useProducts } from '@/hooks/use-products';
import Link from 'next/link';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DatePickerDropdowns } from '@/components/ui/date-picker-dropdowns';

const purchaseReturnSchema = z.object({
  supplierId: z.string().min(1, 'Please select a supplier.'),
  productId: z.string().min(1, 'Please select a product.'),
  volume: z.coerce.number().min(0.01, 'Volume must be greater than 0'),
  totalRefund: z.coerce.number().min(0.01, 'Total refund must be greater than 0'),
  reason: z.string().min(1, 'Reason for return is required'),
  date: z.date({ required_error: "A date is required."}),
});

type PurchaseReturnFormValues = z.infer<typeof purchaseReturnSchema>;

export default function PurchaseReturnsPage() {
  const { purchaseReturns, addPurchaseReturn } = usePurchaseReturns();
  const { suppliers, isLoaded: suppliersLoaded } = useSuppliers();
  const { products, isLoaded: productsLoaded } = useProducts();
  const { toast } = useToast();
  
  const [isClient, setIsClient] = useState(false);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [isSupplierPopoverOpen, setIsSupplierPopoverOpen] = useState(false);
  const [isProductPopoverOpen, setIsProductPopoverOpen] = useState(false);


  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const filteredSuppliers = useMemo(() => {
    if (!supplierSearch) return suppliers;
    return suppliers.filter(s => s.name.toLowerCase().includes(supplierSearch.toLowerCase()));
  }, [suppliers, supplierSearch]);

  const filteredProducts = useMemo(() => {
    if (!productSearch) return products;
    return products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()));
  }, [products, productSearch]);

  const { register, handleSubmit, reset, setValue, control, formState: { errors }, watch } = useForm<PurchaseReturnFormValues>({
    resolver: zodResolver(purchaseReturnSchema),
    defaultValues: {
      supplierId: '',
      productId: '',
      volume: 0,
      totalRefund: 0,
      reason: '',
      date: new Date(),
    }
  });

  const onSubmit: SubmitHandler<PurchaseReturnFormValues> = (data) => {
    const supplier = suppliers.find(s => s.id === data.supplierId);
    if (!supplier) return;
    const product = products.find(p => p.id === data.productId);
    if (!product) return;

    addPurchaseReturn({ 
        ...data, 
        supplier: supplier.name, // Pass name for display
        productName: product.name,
    });
    toast({
      title: 'Purchase Return Recorded',
      description: `Return to ${supplier.name} has been logged.`,
    });
    const lastDate = watch('date');
    reset({
        supplierId: '',
        productId: '',
        volume: 0,
        totalRefund: 0,
        reason: '',
        date: lastDate,
    });
  };

  if (!isClient) {
    return null;
  }

  return (
    <div className="p-4 md:p-8 grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Undo2 /> New Purchase Return
            </CardTitle>
            <CardDescription>Record a product return to a supplier.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="supplierId">Supplier</Label>
                 <Controller
                  name="supplierId"
                  control={control}
                  render={({ field }) => (
                    <Popover open={isSupplierPopoverOpen} onOpenChange={setIsSupplierPopoverOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" className="w-full justify-between">
                                {field.value ? suppliers.find(s => s.id === field.value)?.name : "Select a supplier"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                                <CommandInput placeholder="Search supplier..." onValueChange={setSupplierSearch} />
                                <CommandList>
                                    <CommandEmpty>No supplier found.</CommandEmpty>
                                    <CommandGroup>
                                        {filteredSuppliers.map(s => (
                                            <CommandItem key={s.id} value={s.id!} onSelect={currentValue => {
                                                field.onChange(currentValue === field.value ? "" : currentValue);
                                                setIsSupplierPopoverOpen(false);
                                            }}>
                                                <Check className={cn("mr-2 h-4 w-4", field.value === s.id ? "opacity-100" : "opacity-0")} />
                                                {s.name}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                  )}
                />
                {errors.supplierId && <p className="text-sm text-destructive">{errors.supplierId.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Product</Label>
                 <Controller
                  name="productId"
                  control={control}
                  render={({ field }) => (
                     <Popover open={isProductPopoverOpen} onOpenChange={setIsProductPopoverOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" className="w-full justify-between">
                                {field.value ? products.find(p => p.id === field.value)?.name : "Select a product"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                                <CommandInput placeholder="Search product..." onValueChange={setProductSearch} />
                                <CommandList>
                                    <CommandEmpty>No product found.</CommandEmpty>
                                    <CommandGroup>
                                        {filteredProducts.map(p => (
                                            <CommandItem key={p.id} value={p.id!} onSelect={currentValue => {
                                                field.onChange(currentValue === field.value ? "" : currentValue);
                                                setIsProductPopoverOpen(false);
                                            }}>
                                                <Check className={cn("mr-2 h-4 w-4", field.value === p.id ? "opacity-100" : "opacity-0")} />
                                                {p.name}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                  )}
                />
                {errors.productId && <p className="text-sm text-destructive">{errors.productId.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="volume">Volume/Quantity</Label>
                  <Input id="volume" type="number" {...register('volume')} placeholder="e.g., 500" step="0.01" />
                  {errors.volume && <p className="text-sm text-destructive">{errors.volume.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="totalRefund">Total Refund (PKR)</Label>
                  <Input id="totalRefund" type="number" {...register('totalRefund')} placeholder="e.g., 100000" step="0.01" />
                  {errors.totalRefund && <p className="text-sm text-destructive">{errors.totalRefund.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Return</Label>
                <Textarea id="reason" {...register('reason')} placeholder="e.g., Contaminated fuel, wrong type delivered" />
                {errors.reason && <p className="text-sm text-destructive">{errors.reason.message}</p>}
              </div>
              
              <div className="space-y-2">
                  <Label>Date</Label>
                  <Controller
                    name="date"
                    control={control}
                    render={({ field }) => (
                      <DatePickerDropdowns date={field.value} onDateChange={field.onChange} />
                    )}
                  />
                </div>

              <Button type="submit" className="w-full">Record Return</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Card>
          <CardHeader className="flex flex-row justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ListRestart /> Return History
              </CardTitle>
              <CardDescription>
                A record of all product returns to suppliers.
              </CardDescription>
            </div>
             <Button asChild variant="outline">
                <Link href="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" /> Go to Dashboard</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {purchaseReturns.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Volume/Qty</TableHead>
                    <TableHead className="text-right">Total Refund</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseReturns.map(p => {
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{format(new Date(p.timestamp), 'PP')}</TableCell>
                        <TableCell>{p.supplier}</TableCell>
                        <TableCell>{p.productName}</TableCell>
                        <TableCell className="text-right">{p.volume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        <TableCell className="text-right">PKR {p.totalRefund.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        <TableCell>{p.reason}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                <PackageMinus className="w-16 h-16" />
                <h3 className="text-xl font-semibold">No Returns Recorded</h3>
                <p>Use the form to log your first purchase return.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
