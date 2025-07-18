'use client';

import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Undo2, PackageMinus, ListRestart } from 'lucide-react';
import type { FuelType } from '@/lib/types';
import { format } from 'date-fns';
import { usePurchaseReturns } from '@/hooks/use-purchase-returns';
import { Textarea } from '@/components/ui/textarea';

const FUEL_TYPES: FuelType[] = ['Unleaded', 'Premium', 'Diesel'];

const purchaseReturnSchema = z.object({
  supplier: z.string().min(1, 'Supplier name is required'),
  fuelType: z.enum(FUEL_TYPES, { required_error: 'Please select a fuel type.' }),
  volume: z.coerce.number().min(0.01, 'Volume must be greater than 0'),
  totalRefund: z.coerce.number().min(0.01, 'Total refund must be greater than 0'),
  reason: z.string().min(1, 'Reason for return is required'),
});

type PurchaseReturnFormValues = z.infer<typeof purchaseReturnSchema>;

export default function PurchaseReturnsPage() {
  const { purchaseReturns, addPurchaseReturn } = usePurchaseReturns();
  const { toast } = useToast();
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<PurchaseReturnFormValues>({
    resolver: zodResolver(purchaseReturnSchema),
  });

  const onSubmit: SubmitHandler<PurchaseReturnFormValues> = (data) => {
    addPurchaseReturn(data);
    toast({
      title: 'Purchase Return Recorded',
      description: `Return to ${data.supplier} has been logged.`,
    });
    reset();
  };

  return (
    <div className="p-4 md:p-8 grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Undo2 /> New Purchase Return
            </CardTitle>
            <CardDescription>Record a fuel return to a supplier.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier</Label>
                <Input id="supplier" {...register('supplier')} placeholder="e.g., Shell, PSO" />
                {errors.supplier && <p className="text-sm text-destructive">{errors.supplier.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Fuel Type</Label>
                <Select onValueChange={(value: FuelType) => setValue('fuelType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a fuel type" />
                  </SelectTrigger>
                  <SelectContent>
                    {FUEL_TYPES.map(fuel => (
                      <SelectItem key={fuel} value={fuel}>{fuel}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.fuelType && <p className="text-sm text-destructive">{errors.fuelType.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="volume">Volume (Litres)</Label>
                <Input id="volume" type="number" {...register('volume')} placeholder="e.g., 500" step="0.01" />
                {errors.volume && <p className="text-sm text-destructive">{errors.volume.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalRefund">Total Refund (PKR)</Label>
                <Input id="totalRefund" type="number" {...register('totalRefund')} placeholder="e.g., 100000" step="0.01" />
                {errors.totalRefund && <p className="text-sm text-destructive">{errors.totalRefund.message}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Return</Label>
                <Textarea id="reason" {...register('reason')} placeholder="e.g., Contaminated fuel, wrong type delivered" />
                {errors.reason && <p className="text-sm text-destructive">{errors.reason.message}</p>}
              </div>

              <Button type="submit" className="w-full">Record Return</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListRestart /> Return History
            </CardTitle>
            <CardDescription>
              A record of all fuel returns to suppliers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {purchaseReturns.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Fuel Type</TableHead>
                    <TableHead className="text-right">Volume (L)</TableHead>
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
                        <TableCell>{p.fuelType}</TableCell>
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
