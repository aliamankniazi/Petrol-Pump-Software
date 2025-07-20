
'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Numpad } from '@/components/numpad';
import { useTransactions } from '@/hooks/use-transactions';
import type { FuelType, PaymentMethod, Customer } from '@/lib/types';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Fuel, Droplets, CreditCard, Wallet, Smartphone, Users, HandCoins, DollarSign, Calendar as CalendarIcon, Edit, HelpCircle, Landmark } from 'lucide-react';
import { useFuelPrices } from '@/hooks/use-fuel-prices';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCustomers } from '@/hooks/use-customers';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useCustomerPayments } from '@/hooks/use-customer-payments';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { useCustomerBalance } from '@/hooks/use-customer-balance';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useFuelStock } from '@/hooks/use-fuel-stock';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useBankAccounts } from '@/hooks/use-bank-accounts';


const FUEL_TYPES: FuelType[] = ['Unleaded', 'Premium', 'Diesel'];

type SaleMode = 'amount' | 'liters';
type NumpadTarget = 'sale' | 'payment';

export default function SalePage() {
  const { addTransaction } = useTransactions();
  const { addCustomerPayment } = useCustomerPayments();
  const { toast } = useToast();
  const { fuelPrices, isLoaded: pricesLoaded } = useFuelPrices();
  const { customers, isLoaded: customersLoaded } = useCustomers();
  const { fuelStock, isLoaded: stockLoaded } = useFuelStock();
  const { bankAccounts, isLoaded: bankAccountsLoaded } = useBankAccounts();
  
  const [saleInput, setSaleInput] = useState('0');
  const [paymentInput, setPaymentInput] = useState('');
  const [numpadTarget, setNumpadTarget] = useState<NumpadTarget>('sale');

  const [mode, setMode] = useState<SaleMode>('amount');
  const [selectedFuel, setSelectedFuel] = useState<FuelType>('Unleaded');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedBankAccountId, setSelectedBankAccountId] = useState<string | null>(null);
  const [activePaymentMethod, setActivePaymentMethod] = useState<PaymentMethod | null>(null);

  const [saleDate, setSaleDate] = useState<Date>(new Date());
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<{ amount: number; volume: number; fuelType: FuelType, customerName?: string } | null>(null);

  const selectedCustomerBalance = useCustomerBalance(selectedCustomerId);
  
  const selectedCustomer = useMemo(() => {
      if (!selectedCustomerId) return null;
      return customers.find(c => c.id === selectedCustomerId);
  }, [customers, selectedCustomerId]);
  
  const selectedBankAccount = useMemo(() => {
    if (!selectedBankAccountId) return null;
    return bankAccounts.find(b => b.id === selectedBankAccountId);
  }, [bankAccounts, selectedBankAccountId]);

  const { amount, volume } = useMemo(() => {
    const pricePerLitre = fuelPrices[selectedFuel] || 1;
    const inputNum = parseFloat(saleInput) || 0;

    if (mode === 'amount') {
      const calculatedVolume = pricePerLitre > 0 ? inputNum / pricePerLitre : 0;
      return { amount: inputNum, volume: calculatedVolume };
    } else { // mode is 'liters'
      const calculatedAmount = inputNum * pricePerLitre;
      return { amount: calculatedAmount, volume: inputNum };
    }
  }, [saleInput, mode, selectedFuel, fuelPrices]);

  const handleNumpadPress = useCallback((key: string) => {
    const isSale = numpadTarget === 'sale';
    const currentInput = isSale ? saleInput : paymentInput;
    const setInput = isSale ? setSaleInput : setPaymentInput;
    
    if (key === 'C') {
      setInput(isSale ? '0' : '');
      return;
    }
    if (key === '.' && currentInput.includes('.')) {
      return;
    }
    // Limit length to prevent overflow
    if (currentInput.replace('.', '').length >= 7) return;

    if (currentInput === '0' && key !== '.') {
      setInput(key);
    } else {
      if (!isSale && currentInput.includes('.') && currentInput.split('.')[1].length >= 2) return;
      
      setInput(prev => prev + key);
    }
  }, [numpadTarget, saleInput, paymentInput]);
  
  const handleModeChange = useCallback((newMode: SaleMode) => {
      if (mode !== newMode) {
          setMode(newMode);
          setSaleInput('0');
      }
  }, [mode]);

  const handleSalePayment = useCallback((paymentMethod: PaymentMethod) => {
    if (amount <= 0 || volume <= 0) return;
    if ((paymentMethod === 'Card' || paymentMethod === 'Mobile') && !selectedBankAccountId) {
        toast({
            variant: "destructive",
            title: "Bank Account Required",
            description: "Please select a bank account for Card or Mobile payments.",
        });
        return;
    }
    
    const transaction = {
      timestamp: saleDate.toISOString(),
      fuelType: selectedFuel,
      volume: parseFloat(volume.toFixed(2)),
      pricePerLitre: fuelPrices[selectedFuel],
      totalAmount: parseFloat(amount.toFixed(2)),
      paymentMethod,
      customerId: selectedCustomer?.id,
      customerName: selectedCustomer?.name,
      bankAccountId: selectedBankAccountId,
      bankAccountName: selectedBankAccount?.bankName
    };
    
    addTransaction(transaction);
    setLastTransaction({
      amount: parseFloat(amount.toFixed(2)),
      volume: parseFloat(volume.toFixed(2)),
      fuelType: selectedFuel,
      customerName: selectedCustomer?.name,
    });
    setShowConfirmation(true);
  }, [amount, volume, saleDate, selectedFuel, selectedCustomer, fuelPrices, addTransaction, selectedBankAccountId, selectedBankAccount, toast]);
  
  const handleCustomerPayment = useCallback((paymentMethod: PaymentMethod) => {
    const amountNum = parseFloat(paymentInput);
    if (!selectedCustomerId || !amountNum || amountNum <= 0) {
      toast({
        variant: "destructive",
        title: 'Invalid Payment',
        description: 'Please select a customer and enter a valid payment amount.',
      });
      return;
    }
    
    if (!selectedCustomer) return;

    addCustomerPayment({
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      amount: amountNum,
      paymentMethod,
    });

    toast({
      title: 'Payment Recorded',
      description: `Payment of PKR ${amountNum.toFixed(2)} from ${selectedCustomer.name} has been recorded.`,
    });

    // Reset form
    setPaymentInput('');
  }, [paymentInput, selectedCustomerId, selectedCustomer, addCustomerPayment, toast]);

  useEffect(() => {
    if (activePaymentMethod !== 'Card' && activePaymentMethod !== 'Mobile') {
        setSelectedBankAccountId(null);
    }
  }, [activePaymentMethod]);
  
  const handlePaymentMethodClick = (method: PaymentMethod) => {
    setActivePaymentMethod(method);
    handleSalePayment(method);
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // ALT key shortcuts for selection
      if (event.altKey) {
        switch (event.key) {
          case '1':
            event.preventDefault();
            setSelectedFuel('Unleaded');
            break;
          case '2':
            event.preventDefault();
            setSelectedFuel('Premium');
            break;
          case '3':
            event.preventDefault();
            setSelectedFuel('Diesel');
            break;
          case 'm':
          case 'M':
            event.preventDefault();
            handleModeChange(mode === 'amount' ? 'liters' : 'amount');
            break;
        }
      }
      
      // CTRL key shortcuts for payment
      if (event.ctrlKey) {
        const target = numpadTarget === 'sale' ? handleSalePayment : handleCustomerPayment;
        switch (event.key) {
          case '1':
            event.preventDefault();
            target('Cash');
            break;
          case '2':
            event.preventDefault();
            target('Card');
            break;
          case '3':
            event.preventDefault();
            target('Mobile');
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [mode, numpadTarget, handleModeChange, handleSalePayment, handleCustomerPayment]);

  const resetSale = () => {
    setSaleInput('0');
    setPaymentInput('');
    setMode('amount');
    setSelectedFuel('Unleaded');
    setSelectedCustomerId(null);
    setSelectedBankAccountId(null);
    setActivePaymentMethod(null);
    setShowConfirmation(false);
    setLastTransaction(null);
    setSaleDate(new Date());
  };
  
  const numpadTitle = numpadTarget === 'sale' 
      ? (mode === 'amount' ? 'Amount (PKR)' : 'Volume (L)') 
      : 'Payment Amount (PKR)';

  const dataIsReady = pricesLoaded && stockLoaded && bankAccountsLoaded;

  return (
    <div className="flex flex-col lg:flex-row gap-8 p-4 md:p-8 h-full">
      <div className="flex-1 lg:flex-grow-[2] flex flex-col">
        <Card className="flex-1 flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Fuel /> New Sale / Payment
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-6 flex-grow">
                <Tabs value={mode} onValueChange={(value) => handleModeChange(value as SaleMode)} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="amount" onClick={() => setNumpadTarget('sale')}>By Amount (PKR)</TabsTrigger>
                    <TabsTrigger value="liters" onClick={() => setNumpadTarget('sale')}>By Volume (L)</TabsTrigger>
                    </TabsList>
                    <div className="text-center bg-muted/50 p-6 rounded-lg shadow-inner mt-4" onClick={() => setNumpadTarget('sale')}>
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

                <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2"><Users /> Customer</Label>
                        {!customersLoaded ? <Skeleton className="h-10 w-full" /> : (
                            <Select onValueChange={(value) => setSelectedCustomerId(value === 'walk-in' ? null : value)} value={selectedCustomerId || 'walk-in'}>
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
                     <div className="space-y-2">
                        <Label className="flex items-center gap-2"><CalendarIcon /> Sale Date</Label>
                        <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !saleDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {saleDate ? format(saleDate, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={saleDate}
                            onSelect={(date) => setSaleDate(date || new Date())}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                </div>

                {selectedCustomerId && selectedCustomer && (
                    <Card className="bg-destructive/10 border-destructive/50" onFocus={() => setNumpadTarget('payment')} onClick={() => setNumpadTarget('payment')}>
                        <CardHeader className='pb-4'>
                            <CardTitle className="text-base flex justify-between items-center">
                                <span>{selectedCustomer.name}'s Balance</span>
                                <span className={cn("text-lg font-bold", selectedCustomerBalance.balance > 0 ? 'text-destructive' : 'text-green-600')}>
                                    PKR {selectedCustomerBalance.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </CardTitle>
                            <CardDescription>Enter an amount below to record a payment for this customer.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                     <Label htmlFor="payment-amount" className='sr-only'>Amount (PKR)</Label>
                                     <Input 
                                        id="payment-amount"
                                        type="text"
                                        placeholder="Enter amount to receive..."
                                        value={paymentInput}
                                        readOnly
                                        className="text-lg h-12 text-center font-semibold tracking-wider"
                                     />
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <Button className="py-4" variant="secondary" onClick={() => handleCustomerPayment('Cash')} disabled={!selectedCustomerId || !paymentInput}>
                                        <Wallet className="mr-2" /> Cash
                                    </Button>
                                    <Button className="py-4" variant="secondary" onClick={() => handleCustomerPayment('Card')} disabled={!selectedCustomerId || !paymentInput}>
                                        <CreditCard className="mr-2" /> Card
                                    </Button>
                                    <Button className="py-4" variant="secondary" onClick={() => handleCustomerPayment('Mobile')} disabled={!selectedCustomerId || !paymentInput}>
                                        <Smartphone className="mr-2" /> Mobile
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <Separator />
                
                <div className="lg:max-w-md lg:mx-auto lg:w-full">
                    <Label className="mb-2 flex items-center gap-2"><Edit /> Keypad</Label>
                    <Numpad onKeyPress={handleNumpadPress} />
                </div>
                
                <Separator />
                
                <div onClick={() => setNumpadTarget('sale')}>
                    <Label className="mb-2 flex items-center gap-2"><Fuel /> Fuel & Payment</Label>
                    {!dataIsReady ? <div className="grid grid-cols-3 gap-4"><Skeleton className="h-[5rem]"/><Skeleton className="h-[5rem]"/><Skeleton className="h-[5rem]"/></div> : (
                        <div className="grid grid-cols-3 gap-4">
                        {FUEL_TYPES.map((fuel, index) => {
                            const isSelected = selectedFuel === fuel;
                            return (
                                <Button
                                key={fuel}
                                variant={isSelected ? 'default' : 'outline'}
                                className="py-4 text-base flex-col h-auto items-center"
                                onClick={() => setSelectedFuel(fuel)}
                                title={`Alt + ${index + 1}`}
                                >
                                <span>{fuel}</span>
                                <span className={cn("text-xs font-mono mt-0.5", isSelected ? 'text-primary-foreground/90' : 'text-muted-foreground')}>PKR {fuelPrices[fuel].toFixed(2)}/L</span>
                                <span className={cn("text-xs font-mono mt-1", isSelected ? 'text-primary-foreground/90' : 'text-muted-foreground')}>{fuelStock[fuel].toFixed(0)} L</span>
                                </Button>
                            )
                        })}
                        </div>
                    )}
                </div>

                {(activePaymentMethod === 'Card' || activePaymentMethod === 'Mobile') && (
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2"><Landmark /> Bank Account</Label>
                        <Select onValueChange={setSelectedBankAccountId} value={selectedBankAccountId || ''}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a bank account" />
                            </SelectTrigger>
                            <SelectContent>
                                {bankAccounts.map(account => (
                                    <SelectItem key={account.id} value={account.id}>
                                        {account.bankName} - (...{account.accountNumber.slice(-4)})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                <div className="grid grid-cols-3 gap-4" onClick={() => setNumpadTarget('sale')}>
                    <Button className="py-6 text-base" onClick={() => handlePaymentMethodClick('Cash')} disabled={amount <= 0 || !dataIsReady} title="Ctrl + 1">
                    <Wallet className="mr-2" /> Cash
                    </Button>
                    <Button className="py-6 text-base" onClick={() => handlePaymentMethodClick('Card')} disabled={amount <= 0 || !dataIsReady} title="Ctrl + 2">
                    <CreditCard className="mr-2" /> Card
                    </Button>
                    <Button className="py-6 text-base" onClick={() => handlePaymentMethodClick('Mobile')} disabled={amount <= 0 || !dataIsReady} title="Ctrl + 3">
                    <Smartphone className="mr-2" /> Mobile
                    </Button>
                </div>
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="shortcuts">
                        <AccordionTrigger className="text-sm">
                            <div className="flex items-center gap-2">
                                <HelpCircle className="w-4 h-4" />
                                <span>Keyboard Shortcuts</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-5">
                                <li><kbd className="font-mono bg-muted p-1 rounded-sm">Alt + 1</kbd> / <kbd className="font-mono bg-muted p-1 rounded-sm">2</kbd> / <kbd className="font-mono bg-muted p-1 rounded-sm">3</kbd> to select fuel type.</li>
                                <li><kbd className="font-mono bg-muted p-1 rounded-sm">Alt + M</kbd> to switch between Amount and Volume mode.</li>
                                <li><kbd className="font-mono bg-muted p-1 rounded-sm">Ctrl + 1</kbd> / <kbd className="font-mono bg-muted p-1 rounded-sm">2</kbd> / <kbd className="font-mono bg-muted p-1 rounded-sm">3</kbd> to process payment (Cash, Card, Mobile).</li>
                            </ul>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </CardContent>
        </Card>
      </div>
      
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
