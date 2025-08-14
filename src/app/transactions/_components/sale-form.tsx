
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Calendar as CalendarIcon, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import { useTransactions } from '@/hooks/use-transactions';
import { useCustomers } from '@/hooks/use-customers';
import { useProducts } from '@/hooks/use-products';
import { useCustomerBalance } from '@/hooks/use-customer-balance';
import { cn } from '@/lib/utils';
import { useBankAccounts } from '@/hooks/use-bank-accounts';
import Link from 'next/link';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import type { Product } from '@/lib/types';
import { ProductSelection } from './product-selection';
import { CustomerSelection } from './customer-selection';


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

export function SaleForm() {
  const { addTransaction, transactions } = useTransactions();
  const { customers } = useCustomers();
  const { products, isLoaded: productsLoaded } = useProducts();
  const { bankAccounts, isLoaded: bankAccountsLoaded } = useBankAccounts();
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  const { register, handleSubmit, control, watch, setValue, reset, getValues } = useForm<SaleFormValues>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      items: [],
      paymentMethod: 'On Credit',
      customerId: 'walk-in',
      bankAccountId: '',
      notes: '',
      extraDiscount: 0,
      paidAmount: 0,
      expenseAmount: 0,
      expenseBankAccountId: '',
      referenceNo: '',
      date: new Date(),
      orderDeliveryDate: new Date(),
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  });

  const watchedCustomerId = watch('customerId');
  const watchedItems = watch('items');
  const watchedDate = watch('date');

  const { balance: customerBalance } = useCustomerBalance(watchedCustomerId === 'walk-in' ? null : watchedCustomerId || null);

  const onSubmit = useCallback(async (data: SaleFormValues) => {
    const isWalkIn = !data.customerId || data.customerId === 'walk-in';
    const customer = !isWalkIn ? customers.find(c => c.id === data.customerId) : null;

    const grandTotal = data.items.reduce((sum, item) => sum + (item.totalAmount || 0), 0) - (data.extraDiscount || 0);

    const newTransaction = await addTransaction({
      ...data,
      totalAmount: grandTotal,
      customerName: isWalkIn ? 'Walk-in Customer' : customer?.name,
    });
    
    toast({
      title: 'Sale Recorded',
      description: `Transaction of PKR ${grandTotal.toLocaleString()} has been successfully recorded.`,
    });

    if (newTransaction && newTransaction.id) {
        window.open(`/invoice/sale/${newTransaction.id}?print=true`, '_blank');
    }
    
    reset({ 
        items: [],
        paymentMethod: 'On Credit',
        customerId: 'walk-in',
        date: new Date(),
        orderDeliveryDate: new Date(),
        bankAccountId: '',
        notes: '',
        extraDiscount: 0,
        paidAmount: 0,
        expenseAmount: 0,
        expenseBankAccountId: '',
        referenceNo: '',
    });

  }, [addTransaction, customers, reset, toast]);


   useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      // Prevent form submission on "Enter" unless it's a button
      if (event.key === 'Enter' && target.tagName !== 'BUTTON' && target.tagName !== 'TEXTAREA') {
          event.preventDefault();
      }
      
      // Allow Ctrl+S to save
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        handleSubmit(onSubmit)();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleSubmit, onSubmit]);

  useEffect(() => {
      if (watchedCustomerId === 'walk-in') {
        setValue('paymentMethod', 'Cash');
      } else {
        setValue('paymentMethod', 'On Credit');
      }
  }, [watchedCustomerId, setValue]);

  const { grandTotal } = useMemo(() => {
    const sub = watchedItems.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
    const discount = Number(getValues('extraDiscount')) || 0;
    const grand = sub - discount;
    return { grandTotal: grand };
  }, [watchedItems, getValues]);

  const handleProductSelect = useCallback((product: Product) => {
    if (!product || !productsLoaded) return;

    const saleDate = getValues('date');

    const lastSaleOfProduct = transactions
        .flatMap(tx => tx.items.map(item => ({...item, timestamp: tx.timestamp})))
        .filter(item => item.productId === product.id && item.timestamp && new Date(item.timestamp) <= saleDate)
        .sort((a, b) => new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime())
        [0];

    const salePrice = lastSaleOfProduct ? lastSaleOfProduct.pricePerUnit : (product.tradePrice || 0);

    append({
        productId: product.id!,
        productName: product.name,
        unit: product.mainUnit,
        quantity: 1,
        pricePerUnit: salePrice,
        totalAmount: salePrice,
        discount: 0,
        bonus: 0,
    });
  }, [productsLoaded, transactions, append, getValues]);


  if (!isClient) {
    return null;
  }

  return (
      <form onSubmit={handleSubmit(onSubmit)}>
            <div className="p-4 rounded-lg bg-muted/50 border space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-1 md:col-span-2">
                        <Label>Product</Label>
                        <ProductSelection onProductSelect={handleProductSelect} />
                    </div>
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
                            <TableHead>Discount</TableHead>
                            <TableHead>T.Price</TableHead>
                            <TableHead></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {fields.map((field, index) => (
                            <TableRow key={field.id}>
                                <TableCell>{field.productName}</TableCell>
                                <TableCell>
                                    <Input
                                        type="text"
                                        {...register(`items.${index}.unit`)}
                                        className="w-24"
                                    />
                                </TableCell>
                                <TableCell>
                                     <Input
                                        type="number"
                                        step="any"
                                        {...register(`items.${index}.pricePerUnit`)}
                                        onChange={(e) => {
                                            const price = parseFloat(e.target.value) || 0;
                                            const qty = getValues(`items.${index}.quantity`);
                                            setValue(`items.${index}.totalAmount`, price * qty, { shouldTouch: true });
                                        }}
                                    />
                                </TableCell>
                                <TableCell>
                                     <Input
                                        type="number"
                                        step="any"
                                        {...register(`items.${index}.quantity`)}
                                        onChange={(e) => {
                                            const qty = parseFloat(e.target.value) || 0;
                                            const price = getValues(`items.${index}.pricePerUnit`);
                                            setValue(`items.${index}.totalAmount`, price * qty, { shouldTouch: true });
                                        }}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Input
                                        type="number"
                                        step="any"
                                        {...register(`items.${index}.discount`)}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Input
                                        type="number"
                                        step="any"
                                        {...register(`items.${index}.totalAmount`)}
                                         onChange={(e) => {
                                            const total = parseFloat(e.target.value) || 0;
                                            const price = getValues(`items.${index}.pricePerUnit`);
                                            if (price > 0) {
                                                setValue(`items.${index}.quantity`, total / price, { shouldTouch: true });
                                            }
                                        }}
                                    />
                                </TableCell>
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
                     <div className="flex justify-end items-center gap-4 font-bold text-xl">
                        <Label>Grand Total:</Label>
                        <span>{grandTotal.toFixed(2)}</span>
                    </div>
                </div>
            </div>
            
            <Separator className="my-6" />

            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 items-start">
                 <div className="space-y-1 lg:col-span-2">
                    <Label>Customer</Label>
                     <div className="flex items-center gap-2">
                       <CustomerSelection
                            selectedCustomerId={watchedCustomerId}
                            onCustomerSelect={(customerId) => setValue('customerId', customerId)}
                        />
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
                        <Popover>
                            <PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}</Button></PopoverTrigger>
                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={(d) => {if(d) field.onChange(d);}} initialFocus /></PopoverContent>
                        </Popover>
                    )}/>
                </div>
                <div className="space-y-1">
                    <Label>Payment</Label>
                    <div className="flex gap-2">
                         <Controller name="paymentMethod" control={control} render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger><SelectValue placeholder="Method" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Cash">Cash</SelectItem>
                                    <SelectItem value="Card">Card</SelectItem>
                                    <SelectItem value="Mobile">Mobile</SelectItem>
                                    <SelectItem value="On Credit">On Credit</SelectItem>
                                </SelectContent>
                            </Select>
                         )}/>
                         <Controller name="bankAccountId" control={control} render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger><SelectValue placeholder="@Bank" /></SelectTrigger>
                                <SelectContent>
                                    {bankAccountsLoaded ? bankAccounts.map(b => <SelectItem key={b.id} value={b.id!}>{b.bankName}</SelectItem>) : <SelectItem value="loading" disabled>Loading...</SelectItem>}
                                </SelectContent>
                            </Select>
                         )}/>
                    </div>
                </div>
                 <div className="space-y-1 lg:col-span-full">
                    <Label>Sale Description</Label>
                    <Textarea placeholder="Type sale description or notes..." {...register('notes')} />
                </div>
                <div className="space-y-1">
                    <Label>Expense Amount</Label>
                    <Input type="number" step="any" placeholder="RS 0" {...register('expenseAmount')} />
                </div>
                <div className="space-y-1">
                    <Label>Expense From Bank</Label>
                    <Controller name="expenseBankAccountId" control={control} render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                            <SelectTrigger><SelectValue placeholder="Select Bank..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="cash">Cash</SelectItem>
                                {bankAccountsLoaded ? bankAccounts.map(b => <SelectItem key={b.id} value={b.id!}>{b.bankName}</SelectItem>) : <SelectItem value="loading" disabled>Loading...</SelectItem>}
                            </SelectContent>
                        </Select>
                    )}/>
                </div>
            </div>

            <Separator className="my-6" />
            <div className="flex items-center gap-2">
                <Button type="submit" size="lg">Save/Submit</Button>
                 <Button type="button" variant="outline" size="lg" onClick={() => reset({ items: [], paymentMethod: 'On Credit', customerId: 'walk-in', date: new Date(), orderDeliveryDate: new Date(), bankAccountId: '', notes: '', extraDiscount: 0, paidAmount: 0, expenseAmount: 0, expenseBankAccountId: '', referenceNo: '' })}>Discard/Reset</Button>
            </div>
      </form>
  );
}
