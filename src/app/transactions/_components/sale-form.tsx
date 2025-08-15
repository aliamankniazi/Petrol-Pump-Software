
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
import { Trash2, Calendar as CalendarIcon, UserPlus, PlusCircle } from 'lucide-react';
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

      if (event.key.toLowerCase() === 'a' && !['INPUT', 'TEXTAREA'].includes(target.tagName)) {
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

  const { subTotal, grandTotal, dueBalance } = useMemo(() => {
    const sub = watchedItems.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
    const grand = sub;
    const due = grand - watchedPaidAmount;
    return { subTotal: sub, grandTotal: grand, dueBalance: due };
  }, [watchedItems, watchedPaidAmount]);

  const handleProductSelect = useCallback((product: Product) => {
    if (!product || !productsLoaded) return;

    append({
        productId: product.id!,
        productName: product.name,
        unit: product.mainUnit,
        quantity: 1,
        pricePerUnit: product.retailPrice || product.tradePrice || 0,
        totalAmount: product.retailPrice || product.tradePrice || 0,
        discount: 0,
        bonus: 0,
    });
  }, [productsLoaded, append]);
  
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
      <Card>
          <CardHeader>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
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
                      <Label>Reference No.</Label>
                      <Input placeholder="e.g. PO-123" {...register('referenceNo')} />
                  </div>
              </div>
          </CardHeader>
          <CardContent className="space-y-6">
              <div className="p-4 rounded-lg bg-muted/50 border space-y-4">
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
              </div>

              <div className="border rounded-lg">
                  <div className="overflow-x-auto">
                      <Table>
                          <TableHeader>
                              <TableRow>
                                  <TableHead className="min-w-[200px]">Product</TableHead>
                                  <TableHead>Unit</TableHead>
                                  <TableHead>Price</TableHead>
                                  <TableHead>Qty</TableHead>
                                  <TableHead>Total</TableHead>
                                  <TableHead></TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {fields.length === 0 && (
                                  <TableRow>
                                      <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                          No products added yet.
                                      </TableCell>
                                  </TableRow>
                              )}
                              {fields.map((field, index) => {
                                  const product = products.find(p => p.id === field.productId);
                                  return (
                                  <TableRow key={field.id}>
                                      <TableCell>{field.productName}</TableCell>
                                      <TableCell>
                                        {product?.subUnit ? (
                                          <Controller
                                            name={`items.${index}.unit`}
                                            control={control}
                                            render={({ field }) => (
                                              <Select value={field.value} onValueChange={(value) => handleUnitChange(index, value)}>
                                                <SelectTrigger className="w-28">
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value={product.mainUnit}>{product.mainUnit}</SelectItem>
                                                  {product.subUnit && <SelectItem value={product.subUnit.name}>{product.subUnit.name}</SelectItem>}
                                                </SelectContent>
                                              </Select>
                                            )}
                                          />
                                        ) : (
                                          field.unit
                                        )}
                                      </TableCell>
                                      <TableCell>
                                          <Input type="number" step="any" {...register(`items.${index}.pricePerUnit`)} onChange={(e) => { const price = parseFloat(e.target.value) || 0; const qty = getValues(`items.${index}.quantity`); setValue(`items.${index}.totalAmount`, price * qty, { shouldTouch: true }); }} className="w-28"/>
                                      </TableCell>
                                      <TableCell>
                                          <Input type="number" step="any" {...register(`items.${index}.quantity`)} onChange={(e) => { const qty = parseFloat(e.target.value) || 0; const price = getValues(`items.${index}.pricePerUnit`); setValue(`items.${index}.totalAmount`, price * qty, { shouldTouch: true }); }} className="w-24"/>
                                      </TableCell>
                                      <TableCell>
                                          <Input type="number" step="any" {...register(`items.${index}.totalAmount`)} onChange={(e) => { const total = parseFloat(e.target.value) || 0; const price = getValues(`items.${index}.pricePerUnit`); if (price > 0) { setValue(`items.${index}.quantity`, total / price, { shouldTouch: true }); } }} className="w-28"/>
                                      </TableCell>
                                      <TableCell>
                                          <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                              <Trash2 className="text-destructive w-4 h-4"/>
                                          </Button>
                                      </TableCell>
                                  </TableRow>
                              )})}
                          </TableBody>
                      </Table>
                  </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                  <div>
                      <div className="space-y-2">
                          <Label>Notes / Description</Label>
                          <Textarea placeholder="Add any notes for this sale..." {...register('notes')} />
                        </div>
                  </div>
                  <div className="border rounded-lg p-4 space-y-4">
                      <div className="flex justify-between items-center text-sm">
                          <Label>Sub Total</Label>
                          <span className="font-medium">{subTotal.toFixed(2)}</span>
                        </div>
                        <Separator/>
                        <div className="flex justify-between items-center font-bold text-lg">
                          <Label>Grand Total</Label>
                          <span>{grandTotal.toFixed(2)}</span>
                        </div>
                        <div className="space-y-2">
                          <Label>Payment Method</Label>
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
                        <div className="space-y-2">
                          <Label htmlFor="paidAmount">Paid Amount</Label>
                          <Input id="paidAmount" type="number" step="any" {...register('paidAmount')} />
                        </div>
                        <div className="flex justify-between items-center font-bold text-lg text-destructive">
                          <Label>Due Balance</Label>
                          <span>{dueBalance.toFixed(2)}</span>
                        </div>
                  </div>
              </div>
          </CardContent>
          <CardFooter className="gap-2 justify-end">
              <Button type="button" variant="outline" size="lg" onClick={() => reset({ items: [], paymentMethod: 'On Credit', customerId: 'walk-in', date: new Date(), orderDeliveryDate: new Date(), bankAccountId: '', notes: '', paidAmount: 0, expenseAmount: 0, expenseBankAccountId: '', referenceNo: '' })}>Discard/Reset</Button>
              <Button type="submit" size="lg">Save Sale & Print Invoice</Button>
          </CardFooter>
      </Card>
    </form>
  );
}
