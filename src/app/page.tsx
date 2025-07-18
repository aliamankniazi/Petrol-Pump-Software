'use client';

import { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Numpad } from '@/components/numpad';
import { useTransactions } from '@/hooks/use-transactions';
import type { FuelType, PaymentMethod } from '@/lib/types';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Fuel, Droplets, CreditCard, Wallet, Smartphone, Users } from 'lucide-react';
import { useFuelPrices } from '@/hooks/use-fuel-prices';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCustomers } from '@/hooks/use-customers';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const FUEL_TYPES: FuelType[] = ['Unleaded', 'Premium', 'Diesel'];

type SaleMode = 'amount' | 'liters';

export default function SalePage() {
  const { addTransaction } = useTransactions();
  const { fuelPrices, isLoaded: pricesLoaded } = useFuelPrices();
  const { customers, isLoaded: customersLoaded } = useCustomers();
  
  const [inputStr, setInputStr] = useState('0');
  const [mode, setMode] = useState<SaleMode>('amount');
  const [selectedFuel, setSelectedFuel] = useState<FuelType>('Unleaded');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<{ amount: number; volume: number; fuelType: FuelType, customerName?: string } | null>(null);

  const { amount, volume } = useMemo(() => {
    const pricePerLitre = fuelPrices[selectedFuel] || 1;
    const inputNum = parseFloat(inputStr) || 0;

    if (mode === 'amount') {
      const calculatedVolume = pricePerLitre > 0 ? inputNum / pricePerLitre : 0;
      return { amount: inputNum, volume: calculatedVolume };
    } else { // mode is 'liters'
      const calculatedAmount = inputNum * pricePerLitre;
      return { amount: calculatedAmount, volume: inputNum };
    }
  }, [inputStr, mode, selectedFuel, fuelPrices]);

  const handleNumpadPress = useCallback((key: string) => {
    if (key === 'C') {
      setInputStr('0');
      return;
    }
    if (key === '.' && inputStr.includes('.')) {
      return;
    }
    if (inputStr === '0' && key !== '.') {
      setInputStr(key);
    } else if (inputStr.length < 7) {
      if (inputStr.includes('.') && inputStr.split('.')[1].length >= 2) return;
      setInputStr(prev => prev + key);
    }
  }, [inputStr]);
  
  const handleModeChange = (newMode: SaleMode) => {
      if (mode !== newMode) {
          setMode(newMode);
          setInputStr('0');
      }
  }

  const handlePayment = (paymentMethod: PaymentMethod) => {
    if (amount <= 0 || volume <= 0) return;
    
    const customer = customers.find(c => c.id === selectedCustomerId);

    const transaction = {
      fuelType: selectedFuel,
      volume: parseFloat(volume.toFixed(2)),
      pricePerLitre: fuelPrices[selectedFuel],
      totalAmount: parseFloat(amount.toFixed(2)),
      paymentMethod,
      customerId: customer?.id,
      customerName: customer?.name,
    };
    
    addTransaction(transaction);
    setLastTransaction({
      amount: parseFloat(amount.toFixed(2)),
      volume: parseFloat(volume.toFixed(2)),
      fuelType: selectedFuel,
      customerName: customer?.name,
    });
    setShowConfirmation(true);
  };

  const resetSale = () => {
    setInputStr('0');
    setMode('amount');
    setSelectedFuel('Unleaded');
    setSelectedCustomerId(null);
    setShowConfirmation(false);
    setLastTransaction(null);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 p-4 md:p-8 h-full">
      <Card className="flex-1 lg:flex-grow-[2] flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fuel className="text-primary" /> New Sale
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6 flex-grow">
          <Tabs value={mode} onValueChange={(value) => handleModeChange(value as SaleMode)} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="amount">By Amount (PKR)</TabsTrigger>
              <TabsTrigger value="liters">By Volume (L)</TabsTrigger>
            </TabsList>
            <div className="text-center bg-muted/50 p-6 rounded-lg shadow-inner mt-4">
               <div className="text-sm text-muted-foreground">{mode === 'amount' ? 'Amount to Pay' : 'Calculated Amount'}</div>
               <div className="text-5xl md:text-7xl font-bold tracking-tighter text-primary">
                 PKR {amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
               </div>
              <div className="mt-4 text-sm text-muted-foreground">{mode === 'liters' ? 'Volume to Dispense' : 'Calculated Volume'}</div>
               <div className="text-lg md:text-xl text-foreground mt-1 flex items-center justify-center gap-2">
                 <Droplets className="w-5 h-5 text-primary" />
                 <span>{volume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Litres</span>
               </div>
             </div>
          </Tabs>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Users /> Customer</Label>
                  {!customersLoaded ? <Skeleton className="h-10 w-full" /> : (
                    <Select onValueChange={(value) => setSelectedCustomerId(value === 'walk-in' ? null : value)} defaultValue="walk-in">
                        <SelectTrigger>
                            <SelectValue placeholder="Select a customer" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="walk-in">Walk-in Customer</SelectItem>
                            {customers.map(customer => (
                            <SelectItem key={customer.id} value={customer.id}>
                                {customer.name}
                            </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                  )}
              </div>
          </div>
          
          {!pricesLoaded && <div className="grid grid-cols-3 gap-4"><Skeleton className="h-[5rem]"/><Skeleton className="h-[5rem]"/><Skeleton className="h-[5rem]"/></div>}
          {pricesLoaded && (
            <div className="grid grid-cols-3 gap-4">
              {FUEL_TYPES.map(fuel => (
                <Button
                  key={fuel}
                  variant={selectedFuel === fuel ? 'default' : 'outline'}
                  className="py-6 text-base flex-col h-auto"
                  onClick={() => setSelectedFuel(fuel)}
                >
                  <span>{fuel}</span>
                  <span className="text-xs text-muted-foreground">PKR {fuelPrices[fuel].toFixed(2)}/L</span>
                </Button>
              ))}
            </div>
          )}


          <div className="grid grid-cols-3 gap-4">
            <Button className="py-6 text-base" onClick={() => handlePayment('Cash')} disabled={amount <= 0 || !pricesLoaded}>
              <Wallet className="mr-2" /> Cash
            </Button>
            <Button className="py-6 text-base" onClick={() => handlePayment('Card')} disabled={amount <= 0 || !pricesLoaded}>
              <CreditCard className="mr-2" /> Card
            </Button>
            <Button className="py-6 text-base" onClick={() => handlePayment('Mobile')} disabled={amount <= 0 || !pricesLoaded}>
              <Smartphone className="mr-2" /> Mobile
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card className="flex-1 lg:flex-grow-[1]">
        <CardHeader>
          <CardTitle>Enter {mode === 'amount' ? 'Amount (PKR)' : 'Volume (L)'}</CardTitle>
        </CardHeader>
        <CardContent>
          <Numpad onKeyPress={handleNumpadPress} />
        </CardContent>
      </Card>

      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Transaction Complete</AlertDialogTitle>
            <AlertDialogDescription>
              A sale of {lastTransaction?.volume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}L of {lastTransaction?.fuelType} for PKR {lastTransaction?.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} has been recorded{lastTransaction?.customerName ? ` for ${lastTransaction.customerName}` : ''}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={resetSale}>New Sale</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
