
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Wallet, CreditCard, Smartphone, Calendar as CalendarIcon, ChevronsUpDown, Check } from 'lucide-react';
import { format } from 'date-fns';
import { useSupplierPayments } from '@/hooks/use-supplier-payments';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useSuppliers } from '@/hooks/use-suppliers';
import { useSupplierBalance } from '@/hooks/use-supplier-balance';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

const supplierPaymentSchema = z.object({
  supplierId: z.string().min(1, 'Please select a supplier.'),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  paymentMethod: z.enum(['Cash', 'Card', 'Mobile'], { required_error: 'Please select a payment method.' }),
  date: z.date({ required_error: "A date is required."}),
});

type SupplierPaymentFormValues = z.infer<typeof supplierPaymentSchema>;

export function SupplierPaymentForm() {
  const { suppliers, isLoaded: suppliersLoaded } = useSuppliers();
  const { addSupplierPayment } = useSupplierPayments();
  const { toast } = useToast();

  const [isClient, setIsClient] = useState(false);
  const [supplierSearch, setSupplierSearch] = useState('');

  useEffect(() => {
    setIsClient(true);
  }, []);

  const filteredSuppliers = useMemo(() => {
    if (!supplierSearch) return suppliers;
    return suppliers.filter(s => s.name.toLowerCase().includes(supplierSearch.toLowerCase()));
  }, [suppliers, supplierSearch]);

  const { register, handleSubmit, control, reset, formState: { errors }, watch, setValue } = useForm<SupplierPaymentFormValues>({
    resolver: zodResolver(supplierPaymentSchema),
    defaultValues: {
      paymentMethod: 'Cash',
      supplierId: '',
      amount: 0,
      date: new Date(),
    }
  });
  
  const watchedSupplierId = watch('supplierId');
  const { balance: supplierBalance } = useSupplierBalance(watchedSupplierId || null);

  const onSubmit: SubmitHandler<SupplierPaymentFormValues> = (data) => {
    const supplier = suppliers.find(s => s.id === data.supplierId);
    if (!supplier) return;

    addSupplierPayment({ 
      ...data,
      supplierName: supplier.name,
    });
    
    toast({
      title: 'Payment Recorded',
      description: `Payment of PKR ${data.amount} to ${supplier.name} has been logged.`,
    });
    const lastDate = watch('date');
    reset({ supplierId: '', amount: 0, date: lastDate, paymentMethod: 'Cash' });
  };

  if (!isClient) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-xl mx-auto">
        <div className="space-y-2">
        <Label>Supplier</Label>
        <Controller
            name="supplierId"
            control={control}
            render={({ field }) => (
                <Popover>
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
                                        <CommandItem key={s.id} value={s.id!} onSelect={currentValue => field.onChange(currentValue === field.value ? "" : currentValue)}>
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

        {watchedSupplierId && (
            <Card className="bg-muted/40 p-4">
                <CardHeader className="p-0 pb-2">
                    <CardTitle className="text-md">Previous Balance</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <p className={cn("text-xl font-bold", supplierBalance >= 0 ? 'text-destructive' : 'text-green-600')}>
                        PKR {Math.abs(supplierBalance).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </p>
                    <p className="text-xs text-muted-foreground">{supplierBalance >= 0 ? 'Payable' : 'Receivable'}</p>
                </CardContent>
            </Card>
        )}

        <div className="space-y-2">
        <Label htmlFor="amount">Amount (PKR)</Label>
        <Input id="amount" type="number" {...register('amount')} placeholder="e.g., 50000" step="0.01" />
        {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
        </div>
        
        <div className="space-y-2">
        <Label>Payment Method</Label>
        <Controller
            name="paymentMethod"
            control={control}
            render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="Cash"><div className="flex items-center gap-2"><Wallet/>Cash</div></SelectItem>
                <SelectItem value="Card"><div className="flex items-center gap-2"><CreditCard/>Card</div></SelectItem>
                <SelectItem value="Mobile"><div className="flex items-center gap-2"><Smartphone/>Mobile</div></SelectItem>
                </SelectContent>
            </Select>
            )}
        />
            {errors.paymentMethod && <p className="text-sm text-destructive">{errors.paymentMethod.message}</p>}
        </div>

        <div className="space-y-2">
        <Label>Date</Label>
        <Controller
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
        />
        {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
        </div>

        <Button type="submit" className="w-full">Record Payment</Button>
    </form>
  );
}
