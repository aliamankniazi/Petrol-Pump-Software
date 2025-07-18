'use client';

import { useState } from 'react';
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
import { ShoppingCart, Package, Truck } from 'lucide-react';
import type { FuelType, Purchase } from '@/lib/types';
import { format } from 'date-fns';

const FUEL_TYPES: FuelType[] = ['Unleaded', 'Premium', 'Diesel'];

const purchaseSchema = z.object({
  supplier: z.string().min(1, 'Supplier name is required'),
  fuelType: z.enum(FUEL_TYPES, { required_error: 'Please select a fuel type.' }),
  volume: z.coerce.number().min(1, 'Volume must be greater than 0'),
  totalCost: z.coerce.number().min(1, 'Total cost must be greater than 0'),
});

type PurchaseFormValues = z.infer<typeof purchaseSchema>;

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const { toast } = useToast();
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseSchema),
  });

  const onSubmit: SubmitHandler<PurchaseFormValues> = (data) => {
    const newPurchase: Purchase = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...data,
    };
    setPurchases(prev => [newPurchase, ...prev]);
    toast({
      title: 'Purchase Recorded',
      description: `Delivery from ${data.supplier} has been logged.`,
    });
    reset();
  };

  return (
    <div className="p-4 md:p-8 grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck /> New Purchase
            </CardTitle>
            <CardDescription>Record a new fuel delivery.</CardDescription>
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
                <Input id="volume" type="number" {...register('volume')} placeholder="e.g., 5000" />
                {errors.volume && <p className="text-sm text-destructive">{errors.volume.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalCost">Total Cost (PKR)</Label>
                <Input id="totalCost" type="number" {...register('totalCost')} placeholder="e.g., 1000000" />
                {errors.totalCost && <p className="text-sm text-destructive">{errors.totalCost.message}</p>}
              </div>

              <Button type="submit" className="w-full">Record Purchase</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart /> Purchase History
            </CardTitle>
            <CardDescription>
              A record of all incoming stock and fuel deliveries.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {purchases.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Fuel Type</TableHead>
                    <TableHead className="text-right">Volume (L)</TableHead>
                    <TableHead className="text-right">Total Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{format(new Date(p.timestamp), 'PP')}</TableCell>
                      <TableCell>{p.supplier}</TableCell>
                      <TableCell>{p.fuelType}</TableCell>
                      <TableCell className="text-right">{p.volume.toLocaleString()}</TableCell>
                      <TableCell className="text-right">PKR {p.totalCost.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                <Package className="w-16 h-16" />
                <h3 className="text-xl font-semibold">No Purchases Recorded</h3>
                <p>Use the form to log your first fuel delivery.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
