
'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Fuel, Tag, ScanLine, Calculator, Database, CreditCard, Wallet, Smartphone, Banknote, Terminal } from 'lucide-react';
import { Numpad } from '@/components/numpad';
import type { FuelType, Customer, BankAccount } from '@/lib/types';
import { useFuelPrices } from '@/hooks/use-fuel-prices';
import { useCustomers } from '@/hooks/use-customers';
import { useTransactions } from '@/hooks/use-transactions';
import { useCustomerBalance } from '@/hooks/use-customer-balance';
import { useBankAccounts } from '@/hooks/use-bank-accounts';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { isFirebaseConfigured } from '@/lib/firebase-client';
import { cn } from '@/lib/utils';


const FUEL_TYPES: FuelType[] = ['Unleaded', 'Premium', 'Diesel'];

const saleSchema = z.object({
  fuelType: z.enum(FUEL_TYPES, { required_error: 'Please select a fuel type.' }),
  saleType: z.enum(['amount', 'volume']),
  value: z.coerce.number().min(0.01, 'Value must be greater than 0'),
  paymentMethod: z.enum(['Cash', 'Card', 'Mobile', 'Salary']),
  customerId: z.string().optional(),
  bankAccountId: z.string().optional(),
});

type SaleFormValues = z.infer<typeof saleSchema>;

const FirebaseNotConfiguredAlert = () => (
  <div className="absolute bottom-4 right-4 z-50">
    <Alert variant="destructive" className="max-w-md">
      <Terminal className="h-4 w-4" />
      <AlertTitle>Firebase Not Configured</AlertTitle>
      <AlertDescription>
        The application is running in a limited, offline mode. To enable saving data, login, and all other features, please add your Firebase credentials to <strong>src/lib/firebase-config.ts</strong>.
      </AlertDescription>
    </Alert>
  </div>
);


export default function SalesPage() {
  const { fuelPrices } = useFuelPrices();
  const { customers, isLoaded: customersLoaded } = useCustomers();
  const { bankAccounts, isLoaded: bankAccountsLoaded } = useBankAccounts();
  const { addTransaction } = useTransactions();
  const { toast } = useToast();
  const configured = isFirebaseConfigured();

  const [activeInput, setActiveInput] = React.useState<'value' | 'barcode'>('value');
  const [barcode, setBarcode] = React.useState('');
  
  const { register, handleSubmit, control, watch, setValue, reset, formState: { errors } } = useForm<SaleFormValues>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      saleType: 'amount',
      paymentMethod: 'Cash',
      value: 0,
    }
  });

  const { fuelType, saleType, value, customerId, paymentMethod } = watch();
  
  const pricePerLitre = fuelType ? fuelPrices[fuelType] : 0;
  
  const { balance: customerBalance, isLoaded: balanceLoaded } = useCustomerBalance(customerId || null);

  const calculated = React.useMemo(() => {
    const numValue = Number(value) || 0;
    if (pricePerLitre === 0 || numValue === 0) return { amount: 0, volume: 0 };
    if (saleType === 'amount') {
      return { amount: numValue, volume: numValue / pricePerLitre };
    } else {
      return { amount: numValue * pricePerLitre, volume: numValue };
    }
  }, [saleType, value, pricePerLitre]);

  const handleNumpadKey = React.useCallback((key: string) => {
    const target = activeInput === 'value' ? 'value' : 'barcode';
    const setter = activeInput === 'value' ? (v: any) => setValue('value', v, { shouldValidate: true }) : setBarcode;
    const currentValue = activeInput === 'value' ? String(value) : barcode;

    if (key === 'C') {
      setter(target === 'value' ? 0 : '');
    } else if (key === '.' && currentValue.includes('.')) {
      return;
    } else {
      const newValue = currentValue === '0' && key !== '.' ? key : currentValue + key;
      setter(target === 'value' ? parseFloat(newValue) || 0 : newValue);
    }
  }, [activeInput, value, barcode, setValue]);
  
  React.useEffect(() => {
    if (barcode.length > 0) {
        const foundCustomer = customers.find(c => c.id === barcode);
        if (foundCustomer) {
            setValue('customerId', foundCustomer.id);
            setBarcode('');
        }
    }
  }, [barcode, customers, setValue]);

  const onSubmit = (data: SaleFormValues) => {
    if (calculated.amount <= 0 || calculated.volume <= 0) {
        toast({
            variant: "destructive",
            title: "Invalid Sale",
            description: "Please enter a valid amount or volume."
        })
        return;
    }

    const customer = customers.find(c => c.id === data.customerId);
    const bankAccount = bankAccounts.find(b => b.id === data.bankAccountId);

    addTransaction({
      fuelType: data.fuelType,
      volume: calculated.volume,
      pricePerLitre: pricePerLitre,
      totalAmount: calculated.amount,
      paymentMethod: data.paymentMethod,
      timestamp: Date.now(),
      customerId: customer?.id,
      customerName: customer?.name,
      bankAccountId: bankAccount?.id,
      bankAccountName: bankAccount?.bankName,
    });
    
    toast({
      title: 'Sale Recorded',
      description: `Sale of ${calculated.volume.toFixed(2)}L for PKR ${calculated.amount.toFixed(2)} completed.`,
    });
    
    reset({
        saleType: 'amount',
        paymentMethod: 'Cash',
        value: 0
    });
  };

  const selectedCustomer = customers.find(c => c.id === customerId);

  return (
    <div className="flex h-[calc(100vh-81px)]">
      {!configured && <FirebaseNotConfiguredAlert />}
      <div className="flex-1 p-4 md:p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="h-full flex flex-col">
          <fieldset disabled={!configured} className="h-full flex flex-col contents">
          <Card className="flex-grow flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Fuel/> Electronic Point of Sale (EPOS)</CardTitle>
              <CardDescription>Process a new fuel sale transaction.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                 {/* Fuel Type Selection */}
                <Controller
                  name="fuelType"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="grid grid-cols-3 gap-4"
                    >
                      {FUEL_TYPES.map(type => (
                        <div key={type}>
                          <RadioGroupItem value={type} id={type} className="peer sr-only" />
                          <Label
                            htmlFor={type}
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                          >
                            <span className="font-semibold">{type}</span>
                            <span className="text-xs">PKR {fuelPrices[type].toFixed(2)}/L</span>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}
                />
                {errors.fuelType && <p className="text-sm text-destructive -mt-2">{errors.fuelType.message}</p>}
                
                {/* Sale by Amount or Volume */}
                <Controller
                  name="saleType"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="grid grid-cols-2 gap-4"
                    >
                      <Label className="flex items-center gap-2 border rounded-md p-3 cursor-pointer has-[:checked]:border-primary">
                        <RadioGroupItem value="amount" />
                        <Tag className="w-5 h-5" />
                        Sale by Amount
                      </Label>
                      <Label className="flex items-center gap-2 border rounded-md p-3 cursor-pointer has-[:checked]:border-primary">
                        <RadioGroupItem value="volume" />
                        <Database className="w-5 h-5"/>
                        Sale by Volume
                      </Label>
                    </RadioGroup>
                  )}
                />

                {/* Main Input */}
                <div className="relative">
                  <Input
                    {...register('value')}
                    type="number"
                    step="0.01"
                    className={`h-20 text-4xl font-bold text-center pr-12 ${activeInput === 'value' ? 'border-primary border-2' : ''}`}
                    onFocus={() => setActiveInput('value')}
                    placeholder="0.00"
                  />
                   <span className="absolute top-1/2 right-4 -translate-y-1/2 text-xl font-semibold text-muted-foreground">
                    {saleType === 'amount' ? 'PKR' : 'L'}
                   </span>
                </div>
                {errors.value && <p className="text-sm text-destructive">{errors.value.message}</p>}
                
                {/* Customer Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <Controller
                    name="customerId"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Customer (Optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="walk-in">Walk-in Customer</SelectItem>
                          {customersLoaded ? customers.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          )) : <SelectItem value="loading" disabled>Loading...</SelectItem>}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <div className="relative">
                    <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                      placeholder="Scan Barcode" 
                      className={`pl-10 ${activeInput === 'barcode' ? 'border-primary border-2' : ''}`}
                      value={barcode}
                      onFocus={() => setActiveInput('barcode')}
                      onChange={(e) => setBarcode(e.target.value)}
                    />
                  </div>
                </div>

                {/* Payment Method */}
                <Controller
                  name="paymentMethod"
                  control={control}
                  render={({ field }) => (
                     <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="grid grid-cols-4 gap-2"
                     >
                       <Label className="flex flex-col items-center justify-center gap-1 border rounded-md p-2 cursor-pointer has-[:checked]:border-primary text-xs h-16">
                         <RadioGroupItem value="Cash" className="sr-only"/>
                         <Wallet className="w-5 h-5"/> Cash
                       </Label>
                       <Label className="flex flex-col items-center justify-center gap-1 border rounded-md p-2 cursor-pointer has-[:checked]:border-primary text-xs h-16">
                         <RadioGroupItem value="Card" className="sr-only"/>
                         <CreditCard className="w-5 h-5"/> Card
                       </Label>
                        <Label className="flex flex-col items-center justify-center gap-1 border rounded-md p-2 cursor-pointer has-[:checked]:border-primary text-xs h-16">
                         <RadioGroupItem value="Mobile" className="sr-only"/>
                         <Smartphone className="w-5 h-5"/> Mobile
                       </Label>
                       <Label className={cn("flex flex-col items-center justify-center gap-1 border rounded-md p-2 cursor-pointer has-[:checked]:border-primary text-xs h-16", (!customerId || customerId === 'walk-in') && "cursor-not-allowed opacity-50")}>
                         <RadioGroupItem value="Salary" className="sr-only" disabled={!customerId || customerId === 'walk-in'}/>
                         <Banknote className="w-5 h-5"/> On Credit
                       </Label>
                     </RadioGroup>
                  )}
                />
                
                {paymentMethod !== 'Cash' && paymentMethod !== 'Salary' && (
                  <Controller
                      name="bankAccountId"
                      control={control}
                      render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                  <SelectValue placeholder="Select Bank Account" />
                              </SelectTrigger>
                              <SelectContent>
                                  {bankAccountsLoaded ? bankAccounts.map(b => (
                                      <SelectItem key={b.id} value={b.id}>{b.bankName} - {b.accountNumber}</SelectItem>
                                  )) : <SelectItem value="loading" disabled>Loading...</SelectItem>}
                              </SelectContent>
                          </Select>
                      )}
                  />
                )}

              </div>
              <div className="space-y-6">
                <Card className="bg-muted/50">
                   <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Calculator/> Sale Summary</CardTitle>
                   </CardHeader>
                   <CardContent className="space-y-4">
                     <div className="flex justify-between items-center text-lg">
                       <span className="text-muted-foreground">Volume:</span>
                       <span className="font-bold">{calculated.volume.toFixed(3)} L</span>
                     </div>
                      <div className="flex justify-between items-center text-lg">
                       <span className="text-muted-foreground">Rate:</span>
                       <span className="font-bold">PKR {pricePerLitre.toFixed(2)}</span>
                     </div>
                      <div className="flex justify-between items-center text-2xl font-bold border-t pt-4">
                       <span>Total Amount:</span>
                       <span className="text-primary">PKR {calculated.amount.toFixed(2)}</span>
                     </div>
                   </CardContent>
                </Card>

                {selectedCustomer && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Customer Info</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-2">
                           <p><strong>Name:</strong> {selectedCustomer.name}</p>
                           <p><strong>Contact:</strong> {selectedCustomer.contact}</p>
                           <p><strong>Previous Balance:</strong>
                            <span className={cn("font-semibold", customerBalance > 0 ? 'text-destructive' : 'text-green-600')}>
                                {' '}PKR {balanceLoaded ? customerBalance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '...'}
                            </span>
                           </p>
                        </CardContent>
                    </Card>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" size="lg" className="w-full h-16 text-xl">
                Process Sale
              </Button>
            </CardFooter>
          </Card>
          </fieldset>
        </form>
      </div>

      <aside className="w-1/3 p-4 md:p-8 border-l bg-muted/20 hidden lg:block">
        <h3 className="text-lg font-semibold text-center mb-6">Quick Input</h3>
        <Numpad onKeyPress={handleNumpadKey} />
      </aside>
    </div>
  );
}
