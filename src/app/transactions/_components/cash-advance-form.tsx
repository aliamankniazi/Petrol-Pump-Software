
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Calendar as CalendarIcon, Check, ChevronsUpDown } from 'lucide-react';
import { format } from 'date-fns';
import { useCustomers } from '@/hooks/use-customers';
import { useCashAdvances } from '@/hooks/use-cash-advances';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useCustomerBalance } from '@/hooks/use-customer-balance';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';


const cashAdvanceSchema = z.object({
  customerId: z.string().min(1, 'Please select a customer or employee.'),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  notes: z.string().optional(),
  date: z.date({ required_error: "A date is required."}),
});

type CashAdvanceFormValues = z.infer<typeof cashAdvanceSchema>;

export function CashAdvanceForm() {
  const { customers, isLoaded: customersLoaded } = useCustomers();
  const { addCashAdvance } = useCashAdvances();
  const { toast } = useToast();
  
  const [isClient, setIsClient] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const { register, handleSubmit, reset, control, formState: { errors }, watch, setValue } = useForm<CashAdvanceFormValues>({
    resolver: zodResolver(cashAdvanceSchema),
    defaultValues: { date: new Date(), notes: '', customerId: '', amount: 0 }
  });

  const watchedCustomerId = watch('customerId');
  const { balance: customerBalance } = useCustomerBalance(watchedCustomerId || null);

  const onSubmit: SubmitHandler<CashAdvanceFormValues> = (data) => {
    const customer = customers.find(c => c.id === data.customerId);
    if (!customer) return;

    addCashAdvance({ 
      customerId: data.customerId,
      customerName: customer.name,
      amount: data.amount,
      notes: data.notes,
      date: data.date,
    });
    
    toast({
      title: 'Cash Advance Recorded',
      description: `Cash advance of PKR ${data.amount} to ${customer.name} has been logged.`,
    });
    const lastDate = watch('date');
    reset({ customerId: '', amount: 0, notes: '', date: lastDate });
  };
  
  const filteredCustomers = useMemo(() => {
      if (!customersLoaded) return [];
      if (!customerSearch) return customers;
      return customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()));
  }, [customers, customerSearch, customersLoaded]);

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
                <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                    <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        className={cn("w-full justify-between", !field.value && "text-muted-foreground")}
                    >
                        {field.value && customersLoaded
                        ? customers.find((c) => c.id === field.value)?.name
                        : "Select a person"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                        <CommandInput placeholder="Search person..." onValueChange={setCustomerSearch} />
                        <CommandList>
                            <CommandEmpty>No person found.</CommandEmpty>
                            <CommandGroup>
                                {filteredCustomers.map((c) => (
                                <CommandItem
                                    value={c.id!}
                                    key={c.id}
                                    onSelect={(currentValue) => {
                                        field.onChange(currentValue === field.value ? '' : currentValue);
                                        setIsPopoverOpen(false);
                                    }}
                                >
                                    <Check
                                    className={cn("mr-2 h-4 w-4", c.id === field.value ? "opacity-100" : "opacity-0")}
                                    />
                                    {c.name}
                                </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                    </PopoverContent>
                </Popover>
                )}
            />
            {errors.customerId && <p className="text-sm text-destructive">{errors.customerId.message}</p>}
        </div>

        {watchedCustomerId && (
            <Card className="bg-muted/40 p-4">
                <CardHeader className="p-0 pb-2">
                    <CardTitle className="text-md">Previous Balance</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <p className={cn("text-xl font-bold", customerBalance >= 0 ? 'text-destructive' : 'text-green-600')}>
                        PKR {Math.abs(customerBalance).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </p>
                    <p className="text-xs text-muted-foreground">{customerBalance >= 0 ? 'Receivable' : 'Payable'}</p>
                </CardContent>
            </Card>
        )}

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
                    onSelectAndClose={() => {
                        const popoverTrigger = document.querySelector('[aria-controls="radix-popover-content-"][data-state="open"]');
                        if (popoverTrigger instanceof HTMLElement) {
                            popoverTrigger.click();
                        }
                    }}
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
