
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
import { Fuel, List, PlusCircle, Calendar as CalendarIcon, Beaker, LayoutDashboard } from 'lucide-react';
import { format } from 'date-fns';
import { useTankReadings } from '@/hooks/use-tank-readings';
import { useProducts } from '@/hooks/use-products';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

const tankReadingSchema = z.object({
  productId: z.string().min(1, 'Please select a tank.'),
  volume: z.coerce.number().min(0, 'Volume cannot be negative'),
  date: z.date({ required_error: "A date is required."}),
});

type TankReadingFormValues = z.infer<typeof tankReadingSchema>;

const LOCAL_STORAGE_KEY = 'global-transaction-date';

export default function TankManagementPage() {
  const { tankReadings, addTankReading } = useTankReadings();
  const { products, isLoaded: productsLoaded } = useProducts();
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const fuelProducts = useMemo(() => products.filter(p => p.category === 'Fuel'), [products]);

  const { register, handleSubmit, control, reset, formState: { errors }, watch, setValue } = useForm<TankReadingFormValues>({
    resolver: zodResolver(tankReadingSchema),
    defaultValues: {
        date: new Date(),
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

  const onSubmit: SubmitHandler<TankReadingFormValues> = (data) => {
    const product = products.find(p => p.id === data.productId);
    if (!product) return;

    addTankReading({ 
        productId: data.productId,
        fuelType: product.name as any,
        volume: data.volume,
        timestamp: data.date.toISOString(),
    });
    
    toast({
      title: 'Machine Reading Logged',
      description: `New volume for ${product.name} tank has been recorded as ${data.volume}L and stock has been updated.`,
    });
    const lastDate = watch('date');
    reset({ productId: '', volume: 0, date: lastDate });
  };

  return (
    <div className="p-4 md:p-8 grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlusCircle /> New Machine Reading
            </CardTitle>
            <CardDescription>Enter the reading from the machine for a fuel tank to verify stock.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Tank / Fuel Type</Label>
                <Controller
                  name="productId"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value} defaultValue="">
                      <SelectTrigger>
                        <SelectValue placeholder="Select a tank" />
                      </SelectTrigger>
                      <SelectContent>
                        {productsLoaded ? fuelProducts.map(fuel => (
                          <SelectItem key={fuel.id} value={fuel.id}>{fuel.name} Tank</SelectItem>
                        )) : <SelectItem value="loading" disabled>Loading...</SelectItem>}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.productId && <p className="text-sm text-destructive">{errors.productId.message}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="volume">Current Volume (Litres)</Label>
                <Input id="volume" type="number" {...register('volume')} placeholder="e.g., 12500" step="0.01" />
                {errors.volume && <p className="text-sm text-destructive">{errors.volume.message}</p>}
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
                            field.onChange(date);
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
                A historical record of all machine reading entries.
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
                    <TableHead className="text-right">Volume (L)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tankReadings.map(reading => (
                      <TableRow key={reading.id}>
                        <TableCell className="font-medium">{format(new Date(reading.timestamp), 'PP pp')}</TableCell>
                        <TableCell>{reading.fuelType}</TableCell>
                        <TableCell className="text-right">{reading.volume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
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
