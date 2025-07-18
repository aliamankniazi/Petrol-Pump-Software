
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
import { ArrowRightLeft, ListChecks, Wallet } from 'lucide-react';
import { format } from 'date-fns';
import { useCustomers } from '@/hooks/use-customers';
import { useCashAdvances } from '@/hooks/use-cash-advances';
import { Textarea } from '@/components/ui/textarea';

const cashAdvanceSchema = z.object({
  customerId: z.string().min(1, 'Please select a customer.'),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  notes: z.string().optional(),
});

type CashAdvanceFormValues = z.infer<typeof cashAdvanceSchema>;

export default function CashAdvancesPage() {
  const { customers, isLoaded: customersLoaded } = useCustomers();
  const { cashAdvances, addCashAdvance } = useCashAdvances();
  const { toast } = useToast();
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<CashAdvanceFormValues>({
    resolver: zodResolver(cashAdvanceSchema),
  });

  const onSubmit: SubmitHandler<CashAdvanceFormValues> = (data) => {
    const customer = customers.find(c => c.id === data.customerId);
    if (!customer) return;

    addCashAdvance({ 
      ...data,
      customerName: customer.name,
    });
    
    toast({
      title: 'Cash Advance Recorded',
      description: `Cash advance of PKR ${data.amount} to ${customer.name} has been logged.`,
    });
    reset({ customerId: '', amount: 0, notes: '' });
  };

  return (
    <div className="p-4 md:p-8 grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet /> New Cash Advance
            </CardTitle>
            <CardDescription>Record a cash payment made to a customer.</CardDescription>
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


              <Button type="submit" className="w-full">Record Cash Advance</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListChecks /> Cash Advance History
            </CardTitle>
            <CardDescription>
              A record of all cash advances given to customers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {cashAdvances.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cashAdvances.map(ca => (
                      <TableRow key={ca.id}>
                        <TableCell className="font-medium">{format(new Date(ca.timestamp), 'PP pp')}</TableCell>
                        <TableCell>{ca.customerName}</TableCell>
                        <TableCell>{ca.notes || 'N/A'}</TableCell>
                        <TableCell className="text-right">PKR {ca.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                <ArrowRightLeft className="w-16 h-16" />
                <h3 className="text-xl font-semibold">No Cash Advances Recorded</h3>
                <p>Use the form to log your first cash advance to a customer.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
