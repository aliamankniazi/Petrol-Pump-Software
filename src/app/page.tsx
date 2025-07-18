'use client';

import { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Numpad } from '@/components/numpad';
import { useTransactions } from '@/hooks/use-transactions';
import type { FuelType, PaymentMethod } from '@/lib/types';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Fuel, Droplets, CreditCard, Wallet, Smartphone } from 'lucide-react';

const FUEL_PRICES: Record<FuelType, number> = {
  'Unleaded': 1.80,
  'Premium': 2.10,
  'Diesel': 2.00,
};

const FUEL_TYPES: FuelType[] = ['Unleaded', 'Premium', 'Diesel'];

export default function SalePage() {
  const { addTransaction } = useTransactions();
  const [amountStr, setAmountStr] = useState('0');
  const [selectedFuel, setSelectedFuel] = useState<FuelType>('Unleaded');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<{ amount: number; volume: number; fuelType: FuelType } | null>(null);

  const amountNum = useMemo(() => parseFloat(amountStr) || 0, [amountStr]);
  const volume = useMemo(() => {
    const pricePerLitre = FUEL_PRICES[selectedFuel];
    if (!pricePerLitre || pricePerLitre === 0) return 0;
    return amountNum / pricePerLitre;
  }, [amountNum, selectedFuel]);

  const handleNumpadPress = useCallback((key: string) => {
    if (key === 'C') {
      setAmountStr('0');
      return;
    }
    if (key === '.' && amountStr.includes('.')) {
      return;
    }
    if (amountStr === '0' && key !== '.') {
      setAmountStr(key);
    } else if (amountStr.length < 7) {
      if (amountStr.includes('.') && amountStr.split('.')[1].length >= 2) return;
      setAmountStr(amountStr + key);
    }
  }, [amountStr]);

  const handlePayment = (paymentMethod: PaymentMethod) => {
    if (amountNum <= 0) return;
    
    const transaction = {
      fuelType: selectedFuel,
      volume: parseFloat(volume.toFixed(2)),
      pricePerLitre: FUEL_PRICES[selectedFuel],
      totalAmount: amountNum,
      paymentMethod,
    };
    
    addTransaction(transaction);
    setLastTransaction({
      amount: amountNum,
      volume: parseFloat(volume.toFixed(2)),
      fuelType: selectedFuel
    });
    setShowConfirmation(true);
  };

  const resetSale = () => {
    setAmountStr('0');
    setSelectedFuel('Unleaded');
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
          <div className="text-center bg-muted/50 p-6 rounded-lg shadow-inner">
            <div className="text-5xl md:text-7xl font-bold tracking-tighter text-primary">
              ${amountNum.toFixed(2)}
            </div>
            <div className="text-lg md:text-xl text-muted-foreground mt-2 flex items-center justify-center gap-2">
              <Droplets className="w-5 h-5" />
              <span>{volume.toFixed(2)} Litres</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {FUEL_TYPES.map(fuel => (
              <Button
                key={fuel}
                variant={selectedFuel === fuel ? 'default' : 'outline'}
                className="py-6 text-base"
                onClick={() => setSelectedFuel(fuel)}
              >
                {fuel}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Button className="py-6 text-base" onClick={() => handlePayment('Cash')} disabled={amountNum <= 0}>
              <Wallet className="mr-2" /> Cash
            </Button>
            <Button className="py-6 text-base" onClick={() => handlePayment('Card')} disabled={amountNum <= 0}>
              <CreditCard className="mr-2" /> Card
            </Button>
            <Button className="py-6 text-base" onClick={() => handlePayment('Mobile')} disabled={amountNum <= 0}>
              <Smartphone className="mr-2" /> Mobile
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card className="flex-1 lg:flex-grow-[1]">
        <CardHeader>
          <CardTitle>Enter Amount</CardTitle>
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
              A sale of {lastTransaction?.volume}L of {lastTransaction?.fuelType} for ${lastTransaction?.amount.toFixed(2)} has been recorded.
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
