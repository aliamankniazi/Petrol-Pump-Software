'use client';

import { useMemo } from 'react';
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
import { Handshake, ListChecks, WalletCards, CreditCard, Wallet, Smartphone } from 'lucide-react';
import { format } from 'date-fns';
import { usePurchases } from '@/hooks/use-purchases';
import { useSupplierPayments } from '@/hooks/use-supplier-payments';
import type { PaymentMethod } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

const supplierPaymentSchema = z.object({
  supplierName: z.string().min(1, 'Please select a supplier.'),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  paymentMethod: z.enum(['Cash', 'Card', 'Mobile'], { required_error: 'Please select a payment method.' }),
});

type SupplierPaymentFormValues = z.infer<typeof supplierPaymentSchema>;

export default function SupplierPaymentsPage() {
  const { purchases, isLoaded: purchasesLoaded } = usePurchases();
  const { supplierPayments, addSupplierPayment } = useSupplierPayments();
  const { toast } = useToast();
  
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<SupplierPaymentFormValues>({
    resolver: zodResolver(supplierPaymentSchema),
  });

  const suppliers = useMemo(() => {
    if (!purchasesLoaded) return [];
    const supplierSet = new Set(purchases.map(p => p.supplier));
    return Array.from(supplierSet);
  }, [purchases, purchasesLoaded]);

  const onSubmit: SubmitHandler<SupplierPaymentFormValues> = (data) => {
    addSupplierPayment(data);
    
    toast({
      title: 'Payment Recorded',
      description: `Payment of PKR ${data.amount} to ${data.supplierName} has been logged.`,
    });
    reset({ supplierName: '', amount: 0 });
  };
  
  const getBadgeVariant = (method: PaymentMethod) => {
    switch (method) {
      case 'Card': return 'default';
      case 'Cash': return 'secondary';
      case 'Mobile': return 'outline';
      default: return 'default';
    }
  };

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
                  name="supplierName"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value} defaultValue="">
                      <SelectTrigger>
                        <SelectValue placeholder="Select a supplier" />
                      </SelectTrigger>
                      <SelectContent>
                        {purchasesLoaded ? suppliers.map(s => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        )) : <SelectItem value="loading" disabled>Loading...</SelectItem>}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.supplierName && <p className="text-sm text-destructive">{errors.supplierName.message}</p>}
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

              <Button type="submit" className="w-full">Record Payment</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListChecks /> Payment History
            </CardTitle>
            <CardDescription>
              A record of all payments made to suppliers.
            </CardDescription>
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
