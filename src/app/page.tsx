'use client';

import { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Numpad } from '@/components/numpad';
import { useTransactions } from '@/hooks/use-transactions';
import type { FuelType, PaymentMethod, Customer } from '@/lib/types';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Fuel, Droplets, CreditCard, Wallet, Smartphone, Users, HandCoins } from 'lucide-react';
import { useFuelPrices } from '@/hooks/use-fuel-prices';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCustomers } from '@/hooks/use-customers';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useCustomerPayments } from '@/hooks/use-customer-payments';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';

const FUEL_TYPES: FuelType[] = ['Unleaded', 'Premium', 'Diesel'];

type SaleMode = 'amount' | 'liters';
type PageMode = 'sale' | 'payment';

export default function SalePage() {
  const { addTransaction } = useTransactions();
  const { addCustomerPayment } = useCustomerPayments();
  const { toast } = useToast();
  const { fuelPrices, isLoaded: pricesLoaded } = useFuelPrices();
  const { customers, isLoaded: customersLoaded } = useCustomers();
  
  const [inputStr, setInputStr] = useState('0');
  const [mode, setMode] = useState<SaleMode>('amount');
  const [selectedFuel, setSelectedFuel] = useState<FuelType>('Unleaded');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<{ amount: number; volume: number; fuelType: FuelType, customerName?: string } | null>(null);

  // State for Customer Payment
  const [paymentCustomerId, setPaymentCustomerId] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [pageMode, setPageMode] = useState<PageMode>('sale');

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
    if (pageMode === 'payment') return; // Numpad is for sales only
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
  }, [inputStr, pageMode]);
  
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
  
  const handleCustomerPayment = (paymentMethod: PaymentMethod) => {
    const amountNum = parseFloat(paymentAmount);
    if (!paymentCustomerId || !amountNum || amountNum <= 0) {
      toast({
        variant: "destructive",
        title: 'Invalid Payment',
        description: 'Please select a customer and enter a valid payment amount.',
      });
      return;
    }
    
    const customer = customers.find(c => c.id === paymentCustomerId);
    if (!customer) return;

    addCustomerPayment({
      customerId: customer.id,
      customerName: customer.name,
      amount: amountNum,
      paymentMethod,
    });

    toast({
      title: 'Payment Recorded',
      description: `Payment of PKR ${amountNum.toFixed(2)} from ${customer.name} has been recorded.`,
    });

    // Reset form
    setPaymentCustomerId('');
    setPaymentAmount('');
  };

  const resetSale = () => {
    setInputStr('0');
    setMode('amount');
    setSelectedFuel('Unleaded');
    setSelectedCustomerId(null);
    setShowConfirmation(false);
    setLastTransaction(null);
  };
  
  const selectedCustomerForPayment = customers.find(c => c.id === paymentCustomerId);

  return (
    <div className="flex flex-col lg:flex-row gap-8 p-4 md:p-8 h-full">
      <div className="flex-1 lg:flex-grow-[2] flex flex-col">
        <Tabs value={pageMode} onValueChange={(value) => setPageMode(value as PageMode)} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="sale"><Fuel className="mr-2" /> New Sale</TabsTrigger>
              <TabsTrigger value="payment"><HandCoins className="mr-2" /> Customer Payment</TabsTrigger>
            </TabsList>
            <TabsContent value="sale">
                <Card className="flex-1 flex flex-col">
                    <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        Enter Sale Details
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
            </TabsContent>
            <TabsContent value="payment">
                <Card>
                    <CardHeader>
                        <CardTitle>Record Customer Payment</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="payment-customer">Customer</Label>
                            {!customersLoaded ? <Skeleton className="h-10 w-full" /> : (
                                <Select onValueChange={(value) => setPaymentCustomerId(value)} value={paymentCustomerId}>
                                    <SelectTrigger id="payment-customer">
                                        <SelectValue placeholder="Select a customer to pay" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {customers.map(customer => (
                                        <SelectItem key={customer.id} value={customer.id}>
                                            {customer.name}
                                        </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                        <div className="space-y-2">
                             <Label htmlFor="payment-amount">Amount (PKR)</Label>
                             <Input 
                                id="payment-amount"
                                type="number"
                                placeholder="Enter amount received"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                                step="0.01"
                             />
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                            <Button className="py-6 text-base" onClick={() => handleCustomerPayment('Cash')} disabled={!paymentCustomerId || !paymentAmount}>
                            <Wallet className="mr-2" /> Cash
                            </Button>
                            <Button className="py-6 text-base" onClick={() => handleCustomerPayment('Card')} disabled={!paymentCustomerId || !paymentAmount}>
                            <CreditCard className="mr-2" /> Card
                            </Button>
                            <Button className="py-6 text-base" onClick={() => handleCustomerPayment('Mobile')} disabled={!paymentCustomerId || !paymentAmount}>
                            <Smartphone className="mr-2" /> Mobile
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
      </div>
      <Card className="flex-1 lg:flex-grow-[1]">
        <CardHeader>
          <CardTitle>Enter {pageMode === 'sale' ? (mode === 'amount' ? 'Amount (PKR)' : 'Volume (L)') : 'Calculator'}</CardTitle>
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
