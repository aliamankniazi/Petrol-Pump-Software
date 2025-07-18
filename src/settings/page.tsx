'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { Settings, Trash2, AlertTriangle, Droplets } from 'lucide-react';
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
import { useExpenses } from '@/hooks/use-expenses';

const FUEL_TYPES: FuelType[] = ['Unleaded', 'Premium', 'Diesel'];

export default function SettingsPage() {
  const { clearTransactions } = useTransactions();
  const { clearPurchases } = usePurchases();
  const { clearExpenses } = useExpenses();
  const { fuelPrices, updateFuelPrice, isLoaded } = useFuelPrices();
  const { toast } = useToast();

  const handleClearData = () => {
    clearTransactions();
    clearPurchases();
    clearExpenses();
    toast({
      title: "Data Cleared",
      description: "All transaction, purchase, and expense history has been removed.",
    });
  };

  const handlePriceChange = (fuelType: FuelType, value: string) => {
    const price = parseFloat(value);
    if (!isNaN(price)) {
      updateFuelPrice(fuelType, price);
    }
  };

  return (
    <div className="p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings /> Settings
          </CardTitle>
          <CardDescription>Customize application settings and fuel prices.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Fuel Prices</h3>
            <div className="space-y-4">
              {isLoaded && FUEL_TYPES.map(fuel => (
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
            </div>
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
                  This will permanently delete all transaction, purchase, and expense history. This action cannot be undone.
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
                      This action cannot be undone. This will permanently delete all your transaction, purchase and expense data from this device.
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
