
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm, useFieldArray, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Fuel, PlusCircle, Trash2, Users, CreditCard, Wallet, Smartphone, Landmark, Printer, CheckCircle, LayoutDashboard, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useTransactions } from '@/hooks/use-transactions';
import { useCustomers } from '@/hooks/use-customers';
import { useProducts } from '@/hooks/use-products';
import { useCustomerBalance } from '@/hooks/use-customer-balance';
import { cn } from '@/lib/utils';
import { useBankAccounts } from '@/hooks/use-bank-accounts';
import { useFormState } from '@/hooks/use-form-state';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

const saleItemSchema = z.object({
  productId: z.string().min(1, 'Product is required.'),
  quantity: z.coerce.number().min(0.01, 'Quantity must be positive.'),
  pricePerUnit: z.coerce.number().min(0, "Price must be non-negative."),
  totalAmount: z.coerce.number().min(0.01, 'Amount must be positive.'),
});

const saleSchema = z.object({
  customerId: z.string().optional(),
  paymentMethod: z.enum(['Cash', 'Card', 'Mobile', 'On Credit']),
  bankAccountId: z.string().optional(),
  notes: z.string().optional(),
  date: z.date({ required_error: "A date is required."}),
  items: z.array(saleItemSchema).min(1, 'At least one item is required.'),
});

type SaleFormValues = z.infer<typeof saleSchema>;

const LOCAL_STORAGE_KEY = 'global-transaction-date';

export default function SalePage() {
  const { transactions, addTransaction } = useTransactions();
  const { customers, isLoaded: customersLoaded } = useCustomers();
  const { products, isLoaded: productsLoaded } = useProducts();
  const { bankAccounts, isLoaded: bankAccountsLoaded } = useBankAccounts();
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [lastFocused, setLastFocused] = useState<'quantity' | 'amount'>('quantity');


  useEffect(() => {
    setIsClient(true);
  }, []);

  const [formState, setFormState] = useFormState<Partial<SaleFormValues>>('sale-form', {
    paymentMethod: 'On Credit',
    customerId: 'walk-in',
  });

  let defaultDate: Date;
  if (isClient) {
    const storedDate = localStorage.getItem(LOCAL_STORAGE_KEY);
    defaultDate = storedDate ? new Date(storedDate) : new Date();
  } else {
    defaultDate = new Date();
  }

  const { register, handleSubmit, control, watch, setValue, reset, formState: { errors } } = useForm<SaleFormValues>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      ...formState,
      date: defaultDate,
      items: [{ productId: '', quantity: 0, pricePerUnit: 0, totalAmount: 0 }],
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  });

  const watchedItems = watch('items');
  const watchedCustomerId = watch('customerId');
  const watchedPaymentMethod = watch('paymentMethod');
  const selectedDate = watch('date');

  const { balance: customerBalance, isLoaded: balanceLoaded } = useCustomerBalance(watchedCustomerId === 'walk-in' ? null : watchedCustomerId || null);

  useEffect(() => {
    const subscription = watch((value) => setFormState(value as Partial<SaleFormValues>));
    return () => subscription.unsubscribe();
  }, [watch, setFormState]);
  
  useEffect(() => {
    if (selectedDate && typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY, selectedDate.toISOString());
    }
  }, [selectedDate]);

  const totalAmount = useMemo(() => {
    return watchedItems.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
  }, [watchedItems]);

  const handleProductChange = (index: number, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      const lastSaleOfProduct = transactions
          .filter(t => t.items.some(item => item.productId === productId))
          .sort((a,b) => new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime())[0];
      
      let lastPrice = product.tradePrice || 0;
      if (lastSaleOfProduct) {
          const lastItem = lastSaleOfProduct.items.find(item => item.productId === productId);
          if (lastItem) {
              lastPrice = lastItem.pricePerUnit;
          }
      }
      
      setValue(`items.${index}.pricePerUnit`, lastPrice, { shouldValidate: true });
      const quantity = watch(`items.${index}.quantity`);
      if (quantity > 0) {
        setValue(`items.${index}.totalAmount`, quantity * lastPrice, { shouldValidate: true });
      }
    }
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    if (lastFocused !== 'quantity') return;
    const roundedQuantity = Math.round(quantity * 100) / 100;
    const pricePerUnit = watch(`items.${index}.pricePerUnit`);
    setValue(`items.${index}.quantity`, roundedQuantity, { shouldValidate: true });
    if (pricePerUnit > 0) {
        setValue(`items.${index}.totalAmount`, roundedQuantity * pricePerUnit, { shouldValidate: true });
    }
  }

  const handleAmountChange = (index: number, amount: number) => {
    if (lastFocused !== 'amount') return;
    const pricePerUnit = watch(`items.${index}.pricePerUnit`);
    setValue(`items.${index}.totalAmount`, amount, { shouldValidate: true });
    if (pricePerUnit > 0) {
        const newQuantity = Math.round((amount / pricePerUnit) * 100) / 100;
        setValue(`items.${index}.quantity`, newQuantity, { shouldValidate: true });
    }
  };

  const handlePriceChange = (index: number, price: number) => {
      const quantity = watch(`items.${index}.quantity`);
      setValue(`items.${index}.totalAmount`, quantity * price, { shouldValidate: true });
  }

  const onSubmit: SubmitHandler<SaleFormValues> = (data) => {
    const isWalkIn = !data.customerId || data.customerId === 'walk-in';
    const customer = !isWalkIn ? customers.find(c => c.id === data.customerId) : null;
    const bankAccount = bankAccounts.find(b => b.id === data.bankAccountId);

    const itemsWithNames = data.items.map(item => {
      const product = products.find(p => p.id === item.productId);
      return { ...item, productName: product?.name || 'Unknown' };
    });

    addTransaction({
      items: itemsWithNames,
      totalAmount,
      paymentMethod: data.paymentMethod,
      notes: data.notes,
      timestamp: data.date.toISOString(),
      customerId: isWalkIn ? undefined : data.customerId,
      customerName: isWalkIn ? 'Walk-in Customer' : customer?.name,
      bankAccountId: data.bankAccountId,
      bankAccountName: bankAccount?.bankName,
    });
    
    toast({
      title: 'Sale Recorded',
      description: `Transaction of PKR ${totalAmount.toLocaleString()} has been successfully recorded.`,
      action: <CheckCircle className="text-green-500" />
    });
    
    // Persist customer and payment method, but clear items.
    const persistentState = { customerId: data.customerId, paymentMethod: data.paymentMethod, bankAccountId: data.bankAccountId, date: data.date };
    reset({ ...persistentState, notes: '', items: [{ productId: '', quantity: 0, pricePerUnit: 0, totalAmount: 0 }] });
  };

  return (
    <div className="p-4 md:p-8">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader className="flex flex-row justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2"><Fuel /> New Sale Transaction</CardTitle>
                    <CardDescription>Select products and enter quantities to record a new sale.</CardDescription>
                  </div>
                  <Button asChild variant="outline">
                      <Link href="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" /> Go to Dashboard</Link>
                  </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                    {fields.map((field, index) => (
                        <Card key={field.id} className="p-4 relative bg-muted/40">
                             <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                <div className="md:col-span-2 space-y-2">
                                    <Label>Product</Label>
                                    <Controller
                                      name={`items.${index}.productId`}
                                      control={control}
                                      render={({ field }) => (
                                         <Select onValueChange={(value) => {
                                            field.onChange(value);
                                            handleProductChange(index, value);
                                        }} value={field.value} defaultValue="">
                                          <SelectTrigger><SelectValue placeholder="Select a product" /></SelectTrigger>
                                          <SelectContent>
                                            {productsLoaded ? products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>) : <SelectItem value="loading" disabled>Loading...</SelectItem>}
                                          </SelectContent>
                                        </Select>
                                      )}
                                    />
                                </div>
                                 <div className="space-y-2">
                                  <Label>Quantity</Label>
                                  <Input type="number" {...register(`items.${index}.quantity`)} placeholder="0.00" step="0.01" 
                                  onFocus={() => setLastFocused('quantity')}
                                  onChange={(e) => handleQuantityChange(index, +e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                  <Label>Amount</Label>
                                  <Input type="number" {...register(`items.${index}.totalAmount`)} placeholder="0.00" step="0.01" 
                                   onFocus={() => setLastFocused('amount')}
                                   onChange={(e) => handleAmountChange(index, +e.target.value)}/>
                                </div>
                                <div className="space-y-2">
                                  <Label>Price</Label>
                                  <Input type="number" {...register(`items.${index}.pricePerUnit`)} placeholder="0.00" step="0.01" onChange={(e) => handlePriceChange(index, +e.target.value)}/>
                                </div>
                             </div>
                            <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 w-6 h-6" onClick={() => remove(index)}><Trash2 className="w-4 h-4" /></Button>
                        </Card>
                    ))}
                </div>
                {errors.items && <p className="text-sm text-destructive">{errors.items.message}</p>}
                <Button type="button" variant="outline" onClick={() => append({ productId: '', quantity: 0, pricePerUnit: 0, totalAmount: 0 })} className="w-full"><PlusCircle /> Add Another Product</Button>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users /> Customer & Payment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="space-y-2">
                    <Label>Date</Label>
                    {isClient && <Controller
                      name="date"
                      control={control}
                      render={({ field }) => (
                        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
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
                              onSelect={(date) => {
                                field.onChange(date);
                                setIsCalendarOpen(false);
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      )}
                    />}
                    {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
                  </div>
                <div className="space-y-2">
                  <Label>Customer</Label>
                  <Controller name="customerId" control={control} render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger><SelectValue placeholder="Select Customer (or leave for Walk-in)" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="walk-in">Walk-in Customer</SelectItem>
                        {customersLoaded ? customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>) : <SelectItem value="loading" disabled>Loading...</SelectItem>}
                      </SelectContent>
                    </Select>
                  )} />
                </div>
                
                {watchedCustomerId && watchedCustomerId !== 'walk-in' && (
                  <Card className="bg-muted/40 p-4">
                    <CardHeader className="p-0 pb-2">
                      <CardTitle className="text-md">Customer Balance</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      {balanceLoaded ? (
                         <p className={cn("text-xl font-bold", customerBalance > 0 ? 'text-destructive' : 'text-green-600')}>
                          PKR {customerBalance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </p>
                      ) : <p>Loading balance...</p>}
                      <p className="text-xs text-muted-foreground">Previous balance before this transaction.</p>
                    </CardContent>
                  </Card>
                )}
                
                <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <Controller name="paymentMethod" control={control} render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger><SelectValue placeholder="Select payment method" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="On Credit"><CreditCard className="inline-block mr-2"/>On Credit</SelectItem>
                                <SelectItem value="Cash"><Wallet className="inline-block mr-2"/>Cash</SelectItem>
                                <SelectItem value="Card"><Landmark className="inline-block mr-2"/>Card</SelectItem>
                                <SelectItem value="Mobile"><Smartphone className="inline-block mr-2"/>Mobile</SelectItem>
                            </SelectContent>
                        </Select>
                    )}/>
                </div>
                
                {watchedPaymentMethod && ['Card', 'Mobile'].includes(watchedPaymentMethod) && (
                  <div className="space-y-2">
                    <Label>Bank Account</Label>
                     <Controller name="bankAccountId" control={control} render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value} defaultValue="">
                            <SelectTrigger><SelectValue placeholder="Select Bank Account" /></SelectTrigger>
                            <SelectContent>
                                {bankAccountsLoaded ? bankAccounts.map(b => <SelectItem key={b.id} value={b.id}>{b.bankName} (...{b.accountNumber.slice(-4)})</SelectItem>) : <SelectItem value="loading" disabled>Loading...</SelectItem>}
                            </SelectContent>
                        </Select>
                    )}/>
                  </div>
                )}
                <div className="space-y-2">
                    <Label htmlFor="notes">Transaction Notes</Label>
                    <Textarea id="notes" {...register('notes')} placeholder="e.g., Special instructions, reference number..." />
                </div>
              </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Transaction Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                     <div className="flex justify-between items-center text-xl font-bold">
                        <span>Total Amount:</span>
                        <span>PKR {totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                    <Button type="submit" className="w-full text-lg h-12">
                        <CheckCircle className="mr-2"/> Complete Sale
                    </Button>
                    <Button type="button" variant="outline" className="w-full" onClick={() => {
                        const persistentState = { customerId: watch('customerId'), paymentMethod: watch('paymentMethod'), date: watch('date') };
                        reset({ ...persistentState, notes: '', items: [{ productId: '', quantity: 0, pricePerUnit: 0, totalAmount: 0 }] });
                    }}>
                        Reset Form
                    </Button>
                </CardFooter>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}

    