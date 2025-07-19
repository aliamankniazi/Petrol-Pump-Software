
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
import { ShoppingCart, Package, Truck, Calendar as CalendarIcon } from 'lucide-react';
import type { FuelType } from '@/lib/types';
import { format } from 'date-fns';
import { usePurchases } from '@/hooks/use-purchases';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

const FUEL_TYPES: FuelType[] = ['Unleaded', 'Premium', 'Diesel'];

const purchaseSchema = z.object({
  supplier: z.string().min(1, 'Supplier name is required'),
  fuelType: z.enum(FUEL_TYPES, { required_error: 'Please select a fuel type.' }),
  volume: z.coerce.number().min(0.01, 'Volume must be greater than 0'),
  totalCost: z.coerce.number().min(0.01, 'Total cost must be greater than 0'),
  date: z.date({ required_error: "A date is required."}),
});

type PurchaseFormValues = z.infer<typeof purchaseSchema>;

export default function PurchasesPage() {
  const { purchases, addPurchase } = usePurchases();
  const { toast } = useToast();
  const { register, handleSubmit, reset, setValue, control, formState: { errors } } = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      date: new Date(),
    }
  });

  const onSubmit: SubmitHandler<PurchaseFormValues> = (data) => {
    addPurchase({
      ...data,
      timestamp: data.date.toISOString(),
    });
    toast({
      title: 'Purchase Recorded',
      description: `Delivery from ${data.supplier} has been logged.`,
    });
    reset({
        supplier: '',
        volume: 0,
        totalCost: 0,
        date: new Date(),
    });
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
                <Controller
                  name="fuelType"
                  control={control}
                  render={({ field }) => (
                     <Select onValueChange={field.onChange} value={field.value} defaultValue="">
                      <SelectTrigger>
                        <SelectValue placeholder="Select a fuel type" />
                      </SelectTrigger>
                      <SelectContent>
                        {FUEL_TYPES.map(fuel => (
                          <SelectItem key={fuel} value={fuel}>{fuel}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.fuelType && <p className="text-sm text-destructive">{errors.fuelType.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="volume">Volume (Litres)</Label>
                  <Input id="volume" type="number" {...register('volume')} placeholder="e.g., 5000" step="0.01" />
                  {errors.volume && <p className="text-sm text-destructive">{errors.volume.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="totalCost">Total Cost (PKR)</Label>
                  <Input id="totalCost" type="number" {...register('totalCost')} placeholder="e.g., 1000000" step="0.01" />
                  {errors.totalCost && <p className="text-sm text-destructive">{errors.totalCost.message}</p>}
                </div>
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
                    <TableHead className="text-right">Cost/Litre</TableHead>
                    <TableHead className="text-right">Total Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.map(p => {
                    const rate = p.totalCost / p.volume;
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{format(new Date(p.timestamp), 'PP')}</TableCell>
                        <TableCell>{p.supplier}</TableCell>
                        <TableCell>{p.fuelType}</TableCell>
                        <TableCell className="text-right">{p.volume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        <TableCell className="text-right">PKR {rate.toFixed(2)}</TableCell>
                        <TableCell className="text-right">PKR {p.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                      </TableRow>
                    );
                  })}
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
