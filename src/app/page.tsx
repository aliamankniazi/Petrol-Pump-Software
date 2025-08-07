
'use client';

import * as React from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Fuel, Tag, ScanLine, Calculator, Database, CreditCard, Wallet, Smartphone, Banknote, PlusCircle, Trash2 } from 'lucide-react';
import type { FuelType, Customer, BankAccount } from '@/lib/types';
import { useFuelPrices } from '@/hooks/use-fuel-prices';
import { useCustomers } from '@/hooks/use-customers';
import { useTransactions } from '@/hooks/use-transactions';
import { useCustomerBalance } from '@/hooks/use-customer-balance';
import { useBankAccounts } from '@/hooks/use-bank-accounts';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

const FUEL_TYPES: FuelType[] = ['Unleaded', 'Premium', 'Diesel'];

const saleItemSchema = z.object({
  fuelType: z.enum(FUEL_TYPES, { required_error: 'Please select a fuel type.' }),
  saleType: z.enum(['amount', 'volume']).default('amount'),
  value: z.coerce.number().min(0.01, 'Value must be greater than 0'),
});

const saleSchema = z.object({
  items: z.array(saleItemSchema).min(1, "Please add at least one item to the sale."),
  paymentMethod: z.enum(['Cash', 'Card', 'Mobile', 'On Credit']),
  customerId: z.string().optional(),
  bankAccountId: z.string().optional(),
});

type SaleFormValues = z.infer<typeof saleSchema>;

export default function SalesPage() {
  const { fuelPrices } = useFuelPrices();
  const { customers, isLoaded: customersLoaded } = useCustomers();
  const { bankAccounts, isLoaded: bankAccountsLoaded } = useBankAccounts();
  const { addTransaction } = useTransactions();
  const { toast } = useToast();

  const [barcode, setBarcode] = React.useState('');
  
  const { register, handleSubmit, control, watch, setValue, reset, formState: { errors } } = useForm<SaleFormValues>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      items: [],
      paymentMethod: 'Cash',
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const { customerId, paymentMethod, items } = watch();
  
  const { balance: customerBalance, isLoaded: balanceLoaded } = useCustomerBalance(customerId || null);

  const calculated = React.useMemo(() => {
    let totalAmount = 0;
    const processedItems = items.map(item => {
        const pricePerLitre = item.fuelType ? fuelPrices[item.fuelType] : 0;
        const numValue = Number(item.value) || 0;
        if (pricePerLitre === 0 || numValue === 0) return { ...item, amount: 0, volume: 0, pricePerLitre };
        
        let itemAmount = 0;
        let itemVolume = 0;

        if (item.saleType === 'amount') {
            itemAmount = numValue;
            itemVolume = numValue / pricePerLitre;
        } else {
            itemVolume = numValue;
            itemAmount = numValue * pricePerLitre;
        }
        totalAmount += itemAmount;
        return { ...item, amount: itemAmount, volume: itemVolume, pricePerLitre };
    });

    return { totalAmount, items: processedItems };
  }, [items, fuelPrices]);

  const addNewItem = () => {
    append({ fuelType: 'Unleaded', saleType: 'amount', value: 0 });
  };
  
  React.useEffect(() => {
    if (fields.length === 0) {
        addNewItem();
    }
  }, [fields.length]);

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
    if (calculated.totalAmount <= 0) {
        toast({
            variant: "destructive",
            title: "Invalid Sale",
            description: "Please enter a valid amount or volume for at least one item."
        })
        return;
    }

    const customer = customers.find(c => c.id === data.customerId);
    const bankAccount = bankAccounts.find(b => b.id === data.bankAccountId);

    addTransaction({
      items: calculated.items.map(i => ({
          fuelType: i.fuelType,
          volume: i.volume,
          pricePerLitre: i.pricePerLitre,
          totalAmount: i.amount
      })),
      totalAmount: calculated.totalAmount,
      paymentMethod: data.paymentMethod,
      timestamp: new Date().toISOString(),
      customerId: customer?.id,
      customerName: customer?.name,
      bankAccountId: bankAccount?.id,
      bankAccountName: bankAccount?.bankName,
    });
    
    toast({
      title: 'Sale Recorded',
      description: `Sale of ${items.length} item(s) for PKR ${calculated.totalAmount.toFixed(2)} completed.`,
    });
    
    reset({
        items: [],
        paymentMethod: 'Cash',
        customerId: undefined,
        bankAccountId: undefined,
    });
  };

  const selectedCustomer = customers.find(c => c.id === customerId);

  return (
    <div className="flex h-[calc(100vh-81px)]">
      <div className="flex-1 p-4 md:p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="h-full flex flex-col">
          <Card className="flex-grow flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Fuel/> Electronic Point of Sale (EPOS)</CardTitle>
              <CardDescription>Process a new fuel sale transaction. Add multiple products to a single order.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                 <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2">
                 {fields.map((field, index) => (
                    <Card key={field.id} className="p-4 relative">
                        <div className="grid grid-cols-6 gap-4">
                            <div className="col-span-3 space-y-2">
                                <Label>Fuel Type</Label>
                                <Controller
                                    name={`items.${index}.fuelType`}
                                    control={control}
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <SelectTrigger><SelectValue placeholder="Select fuel" /></SelectTrigger>
                                            <SelectContent>
                                                {FUEL_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>
                             <div className="col-span-3 space-y-2">
                                <Label>Sale By</Label>
                                <Controller
                                    name={`items.${index}.saleType`}
                                    control={control}
                                    render={({ field }) => (
                                         <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-2 items-center h-10">
                                            <Label className="flex items-center gap-2 border rounded-md p-2 cursor-pointer has-[:checked]:border-primary text-xs flex-1 justify-center">
                                                <RadioGroupItem value="amount" />
                                                Amount
                                            </Label>
                                            <Label className="flex items-center gap-2 border rounded-md p-2 cursor-pointer has-[:checked]:border-primary text-xs flex-1 justify-center">
                                                <RadioGroupItem value="volume" />
                                                Volume
                                            </Label>
                                        </RadioGroup>
                                    )}
                                />
                            </div>
                            <div className="col-span-6 space-y-2">
                                <Label>Value</Label>
                                <Input 
                                    {...register(`items.${index}.value`)}
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                        {fields.length > 1 && <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 w-6 h-6" onClick={() => remove(index)}><Trash2 className="w-4 h-4" /></Button>}
                    </Card>
                 ))}
                 </div>
                 <Button type="button" variant="outline" onClick={addNewItem} className="w-full"><PlusCircle /> Add Another Product</Button>
                
                <Separator />
                
                {/* Customer Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <Controller
                    name="customerId"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={(value) => {
                          field.onChange(value === 'walk-in' ? undefined : value);
                          if (paymentMethod === 'On Credit' && value === 'walk-in') {
                            setValue('paymentMethod', 'Cash');
                          }
                      }} value={field.value || 'walk-in'}>
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
                      className="pl-10"
                      value={barcode}
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
                       <Label className={cn("flex flex-col items-center justify-center gap-1 border rounded-md p-2 cursor-pointer has-[:checked]:border-primary text-xs h-16", !customerId && "cursor-not-allowed opacity-50")}>
                         <RadioGroupItem value="On Credit" className="sr-only" disabled={!customerId}/>
                         <Banknote className="w-5 h-5"/> On Credit
                       </Label>
                     </RadioGroup>
                  )}
                />
                
                {paymentMethod !== 'Cash' && paymentMethod !== 'On Credit' && (
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
                   <CardContent className="space-y-2 text-sm">
                     {calculated.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center">
                            <span className="text-muted-foreground">{item.fuelType} ({item.volume.toFixed(2)} L)</span>
                            <span className="font-mono">PKR {item.amount.toFixed(2)}</span>
                        </div>
                     ))}
                      <Separator />
                      <div className="flex justify-between items-center text-xl font-bold border-t pt-4 mt-4">
                       <span>Total:</span>
                       <span className="text-primary">PKR {calculated.totalAmount.toFixed(2)}</span>
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
        </form>
      </div>
    </div>
  );
}
