
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
import { Fuel, List, PlusCircle, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import type { FuelType } from '@/lib/types';
import { useTankReadings } from '@/hooks/use-tank-readings';
import { useFuelStock } from '@/hooks/use-fuel-stock';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

const FUEL_TYPES: FuelType[] = ['Unleaded', 'Premium', 'Diesel'];

const tankReadingSchema = z.object({
  fuelType: z.enum(FUEL_TYPES, { required_error: 'Please select a tank.' }),
  volume: z.coerce.number().min(0, 'Volume cannot be negative'),
  date: z.date({ required_error: "A date is required."}),
});

type TankReadingFormValues = z.infer<typeof tankReadingSchema>;

export default function TankManagementPage() {
  const { tankReadings, addTankReading } = useTankReadings();
  const { setFuelStock } = useFuelStock();
  const { toast } = useToast();
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<TankReadingFormValues>({
    resolver: zodResolver(tankReadingSchema),
    defaultValues: {
        date: new Date(),
    }
  });

  const onSubmit: SubmitHandler<TankReadingFormValues> = (data) => {
    addTankReading({ 
        fuelType: data.fuelType,
        volume: data.volume,
        timestamp: data.date.toISOString(),
    });
    setFuelStock(data.fuelType, data.volume);
    toast({
      title: 'Tank Reading Logged',
      description: `New volume for ${data.fuelType} tank has been recorded as ${data.volume}L.`,
    });
    reset({ volume: 0, date: new Date() });
  };

  return (
    <div className="p-4 md:p-8 grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlusCircle /> New Tank Reading
            </CardTitle>
            <CardDescription>Enter the current volume for a fuel tank.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Tank / Fuel Type</Label>
                <Controller
                  name="fuelType"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value} defaultValue="">
                      <SelectTrigger>
                        <SelectValue placeholder="Select a tank" />
                      </SelectTrigger>
                      <SelectContent>
                        {FUEL_TYPES.map(fuel => (
                          <SelectItem key={fuel} value={fuel}>{fuel} Tank</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.fuelType && <p className="text-sm text-destructive">{errors.fuelType.message}</p>}
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

              <Button type="submit" className="w-full">Log Reading</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <List /> Tank Reading History
            </CardTitle>
            <CardDescription>
              A historical record of all tank volume entries.
            </CardDescription>
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
                <Fuel className="w-16 h-16" />
                <h3 className="text-xl font-semibold">No Tank Readings Found</h3>
                <p>Use the form to log your first tank volume reading.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
