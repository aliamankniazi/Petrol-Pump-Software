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
  adjustment: z.coerce.number(),
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
  const { fuelStock, setFuelStock, clearFuelStock, isLoaded: stockLoaded } = useFuelStock();
  const { toast } = useToast();

  const { register, handleSubmit, control, reset, watch } = useForm<AdjustmentFormValues>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      adjustment: 0,
    }
  });

  const selectedFuelType = watch('fuelType');
  const adjustmentValue = watch('adjustment');
  const currentStock = selectedFuelType ? fuelStock[selectedFuelType] : 0;
  const newStock = currentStock + (adjustmentValue || 0);

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
    const currentStock = fuelStock[data.fuelType] || 0;
    const newStock = currentStock + data.adjustment;
    if (newStock < 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid Adjustment',
        description: 'Stock level cannot be negative.',
      });
      return;
    }
    setFuelStock(data.fuelType, newStock);
    toast({
      title: 'Stock Adjusted',
      description: `${data.fuelType} stock has been set to ${newStock.toLocaleString()} L.`,
    });
    reset({ fuelType: data.fuelType, adjustment: 0 });
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
                  Manually adjust the current stock level for a fuel type.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onAdjustmentSubmit)} className="space-y-4">
                   <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2 md:col-span-1">
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
                    </div>
                    <div className="space-y-2 md:col-span-1">
                      <Label htmlFor="currentStock">Current Stock (L)</Label>
                      <Input id="currentStock" type="number" value={stockLoaded ? currentStock.toFixed(2) : "Loading..."} readOnly disabled className="bg-muted/50" />
                    </div>
                    <div className="space-y-2 md:col-span-1">
                      <Label htmlFor="adjustment">Adjustment (L)</Label>
                      <Input id="adjustment" type="number" {...register('adjustment')} placeholder="e.g., -50 or 100" step="0.01" />
                    </div>
                     <div className="space-y-2 md:col-span-1">
                      <Label htmlFor="newStock">New Stock (L)</Label>
                      <Input id="newStock" type="number" value={selectedFuelType ? newStock.toFixed(2) : "..."} readOnly disabled className="bg-muted/50 font-bold" />
                    </div>
                  </div>
                  <Button type="submit" disabled={!selectedFuelType || !stockLoaded}>Adjust Stock</Button>
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
