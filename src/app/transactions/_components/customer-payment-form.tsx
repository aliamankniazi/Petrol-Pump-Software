
'use client';

import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Wallet, CreditCard, Smartphone, Calendar as CalendarIcon } from 'lucide-react';
import type { PaymentMethod } from '@/lib/types';
import { format } from 'date-fns';
import { useCustomerPayments } from '@/hooks/use-customer-payments';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useCustomers } from '@/hooks/use-customers';
import { useCustomerBalance } from '@/hooks/use-customer-balance';
import { Textarea } from '@/components/ui/textarea';

const paymentSchema = z.object({
  customerId: z.string().min(1, 'Please select a customer.'),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  paymentMethod: z.enum(['Cash', 'Card', 'Mobile'], { required_error: 'Please select a payment method.' }),
  date: z.date({ required_error: "A date is required."}),
  notes: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

const LOCAL_STORAGE_KEY = 'global-transaction-date';

export function CustomerPaymentForm() {
  const { customers, isLoaded: customersLoaded } = useCustomers();
  const { addCustomerPayment } = useCustomerPayments();
  const { toast } = useToast();
  
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const { register, handleSubmit, control, reset, formState: { errors }, watch, setValue } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { 
      paymentMethod: 'Cash',
      customerId: '',
      amount: 0,
      notes: '',
    }
  });
  
  useEffect(() => {
    if (isClient) {
      const storedDate = localStorage.getItem(LOCAL_STORAGE_KEY);
      const initialDate = storedDate ? new Date(storedDate) : new Date();
      setValue('date', initialDate);
    }
  }, [setValue, isClient]);

  const watchedCustomerId = watch('customerId');
  const { balance: customerBalance } = useCustomerBalance(watchedCustomerId || null);

  const onSubmit: SubmitHandler<PaymentFormValues> = (data) => {
    const customer = customers.find(c => c.id === data.customerId);
    if (!customer) return;

    addCustomerPayment({ 
      ...data,
      customerName: customer.name,
    });
    
    toast({
      title: 'Payment Recorded',
      description: `Payment of PKR ${data.amount} from ${customer.name} has been logged.`,
    });
    const lastDate = watch('date');
    reset({ customerId: '', amount: 0, date: lastDate, paymentMethod: 'Cash', notes: '' });
  };

  if (!isClient) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-xl mx-auto">
        <div className="space-y-2">
            <Label>Customer</Label>
            <Controller
                name="customerId"
                control={control}
                render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value} defaultValue="">
                    <SelectTrigger>
                    <SelectValue placeholder="Select a customer" />
                    </SelectTrigger>
                    <SelectContent>
                    {customersLoaded ? customers.map(c => (
                        <SelectItem key={c.id} value={c.id!}>{c.name}</SelectItem>
                    )) : <SelectItem value="loading" disabled>Loading...</SelectItem>}
                    </SelectContent>
                </Select>
                )}
            />
            {errors.customerId && <p className="text-sm text-destructive">{errors.customerId.message}</p>}
        </div>

        {watchedCustomerId && (
            <Card className="bg-muted/40 p-4">
            <CardHeader className="p-0 pb-2">
                <CardTitle className="text-md">Customer Balance</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <p className={cn("text-xl font-bold", customerBalance > 0 ? 'text-destructive' : 'text-green-600')}>
                PKR {customerBalance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </p>
                <p className="text-xs text-muted-foreground">Current outstanding balance.</p>
            </CardContent>
            </Card>
        )}

        <div className="space-y-2">
            <Label htmlFor="amount">Amount (PKR)</Label>
            <Input id="amount" type="number" {...register('amount')} placeholder="e.g., 5000" step="0.01" />
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
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Textarea id="notes" {...register('notes')} placeholder="e.g., Payment for last week's fuel" />
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
