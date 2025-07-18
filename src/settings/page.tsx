'use client';

import * as React from 'react';
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { Settings, Trash2, AlertTriangle, Droplets, Package, Edit } from 'lucide-react';
import { useTransactions } from '@/hooks/use-transactions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { useFuelPrices } from '@/hooks/use-fuel-prices';
import type { FuelType } from '@/lib/types';
import { usePurchases } from '@/hooks/use-purchases';
import { usePurchaseReturns } from '@/hooks/use-purchase-returns';
import { useExpenses } from '@/hooks/use-expenses';
import { useCustomers } from '@/hooks/use-customers';
import { useBankAccounts } from '@/hooks/use-bank-accounts';
import { useEmployees } from '@/hooks/use-employees';
import { useFuelStock } from '@/hooks/use-fuel-stock';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCustomerPayments } from '@/hooks/use-customer-payments';
import { useCashAdvances } from '@/hooks/use-cash-advances';

const FUEL_TYPES: FuelType[] = ['Unleaded', 'Premium', 'Diesel'];

const adjustmentSchema = z.object({
  fuelType: z.enum(FUEL_TYPES, { required_error: 'Please select a fuel type.' }),
  newStock: z.coerce.number().min(0, 'Stock cannot be negative'),
});

type AdjustmentFormValues = z.infer<typeof adjustmentSchema>;

export default function SettingsPage() {
  const { clearTransactions } = useTransactions();
  const { clearPurchases } = usePurchases();
  const { clearPurchaseReturns } = usePurchaseReturns();
  const { clearExpenses } = useExpenses();
  const { clearCustomers } = useCustomers();
  const { clearBankAccounts } = useBankAccounts();
  const { clearEmployees } = useEmployees();
  const { clearCustomerPayments } = useCustomerPayments();
  const { clearCashAdvances } = useCashAdvances();
  const { fuelPrices, updateFuelPrice, clearFuelPrices, isLoaded: pricesLoaded } = useFuelPrices();
  const { setFuelStock, clearFuelStock } = useFuelStock();
  const { toast } = useToast();

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<AdjustmentFormValues>({
    resolver: zodResolver(adjustmentSchema),
  });

  const handleClearData = () => {
    clearTransactions();
    clearPurchases();
    clearPurchaseReturns();
    clearExpenses();
    clearCustomers();
    clearBankAccounts();
    clearEmployees();
    clearFuelPrices();
    clearFuelStock();
    clearCustomerPayments();
    clearCashAdvances();
    toast({
      title: "Data Cleared",
      description: "All application data has been removed.",
    });
  };

  const handlePriceChange = (fuelType: FuelType, value: string) => {
    const price = parseFloat(value);
    if (!isNaN(price)) {
      updateFuelPrice(fuelType, price);
    }
  };

  const onAdjustmentSubmit: SubmitHandler<AdjustmentFormValues> = (data) => {
    setFuelStock(data.fuelType, data.newStock);
    toast({
      title: 'Stock Adjusted',
      description: `${data.fuelType} stock has been set to ${data.newStock.toLocaleString()} L.`,
    });
    reset();
  };

  return (
    <div className="p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings /> Settings
          </CardTitle>
          <CardDescription>Customize application settings, fuel prices, and inventory.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Fuel Prices</h3>
            <div className="space-y-4">
              {pricesLoaded && FUEL_TYPES.map(fuel => (
                <div key={fuel} className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <Label htmlFor={`${fuel}-price`} className="flex items-center gap-2"><Droplets className="w-4 h-4" /> {fuel} Price (PKR/L)</Label>
                    <p className="text-sm text-muted-foreground">
                      Set the price per litre for {fuel}.
                    </p>
                  </div>
                  <Input 
                    id={`${fuel}-price`} 
                    type="number" 
                    value={fuelPrices[fuel] || ''} 
                    onChange={(e) => handlePriceChange(fuel, e.target.value)}
                    className="w-28" 
                    step="0.01"
                  />
                </div>
              ))}
              {!pricesLoaded && Array.from({length: 3}).map((_, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border p-4">
                  <div className='space-y-2'>
                    <div className="h-6 w-48 bg-muted rounded-md animate-pulse" />
                    <div className="h-4 w-64 bg-muted rounded-md animate-pulse" />
                  </div>
                  <div className="w-28 h-10 bg-muted rounded-md animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          <Separator />
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2"><Package /> Product Adjustment</h3>
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2"><Edit /> Manual Stock Adjustment</CardTitle>
                <CardDescription>
                  Manually set the current stock level for a fuel type. This will override the calculated value.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onAdjustmentSubmit)} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Fuel Type</Label>
                       <Controller
                        name="fuelType"
                        control={control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    <div className="space-y-2">
                      <Label htmlFor="newStock">New Stock Level (Litres)</Label>
                      <Input id="newStock" type="number" {...register('newStock')} placeholder="e.g., 15000" step="0.01" />
                      {errors.newStock && <p className="text-sm text-destructive">{errors.newStock.message}</p>}
                    </div>
                  </div>
                  <Button type="submit">Set Stock</Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Appearance</h3>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label>Theme</Label>
                <p className="text-sm text-muted-foreground">
                  Switch between light and dark mode.
                </p>
              </div>
              <ThemeToggle />
            </div>
          </div>
          
          <Separator />

          <div className="space-y-4">
             <h3 className="text-lg font-medium text-destructive">Danger Zone</h3>
            <div className="flex items-center justify-between rounded-lg border border-destructive/50 p-4">
              <div>
                <Label htmlFor="clear-data" className="text-destructive">Clear All Data</Label>
                <p className="text-sm text-muted-foreground">
                  This will permanently delete all application data. This action cannot be undone.
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" id="clear-data">
                    <Trash2 className="mr-2 h-4 w-4" /> Clear Data
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle/>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete all your application data from this device.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearData}>
                      Yes, delete all data
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
