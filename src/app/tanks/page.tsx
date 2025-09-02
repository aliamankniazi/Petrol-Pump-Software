
'use client';

import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Fuel, List, PlusCircle, Beaker, LayoutDashboard, ChevronsUpDown, Check } from 'lucide-react';
import { format } from 'date-fns';
import { useTankReadings } from '@/hooks/use-tank-readings';
import { useProducts } from '@/hooks/use-products';
import { cn } from '@/lib/utils';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DatePickerDropdowns } from '@/components/ui/date-picker-dropdowns';

const tankReadingSchema = z.object({
  productId: z.string().min(1, 'Please select a tank.'),
  meterReading: z.coerce.number().min(0, 'Reading cannot be negative'),
  date: z.date({ required_error: "A date is required."}),
});

type TankReadingFormValues = z.infer<typeof tankReadingSchema>;

export default function TankManagementPage() {
  const { tankReadings, addTankReading } = useTankReadings();
  const { products, isLoaded: productsLoaded } = useProducts();
  const { toast } = useToast();
  
  const [isClient, setIsClient] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [isTankPopoverOpen, setIsTankPopoverOpen] = useState(false);


  useEffect(() => {
    setIsClient(true);
  }, []);

  const fuelProducts = useMemo(() => products.filter(p => p.category === 'Fuel'), [products]);

  const filteredProducts = useMemo(() => {
    if (!productSearch) return fuelProducts;
    return fuelProducts.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()));
  }, [fuelProducts, productSearch]);

  const { register, handleSubmit, control, reset, formState: { errors }, watch } = useForm<TankReadingFormValues>({
    resolver: zodResolver(tankReadingSchema),
    defaultValues: {
        productId: '',
        meterReading: 0,
        date: new Date(),
    }
  });

  const onSubmit: SubmitHandler<TankReadingFormValues> = (data) => {
    const product = products.find(p => p.id === data.productId);
    if (!product) return;

    addTankReading({ 
        productId: data.productId,
        fuelType: product.name as any,
        meterReading: data.meterReading,
        timestamp: data.date.toISOString(),
    });
    
    toast({
      title: 'Machine Reading Logged',
      description: `New meter reading for ${product.name} has been recorded as ${data.meterReading}L and inventory has been updated.`,
    });
    const lastDate = watch('date');
    reset({ productId: '', meterReading: 0, date: lastDate });
  };
  
  const getVarianceColor = (variance: number) => {
      const threshold = 1; // 1L variance tolerance
      if (Math.abs(variance) <= threshold) return 'text-green-600';
      return 'text-destructive';
  }

  if (!isClient) {
    return null;
  }

  return (
    <div className="p-4 md:p-8 grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlusCircle /> New Machine Reading
            </CardTitle>
            <CardDescription>Enter the reading from the pump meter to calculate usage and update stock.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Tank / Fuel Type</Label>
                <Controller
                  name="productId"
                  control={control}
                  render={({ field }) => (
                    <Popover open={isTankPopoverOpen} onOpenChange={setIsTankPopoverOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" className="w-full justify-between">
                                {field.value ? fuelProducts.find(p => p.id === field.value)?.name : "Select a tank"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                                <CommandInput placeholder="Search tank..." onValueChange={setProductSearch} />
                                <CommandList>
                                    <CommandEmpty>No tank found.</CommandEmpty>
                                    <CommandGroup>
                                        {filteredProducts.map(p => (
                                            <CommandItem key={p.id} value={p.id!} onSelect={currentValue => {
                                                field.onChange(currentValue === field.value ? "" : currentValue);
                                                setIsTankPopoverOpen(false);
                                            }}>
                                                <Check className={cn("mr-2 h-4 w-4", field.value === p.id ? "opacity-100" : "opacity-0")} />
                                                {p.name} Tank
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                  )}
                />
                {errors.productId && <p className="text-sm text-destructive">{errors.productId.message}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="meterReading">Current Meter Reading</Label>
                <Input id="meterReading" type="number" {...register('meterReading')} placeholder="e.g., 12500" step="any" />
                {errors.meterReading && <p className="text-sm text-destructive">{errors.meterReading.message}</p>}
              </div>

               <div className="space-y-2">
                <Label>Date</Label>
                <Controller
                  name="date"
                  control={control}
                  render={({ field }) => (
                    <DatePickerDropdowns date={field.value} onDateChange={field.onChange} />
                  )}
                />
                {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
              </div>

              <Button type="submit" className="w-full">Log Reading</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Card>
          <CardHeader className="flex flex-row justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <List /> Machine Reading History
              </CardTitle>
              <CardDescription>
                A historical record of all pump meter readings and calculated variances.
              </CardDescription>
            </div>
             <Button asChild variant="outline">
                <Link href="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" /> Go to Dashboard</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {tankReadings.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Tank</TableHead>
                    <TableHead className="text-right">Meter Reading</TableHead>
                    <TableHead className="text-right">Usage</TableHead>
                    <TableHead className="text-right">Sold</TableHead>
                    <TableHead className="text-right">Variance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tankReadings.map(reading => (
                      <TableRow key={reading.id}>
                        <TableCell className="font-medium">{format(new Date(reading.timestamp), 'PP pp')}</TableCell>
                        <TableCell>{reading.fuelType}</TableCell>
                        <TableCell className="text-right font-mono font-bold">{reading.meterReading.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        <TableCell className="text-right font-mono font-bold text-blue-600">{reading.calculatedUsage?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        <TableCell className="text-right font-mono font-bold text-green-600">{reading.salesSinceLastReading?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        <TableCell className={cn("text-right font-mono font-bold", getVarianceColor(reading.variance || 0))}>
                            {reading.variance?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                <Beaker className="w-16 h-16" />
                <h3 className="text-xl font-semibold">No Machine Readings Found</h3>
                <p>Use the form to log your first machine reading.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
