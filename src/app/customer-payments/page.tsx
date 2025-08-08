
'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { HandCoins, ListChecks, WalletCards, CreditCard, Wallet, Smartphone, Calendar as CalendarIcon, AlertTriangle, Trash2, LayoutDashboard } from 'lucide-react';
import type { PaymentMethod, CustomerPayment } from '@/lib/types';
import { format } from 'date-fns';
import { useCustomerPayments } from '@/hooks/use-customer-payments';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useCustomers } from '@/hooks/use-customers';
import { useCustomerBalance } from '@/hooks/use-customer-balance';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import Link from 'next/link';

const paymentSchema = z.object({
  customerId: z.string().min(1, 'Please select a customer.'),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  paymentMethod: z.enum(['Cash', 'Card', 'Mobile'], { required_error: 'Please select a payment method.' }),
  date: z.date({ required_error: "A date is required."}),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

const LOCAL_STORAGE_KEY = 'global-transaction-date';

export default function CustomerPaymentsPage() {
  const { customers, isLoaded: customersLoaded } = useCustomers();
  const { customerPayments, addCustomerPayment, deleteCustomerPayment, isLoaded: paymentsLoaded } = useCustomerPayments();
  const { toast } = useToast();
  
  const [paymentToDelete, setPaymentToDelete] = useState<CustomerPayment | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const { register, handleSubmit, control, reset, formState: { errors }, watch, setValue } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { 
      date: new Date(), 
      paymentMethod: 'Cash' 
    }
  });
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedDate = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedDate) {
        setValue('date', new Date(storedDate));
      }
    }
  }, [setValue, isClient]);

  const selectedDate = watch('date');
  useEffect(() => {
    if (selectedDate && typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY, selectedDate.toISOString());
    }
  }, [selectedDate, isClient]);

  const watchedCustomerId = watch('customerId');
  const { balance: customerBalance, isLoaded: balanceLoaded } = useCustomerBalance(watchedCustomerId || null);

  const onSubmit: SubmitHandler<PaymentFormValues> = useCallback((data) => {
    const customer = customers.find(c => c.id === data.customerId);
    if (!customer) return;

    addCustomerPayment({ 
      ...data,
      customerName: customer.name,
      timestamp: data.date.toISOString(),
    });
    
    toast({
      title: 'Payment Recorded',
      description: `Payment of PKR ${data.amount} from ${customer.name} has been logged.`,
    });
    const lastDate = watch('date');
    reset({ customerId: '', amount: 0, date: lastDate, paymentMethod: 'Cash' });
  }, [customers, addCustomerPayment, toast, reset, watch]);
  
  const handleDeletePayment = useCallback(() => {
    if (!paymentToDelete) return;
    deleteCustomerPayment(paymentToDelete.id);
    toast({
      title: 'Payment Deleted',
      description: `The payment from ${paymentToDelete.customerName} has been removed.`,
    });
    setPaymentToDelete(null);
  }, [paymentToDelete, deleteCustomerPayment, toast]);

  const getBadgeVariant = (method: Omit<PaymentMethod, 'On Credit'>) => {
    switch (method) {
      case 'Card': return 'default';
      case 'Cash': return 'secondary';
      case 'Mobile': return 'outline';
      default: return 'default';
    }
  };

  return (
    <>
    <div className="p-4 md:p-8 grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <WalletCards /> New Customer Payment
            </CardTitle>
            <CardDescription>Record a payment received from a customer.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
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
                      {balanceLoaded ? (
                         <p className={cn("text-xl font-bold", customerBalance > 0 ? 'text-destructive' : 'text-green-600')}>
                          PKR {customerBalance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </p>
                      ) : <p>Loading balance...</p>}
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
                <Label>Date</Label>
                {isClient && <Controller
                  name="date"
                  control={control}
                  render={({ field }) => (
                    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
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
                          onSelect={(date) => {
                            if(date) field.onChange(date);
                            setIsCalendarOpen(false);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                />}
                {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
              </div>

              <Button type="submit" className="w-full">Record Payment</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Card>
          <CardHeader className="flex flex-row justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ListChecks /> Payment History
              </CardTitle>
              <CardDescription>
                A record of all payments received from customers.
              </CardDescription>
            </div>
             <Button asChild variant="outline">
                <Link href="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" /> Go to Dashboard</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {customerPayments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerPayments.map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{format(new Date(p.timestamp), 'PP pp')}</TableCell>
                        <TableCell>{p.customerName}</TableCell>
                        <TableCell>
                          <Badge variant={getBadgeVariant(p.paymentMethod)}>{p.paymentMethod}</Badge>
                        </TableCell>
                        <TableCell className="text-right">PKR {p.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                         <TableCell className="text-center">
                            <Button variant="ghost" size="icon" title="Delete" className="text-destructive hover:text-destructive" onClick={() => setPaymentToDelete(p)}>
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                <HandCoins className="w-16 h-16" />
                <h3 className="text-xl font-semibold">No Customer Payments Recorded</h3>
                <p>Use the form to log your first payment from a customer.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>

    <AlertDialog open={!!paymentToDelete} onOpenChange={(isOpen) => !isOpen && setPaymentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle/>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the payment entry for: <br />
              <strong className="font-medium text-foreground">{paymentToDelete?.customerName} of PKR {paymentToDelete?.amount}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePayment} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Yes, delete entry
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
