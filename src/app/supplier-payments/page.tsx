
'use client';

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
import { Handshake, ListChecks, WalletCards, CreditCard, Wallet, Smartphone, Calendar as CalendarIcon, LayoutDashboard } from 'lucide-react';
import { format } from 'date-fns';
import { useSupplierPayments } from '@/hooks/use-supplier-payments';
import type { PaymentMethod } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useSuppliers } from '@/hooks/use-suppliers';
import { useCallback, useState, useEffect } from 'react';
import Link from 'next/link';

const supplierPaymentSchema = z.object({
  supplierId: z.string().min(1, 'Please select a supplier.'),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  paymentMethod: z.enum(['Cash', 'Card', 'Mobile'], { required_error: 'Please select a payment method.' }),
  date: z.date({ required_error: "A date is required."}),
});

type SupplierPaymentFormValues = z.infer<typeof supplierPaymentSchema>;

const LOCAL_STORAGE_KEY = 'global-transaction-date';

export default function SupplierPaymentsPage() {
  const { suppliers, isLoaded: suppliersLoaded } = useSuppliers();
  const { supplierPayments, addSupplierPayment } = useSupplierPayments();
  const { toast } = useToast();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const [isClient, setIsClient] = useState(false);

  const { register, handleSubmit, control, reset, formState: { errors }, watch, setValue } = useForm<SupplierPaymentFormValues>({
    resolver: zodResolver(supplierPaymentSchema),
    defaultValues: {
      date: new Date(), 
      paymentMethod: 'Cash'
    }
  });
  
  useEffect(() => {
    setIsClient(true);
    const storedDate = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedDate) {
      setValue('date', new Date(storedDate));
    }
  }, [setValue]);
  
  const selectedDate = watch('date');
  useEffect(() => {
    if (selectedDate && isClient) {
      localStorage.setItem(LOCAL_STORAGE_KEY, selectedDate.toISOString());
    }
  }, [selectedDate, isClient]);

  const onSubmit: SubmitHandler<SupplierPaymentFormValues> = useCallback((data) => {
    const supplier = suppliers.find(s => s.id === data.supplierId);
    if (!supplier) return;

    addSupplierPayment({ 
      ...data,
      supplierName: supplier.name, // Pass name for display
      timestamp: data.date.toISOString(),
    });
    
    toast({
      title: 'Payment Recorded',
      description: `Payment of PKR ${data.amount} to ${supplier.name} has been logged.`,
    });
    const lastDate = watch('date');
    reset({ supplierId: '', amount: 0, date: lastDate, paymentMethod: 'Cash' });
  }, [suppliers, addSupplierPayment, toast, reset, watch]);
  
  const getBadgeVariant = (method: Omit<PaymentMethod, 'On Credit'>) => {
    switch (method) {
      case 'Card': return 'default';
      case 'Cash': return 'secondary';
      case 'Mobile': return 'outline';
      default: return 'default';
    }
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
              <WalletCards /> New Supplier Payment
            </CardTitle>
            <CardDescription>Record a payment made to a supplier.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Supplier</Label>
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
                {errors.supplierId && <p className="text-sm text-destructive">{errors.supplierId.message}</p>}
              </div>

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
                />
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
                A record of all payments made to suppliers.
              </CardDescription>
            </div>
             <Button asChild variant="outline">
                <Link href="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" /> Go to Dashboard</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {supplierPayments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {supplierPayments.map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{format(new Date(p.timestamp), 'PP pp')}</TableCell>
                        <TableCell>{p.supplierName}</TableCell>
                        <TableCell>
                          <Badge variant={getBadgeVariant(p.paymentMethod)}>{p.paymentMethod}</Badge>
                        </TableCell>
                        <TableCell className="text-right">PKR {p.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                <Handshake className="w-16 h-16" />
                <h3 className="text-xl font-semibold">No Supplier Payments Recorded</h3>
                <p>Use the form to log your first payment to a supplier.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
