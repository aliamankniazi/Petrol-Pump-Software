
'use client';

import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useCustomers } from '@/hooks/use-customers';
import { useCashAdvances } from '@/hooks/use-cash-advances';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

const cashAdvanceSchema = z.object({
  customerId: z.string().min(1, 'Please select a customer or employee.'),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  notes: z.string().optional(),
  date: z.date({ required_error: "A date is required."}),
});

type CashAdvanceFormValues = z.infer<typeof cashAdvanceSchema>;

const LOCAL_STORAGE_KEY = 'global-transaction-date';

export function CashAdvanceForm() {
  const { customers, isLoaded: customersLoaded } = useCustomers();
  const { addCashAdvance } = useCashAdvances();
  const { toast } = useToast();
  
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const { register, handleSubmit, reset, control, formState: { errors }, watch, setValue } = useForm<CashAdvanceFormValues>({
    resolver: zodResolver(cashAdvanceSchema),
    defaultValues: { date: new Date(), notes: '', customerId: '', amount: 0 }
  });

  useEffect(() => {
    if (isClient) {
      const storedDate = localStorage.getItem(LOCAL_STORAGE_KEY);
      const initialDate = storedDate ? new Date(storedDate) : new Date();
      setValue('date', initialDate);
    }
  }, [setValue, isClient]);

  const onSubmit: SubmitHandler<CashAdvanceFormValues> = (data) => {
    const customer = customers.find(c => c.id === data.customerId);
    if (!customer) return;

    addCashAdvance({ 
      customerId: data.customerId,
      customerName: customer.name,
      amount: data.amount,
      notes: data.notes,
      timestamp: data.date.toISOString(),
    });
    
    toast({
      title: 'Cash Advance Recorded',
      description: `Cash advance of PKR ${data.amount} to ${customer.name} has been logged.`,
    });
    const lastDate = watch('date');
    reset({ customerId: '', amount: 0, notes: '', date: lastDate });
  };

  if (!isClient) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-xl mx-auto">
        <div className="space-y-2">
        <Label>Customer / Employee</Label>
        <Controller
            name="customerId"
            control={control}
            render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value} defaultValue="">
                <SelectTrigger>
                <SelectValue placeholder="Select a person" />
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

        <div className="space-y-2">
        <Label htmlFor="amount">Amount (PKR)</Label>
        <Input id="amount" type="number" {...register('amount')} placeholder="e.g., 5000" step="0.01" />
        {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
        </div>

        <div className="space-y-2">
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea id="notes" {...register('notes')} placeholder="e.g., For urgent repair" />
        {errors.notes && <p className="text-sm text-destructive">{errors.notes.message}</p>}
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

        <Button type="submit" className="w-full">Record Cash Advance</Button>
    </form>
  );
}

