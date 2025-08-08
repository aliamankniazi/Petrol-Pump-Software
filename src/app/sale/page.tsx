
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Fuel, PlusCircle, Trash2, Users, CreditCard, Wallet, Smartphone, Landmark, Printer, CheckCircle, LayoutDashboard, Calendar as CalendarIcon, ShoppingCart, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import { useTransactions } from '@/hooks/use-transactions';
import { useCustomers } from '@/hooks/use-customers';
import { useProducts } from '@/hooks/use-products';
import { useCustomerBalance } from '@/hooks/use-customer-balance';
import { cn } from '@/lib/utils';
import { useBankAccounts } from '@/hooks/use-bank-accounts';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';

const saleItemSchema = z.object({
  productId: z.string().min(1, 'Product is required.'),
  productName: z.string(),
  unit: z.string(),
  quantity: z.coerce.number().min(0.01, 'Quantity must be positive.'),
  pricePerUnit: z.coerce.number().min(0, "Price must be non-negative."),
  totalAmount: z.coerce.number().min(0.01, 'Amount must be positive.'),
  discount: z.coerce.number().default(0),
  bonus: z.coerce.number().default(0),
});

const saleSchema = z.object({
  customerId: z.string().optional(),
  paymentMethod: z.enum(['Cash', 'Card', 'Mobile', 'On Credit']),
  bankAccountId: z.string().optional(),
  notes: z.string().optional(),
  date: z.date({ required_error: "A date is required."}),
  orderDeliveryDate: z.date().optional(),
  items: z.array(saleItemSchema).min(1, 'At least one item is required.'),
  extraDiscount: z.coerce.number().default(0),
  paidAmount: z.coerce.number().default(0),
  expenseAmount: z.coerce.number().default(0),
  expenseBankAccountId: z.string().optional(),
  referenceNo: z.string().optional(),
});

type SaleFormValues = z.infer<typeof saleSchema>;

const LOCAL_STORAGE_KEY = 'global-transaction-date';

export default function SalePage() {
  const { addTransaction } = useTransactions();
  const { customers, isLoaded: customersLoaded } = useCustomers();
  const { products, isLoaded: productsLoaded } = useProducts();
  const { bankAccounts, isLoaded: bankAccountsLoaded } = useBankAccounts();
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  // State for the temporary item being added
  const [currentItem, setCurrentItem] = useState({ productId: '', quantity: '', pricePerUnit: '', bonus: '', discountAmount: '', discountPercent: '', totalValue: '' });
  const [lastFocused, setLastFocused] = useState<'quantity' | 'total'>('quantity');

  useEffect(() => {
    setIsClient(true);
  }, []);

  const { register, handleSubmit, control, watch, setValue, reset, getValues } = useForm<SaleFormValues>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      items: [],
      paymentMethod: 'On Credit',
      customerId: 'walk-in'
    }
  });

  useEffect(() => {
    if (isClient) {
        const storedDate = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedDate) {
            setValue('date', new Date(storedDate));
            setValue('orderDeliveryDate', new Date(storedDate));
        } else {
            setValue('date', new Date());
            setValue('orderDeliveryDate', new Date());
        }
    }
  }, [setValue, isClient]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  });

  const watchedCustomerId = watch('customerId');
  const watchedItems = watch('items');

  const { balance: customerBalance, isLoaded: balanceLoaded } = useCustomerBalance(watchedCustomerId === 'walk-in' ? null : watchedCustomerId || null);
  
    useEffect(() => {
        const selectedProduct = products.find(p => p.id === currentItem.productId);
        const quantity = parseFloat(currentItem.quantity) || 0;
        const price = parseFloat(currentItem.pricePerUnit) || 0;
        const discountAmount = parseFloat(currentItem.discountAmount) || 0;
        const totalValue = parseFloat(currentItem.totalValue) || 0;
        
        if (lastFocused === 'quantity') {
            let total = quantity * price;
            if (discountAmount > 0) {
                total -= discountAmount;
            }
            setCurrentItem(prev => ({...prev, totalValue: total.toFixed(2)}));
        } else if (lastFocused === 'total' && price > 0) {
            let calculatedQty = totalValue / price;
            setCurrentItem(prev => ({...prev, quantity: calculatedQty.toFixed(2)}));
        }
    
    }, [currentItem.quantity, currentItem.pricePerUnit, currentItem.discountAmount, currentItem.totalValue, lastFocused, products]);
  
  const handleCurrentProductChange = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if(product) {
        setCurrentItem(prev => ({...prev, productId, pricePerUnit: product.tradePrice?.toString() || '0' }));
    }
  }
  
  const handleAddItemToSale = () => {
    const product = products.find(p => p.id === currentItem.productId);
    if (!product) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please select a product.'});
        return;
    }
    const quantity = parseFloat(currentItem.quantity);
    if (!quantity || quantity <= 0) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please enter a valid quantity.'});
        return;
    }

    const pricePerUnit = parseFloat(currentItem.pricePerUnit);
    const discount = parseFloat(currentItem.discountAmount) || 0;
    const totalAmount = parseFloat(currentItem.totalValue);

    append({
        productId: product.id!,
        productName: product.name,
        unit: product.mainUnit,
        quantity: quantity,
        pricePerUnit: pricePerUnit,
        totalAmount: totalAmount,
        discount: discount,
        bonus: parseFloat(currentItem.bonus) || 0,
    });
    
    // Reset temporary item form
    setCurrentItem({ productId: '', quantity: '', pricePerUnit: '', bonus: '', discountAmount: '', discountPercent: '', totalValue: '' });
  }

  const { subTotal, grandTotal } = useMemo(() => {
    const sub = watchedItems.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
    const discount = getValues('extraDiscount') || 0;
    const grand = sub - discount;
    return { subTotal: sub, grandTotal: grand };
  }, [watchedItems, getValues]);


  const onSubmit: SubmitHandler<SaleFormValues> = (data) => {
    const isWalkIn = !data.customerId || data.customerId === 'walk-in';
    const customer = !isWalkIn ? customers.find(c => c.id === data.customerId) : null;

    addTransaction({
      ...data,
      totalAmount: grandTotal,
      customerName: isWalkIn ? 'Walk-in Customer' : customer?.name,
    });
    
    toast({
      title: 'Sale Recorded',
      description: `Transaction of PKR ${grandTotal.toLocaleString()} has been successfully recorded.`,
      action: <CheckCircle className="text-green-500" />
    });
    
    reset({ 
        items: [],
        paymentMethod: 'On Credit',
        customerId: 'walk-in'
    });
  };

  if (!isClient) {
    return null;
  }

  return (
    <div className="p-4 md:p-8">
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
            <CardHeader>
                <div className='flex justify-between items-center'>
                    <CardTitle className="flex items-center gap-2"><ShoppingCart/> New Sale Invoice</CardTitle>
                    <CardDescription>Date: {format(new Date(), 'dd-MM-yyyy')}</CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <div className="p-4 rounded-lg bg-muted/50 border space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-1">
                            <Label>Product</Label>
                            <Select onValueChange={handleCurrentProductChange} value={currentItem.productId}>
                                <SelectTrigger><SelectValue placeholder="Select Product" /></SelectTrigger>
                                <SelectContent>
                                    {productsLoaded ? products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>) : <SelectItem value='loading' disabled>Loading...</SelectItem>}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label>Unit</Label>
                            <Input value={products.find(p => p.id === currentItem.productId)?.mainUnit || ''} disabled />
                        </div>
                         <div className="space-y-1">
                            <Label>Enter Qty</Label>
                            <Input type="number" placeholder="0" value={currentItem.quantity} onFocus={() => setLastFocused('quantity')} onChange={e => setCurrentItem(prev => ({...prev, quantity: e.target.value}))}/>
                        </div>
                        <div className="space-y-1">
                            <Label>Sale At</Label>
                            <Input type="number" placeholder="0.00" value={currentItem.pricePerUnit} onChange={e => setCurrentItem(prev => ({...prev, pricePerUnit: e.target.value}))} />
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                         <div className="space-y-1 hidden">
                            <Label>Bonus</Label>
                            <Input type="number" placeholder="bonus qty" value={currentItem.bonus} onChange={e => setCurrentItem(prev => ({...prev, bonus: e.target.value}))}/>
                        </div>
                        <div className="space-y-1">
                            <Label>Discount (Amount)</Label>
                            <Input type="number" placeholder="RS 0" value={currentItem.discountAmount} onChange={e => setCurrentItem(prev => ({...prev, discountAmount: e.target.value}))}/>
                        </div>
                        <div className="space-y-1">
                            <Label>Total Value</Label>
                            <Input type="number" placeholder="0.00" value={currentItem.totalValue} onFocus={() => setLastFocused('total')} onChange={e => setCurrentItem(prev => ({...prev, totalValue: e.target.value}))} />
                        </div>
                        <Button type="button" onClick={handleAddItemToSale}><PlusCircle/> Add To Sale</Button>
                    </div>
                </div>

                <div className="mt-6 border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Product</TableHead>
                                <TableHead>Unit</TableHead>
                                <TableHead>Sold Price</TableHead>
                                <TableHead>Sold Qty</TableHead>
                                <TableHead className="hidden">Bonus</TableHead>
                                <TableHead>Discount</TableHead>
                                <TableHead>T.Price</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {fields.map((field, index) => (
                                <TableRow key={field.id}>
                                    <TableCell>{field.productName}</TableCell>
                                    <TableCell>{field.unit}</TableCell>
                                    <TableCell>{field.pricePerUnit.toFixed(2)}</TableCell>
                                    <TableCell>{field.quantity}</TableCell>
                                    <TableCell className="hidden">{field.bonus}</TableCell>
                                    <TableCell>{field.discount.toFixed(2)}</TableCell>
                                    <TableCell>{field.totalAmount.toFixed(2)}</TableCell>
                                    <TableCell>
                                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                            <Trash2 className="text-destructive w-4 h-4"/>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <div className="p-4 text-right space-y-2">
                        <div className="flex justify-end items-center gap-4">
                            <Label>Extra Discount:</Label>
                            <Input className="w-24" placeholder="0 %" {...register('extraDiscount')} />
                        </div>
                         <div className="flex justify-end items-center gap-4 font-bold text-xl">
                            <Label>Grand Total:</Label>
                            <span>{grandTotal.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
                
                <Separator className="my-6" />

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
                     <div className="space-y-1">
                        <Label>Customer</Label>
                         <div className="flex items-center gap-2">
                            <Controller name="customerId" control={control} render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger><SelectValue placeholder="Select Customer" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="walk-in">Walk-in Customer</SelectItem>
                                    {customersLoaded ? customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>) : <SelectItem value="loading" disabled>Loading...</SelectItem>}
                                </SelectContent>
                                </Select>
                            )} />
                             <Button type="button" variant="outline" size="icon" asChild><Link href="/customers" title="Add new customer"><UserPlus /></Link></Button>
                         </div>
                    </div>
                     <div className="space-y-1">
                        <Label>Old Balance</Label>
                        <Input disabled value={customerBalance.toFixed(2)} />
                    </div>
                    <div className="space-y-1">
                        <Label>Sale Date</Label>
                         <Controller name="date" control={control} render={({ field }) => (
                            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                                <PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}</Button></PopoverTrigger>
                                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={(d) => {if(d) field.onChange(d); setIsCalendarOpen(false);}} initialFocus /></PopoverContent>
                            </Popover>
                        )}/>
                    </div>
                    <div className="space-y-1 hidden">
                        <Label>Order Delivery Date</Label>
                         <Controller name="orderDeliveryDate" control={control} render={({ field }) => (
                            <Popover>
                                <PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}</Button></PopoverTrigger>
                                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={(d) => {if(d) field.onChange(d);}} initialFocus /></PopoverContent>
                            </Popover>
                        )}/>
                    </div>
                    <div className="space-y-1">
                        <Label>Paid (Amount)</Label>
                        <div className="flex gap-2">
                             <Input type="number" placeholder="RS 0" {...register('paidAmount')} />
                             <Controller name="bankAccountId" control={control} render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger><SelectValue placeholder="@Bank" /></SelectTrigger>
                                    <SelectContent>
                                        {bankAccountsLoaded ? bankAccounts.map(b => <SelectItem key={b.id} value={b.id}>{b.bankName}</SelectItem>) : <SelectItem value="loading" disabled>Loading...</SelectItem>}
                                    </SelectContent>
                                </Select>
                             )}/>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label>Expense (Amount)</Label>
                         <div className="flex gap-2">
                             <Input type="number" placeholder="RS 0" {...register('expenseAmount')} />
                             <Controller name="expenseBankAccountId" control={control} render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger><SelectValue placeholder="@Bank" /></SelectTrigger>
                                    <SelectContent>
                                        {bankAccountsLoaded ? bankAccounts.map(b => <SelectItem key={b.id} value={b.id}>{b.bankName}</SelectItem>) : <SelectItem value="loading" disabled>Loading...</SelectItem>}
                                    </SelectContent>
                                </Select>
                             )}/>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label>Reference No.</Label>
                        <Input placeholder="ARPOK25663" {...register('referenceNo')} />
                    </div>
                    <div className="space-y-1">
                        <Label>Sale Description</Label>
                        <Input placeholder="type sale description" {...register('notes')} />
                    </div>
                </div>

            </CardContent>
            <CardFooter className="gap-2">
                 <Button type="submit" size="lg">Save/Submit</Button>
                 <Button type="button" variant="outline" size="lg" onClick={() => reset()}>Discard/Reset</Button>
            </CardFooter>
        </Card>
      </form>
    </div>
  );
}

    