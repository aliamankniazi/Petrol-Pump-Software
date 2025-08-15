
'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Calendar as CalendarIcon, UserPlus, PlusCircle, ShoppingCart } from 'lucide-react';
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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';


const saleItemSchema = z.object({
  productId: z.string().min(1, 'Product is required.'),
  productName: z.string(),
  unit: z.string(),
  quantity: z.coerce.number().min(0.01, 'Quantity must be positive.'),
  pricePerUnit: z.coerce.number().min(0, "Price must be non-negative."),
  totalAmount: z.coerce.number().min(0.01, 'Amount must be positive.'),
  discount: z.coerce.number().default(0),
  bonus: z.coerce.number().default(0),
  gst: z.coerce.number().default(0),
});

const saleSchema = z.object({
  customerId: z.string().optional(),
  paymentMethod: z.enum(['Cash', 'Card', 'Mobile', 'On Credit']),
  bankAccountId: z.string().optional(),
  notes: z.string().optional(),
  date: z.date({ required_error: "A date is required."}),
  orderDeliveryDate: z.date().optional(),
  items: z.array(saleItemSchema).min(1, 'At least one item is required.'),
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
  
  const productSelectionRef = useRef<HTMLButtonElement>(null);
  const customerSelectionRef = useRef<HTMLButtonElement>(null);

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
  const watchedPaidAmount = watch('paidAmount');


  const { balance: customerBalance } = useCustomerBalance(watchedCustomerId === 'walk-in' ? null : watchedCustomerId || null);

  const onSubmit = useCallback(async (data: SaleFormValues) => {
    const isWalkIn = !data.customerId || data.customerId === 'walk-in';
    const customer = !isWalkIn ? customers.find(c => c.id === data.customerId) : null;

    const grandTotal = data.items.reduce((sum, item) => sum + (item.totalAmount || 0), 0);

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
       
      if (event.key.toLowerCase() === 'a' && target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          event.preventDefault();
          customerSelectionRef.current?.click();
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

  const { subTotal, totalDiscount, totalGst, grandTotal, dueBalance, newAccountBalance } = useMemo(() => {
    const sub = watchedItems.reduce((sum, item) => sum + (item.quantity * item.pricePerUnit), 0);
    const discount = watchedItems.reduce((sum, item) => sum + (item.discount || 0), 0);
    const gst = watchedItems.reduce((sum, item) => sum + (item.gst || 0), 0);
    const grand = sub - discount + gst;
    const due = grand - watchedPaidAmount;
    const newBalance = customerBalance + grand - watchedPaidAmount;
    return { subTotal: sub, totalDiscount: discount, totalGst: gst, grandTotal: grand, dueBalance: due, newAccountBalance: newBalance };
  }, [watchedItems, watchedPaidAmount, customerBalance]);

  const handleProductSelect = useCallback((product: Product) => {
    if (!product || !productsLoaded) return;

    // Find the last sale price for this product
    const reversedTransactions = [...transactions].reverse();
    const lastSaleOfProduct = reversedTransactions
      .flatMap(tx => tx.items)
      .find(item => item.productId === product.id);

    const priceToUse = lastSaleOfProduct?.pricePerUnit ?? (product.retailPrice || product.tradePrice || 0);

    append({
        productId: product.id!,
        productName: product.name,
        unit: product.mainUnit,
        quantity: 1,
        pricePerUnit: priceToUse,
        totalAmount: priceToUse, // For quantity 1
        discount: 0,
        bonus: 0,
        gst: 0,
    });
  }, [productsLoaded, append, transactions]);
  
  const handleUnitChange = (index: number, newUnit: string) => {
    const item = getValues(`items.${index}`);
    const product = products.find(p => p.id === item.productId);
    if (!product) return;

    let newPrice = product.retailPrice || product.tradePrice || 0;
    if (product.subUnit && newUnit === product.subUnit.name) {
        newPrice = product.subUnit.retailPrice || product.subUnit.tradePrice || 0;
    }
    
    setValue(`items.${index}.unit`, newUnit);
    setValue(`items.${index}.pricePerUnit`, newPrice);
    setValue(`items.${index}.totalAmount`, newPrice * item.quantity);
  };

  const handleCustomerSelect = (customerId: string) => {
    setValue('customerId', customerId);
    // Focus the product selection button after a customer is selected
    setTimeout(() => productSelectionRef.current?.focus(), 100);
  };

  if (!isClient) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Create Sale */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create Sale</CardTitle>
              <CardDescription>Select products and add them to the cart.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="space-y-1">
                <Label>Customer</Label>
                <div className="flex items-center gap-2">
                    <CustomerSelection
                        ref={customerSelectionRef}
                        selectedCustomerId={watchedCustomerId}
                        onCustomerSelect={handleCustomerSelect}
                    />
                    <Button type="button" variant="outline" size="icon" asChild><Link href="/customers" title="Add new customer"><UserPlus /></Link></Button>
                </div>
              </div>
               <div className="space-y-1">
                  <Label>Product</Label>
                  <div className="flex items-center gap-2">
                      <ProductSelection onProductSelect={handleProductSelect} ref={productSelectionRef} />
                      <Button type="button" variant="outline" size="icon" asChild>
                          <Link href="/settings" title="Add new product">
                              <PlusCircle />
                          </Link>
                      </Button>
                  </div>
              </div>
              
            </CardContent>
          </Card>
        </div>

        {/* Middle Column: Current Cart & Finalize */}
        <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><ShoppingCart /> Current Cart</CardTitle>
                <CardDescription>Items to be included in the sale.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-x-auto">
                      <Table>
                          <TableHeader>
                              <TableRow>
                                  <TableHead>Item</TableHead>
                                  <TableHead>Qty</TableHead>
                                  <TableHead>Price</TableHead>
                                  <TableHead>Total</TableHead>
                                  <TableHead></TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {fields.length === 0 && (
                                  <TableRow>
                                      <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                          List is empty
                                      </TableCell>
                                  </TableRow>
                              )}
                              {fields.map((field, index) => (
                                  <TableRow key={field.id}>
                                      <TableCell className="font-medium">{field.productName}</TableCell>
                                      <TableCell>
                                        <Input type="number" step="any" {...register(`items.${index}.quantity`)} onChange={(e) => { const qty = parseFloat(e.target.value) || 0; const price = getValues(`items.${index}.pricePerUnit`); setValue(`items.${index}.totalAmount`, price * qty, { shouldTouch: true }); }} className="w-20"/>
                                      </TableCell>
                                      <TableCell>
                                        <Input type="number" step="any" {...register(`items.${index}.pricePerUnit`)} onChange={(e) => { const price = parseFloat(e.target.value) || 0; const qty = getValues(`items.${index}.quantity`); setValue(`items.${index}.totalAmount`, price * qty, { shouldTouch: true }); }} className="w-24"/>
                                      </TableCell>
                                      <TableCell className="font-semibold">{watchedItems[index]?.totalAmount.toFixed(2)}</TableCell>
                                      <TableCell>
                                          <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                              <Trash2 className="text-destructive w-4 h-4"/>
                                          </Button>
                                      </TableCell>
                                  </TableRow>
                              ))}
                          </TableBody>
                      </Table>
                </div>
              </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Finalize Sale</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                     <div className="space-y-1">
                      <Label>Invoice Date</Label>
                      <Controller name="date" control={control} render={({ field }) => (
                          <Popover>
                              <PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}</Button></PopoverTrigger>
                              <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={(d) => {if(d) field.onChange(d);}} initialFocus /></PopoverContent>
                          </Popover>
                      )}/>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="expenseAmount">Expense Amount</Label>
                    <Input id="expenseAmount" type="number" step="any" {...register('expenseAmount')} />
                  </div>
                  <div className="space-y-1">
                    <Label>Notes</Label>
                    <Textarea placeholder="Add any notes for the invoice..." {...register('notes')} />
                  </div>
                </CardContent>
            </Card>
        </div>

        {/* Right Column: Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
              <CardHeader><CardTitle>Invoice Summary</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span>Subtotal</span><span className="font-medium">{subTotal.toFixed(2)}</span></div>
                      <div className="flex justify-between"><span>Total Item Discount</span><span className="font-medium">{totalDiscount.toFixed(2)}</span></div>
                      <div className="flex justify-between"><span>Sales Tax (GST)</span><span className="font-medium">{totalGst.toFixed(2)}</span></div>
                  </div>
                  <Separator/>
                  <div className="flex justify-between items-center font-bold text-lg">
                      <Label>Invoice Total</Label>
                      <span>{grandTotal.toFixed(2)}</span>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paidAmount">Paid Amount</Label>
                    <Input id="paidAmount" type="number" step="any" {...register('paidAmount')} />
                  </div>
                  <div className="flex justify-between items-center font-bold text-md text-destructive">
                    <Label>Invoice Balance</Label>
                    <span>{dueBalance.toFixed(2)}</span>
                  </div>
                  <Separator/>
                   <div className="space-y-2 text-sm">
                      <h4 className="font-semibold">Customer Account</h4>
                      <div className="flex justify-between"><span>Previous Balance</span><span className="font-medium">{customerBalance.toFixed(2)}</span></div>
                      <div className="flex justify-between font-bold text-md"><span>New Account Balance</span><span className={cn(newAccountBalance >= 0 ? 'text-destructive' : 'text-green-600')}>{newAccountBalance.toFixed(2)}</span></div>
                  </div>
              </CardContent>
              <CardFooter className="grid grid-cols-2 gap-2">
                  <Button type="button" variant="outline" size="lg" onClick={() => reset({ items: [], paymentMethod: 'On Credit', customerId: 'walk-in', date: new Date(), orderDeliveryDate: new Date(), bankAccountId: '', notes: '', paidAmount: 0, expenseAmount: 0, expenseBankAccountId: '', referenceNo: '' })}>Discard</Button>
                  <Button type="submit" size="lg">Complete & Print Invoice</Button>
              </CardFooter>
          </Card>
        </div>
      </div>
    </form>
  );
}
