
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
import { Trash2, Calendar as CalendarIcon, UserPlus, PlusCircle, ShoppingCart, Wallet, CreditCard, Smartphone, Landmark } from 'lucide-react';
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
import type { Product, SaleItem as SaleItemType } from '@/lib/types';
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
  paymentMethod: z.enum(['Cash', 'Bank', 'Mobile', 'On Credit']),
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

// State for the temporary form for adding a single item
const defaultItemState = {
    product: null as Product | null,
    unit: '',
    quantity: 1,
    price: 0,
    totalAmount: 0,
    bonusQty: 0,
    discountAmt: 0,
    discountPercent: 0,
    gstPercent: 0,
};

export function SaleForm() {
  const { addTransaction } = useTransactions();
  const { customers } = useCustomers();
  const { products, isLoaded: productsLoaded } = useProducts();
  const { bankAccounts, isLoaded: bankAccountsLoaded } = useBankAccounts();
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  
  const [currentItem, setCurrentItem] = useState(defaultItemState);
  const [lastAddedAmount, setLastAddedAmount] = useState(0);

  const productSelectionRef = useRef<HTMLButtonElement>(null);
  const customerSelectionRef = useRef<HTMLButtonElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

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
  const watchedPaymentMethod = watch('paymentMethod');

  const { balance: customerBalance } = useCustomerBalance(watchedCustomerId === 'walk-in' ? null : watchedCustomerId || null);

  const onSubmit = useCallback(async (data: SaleFormValues) => {
    const isWalkIn = !data.customerId || data.customerId === 'walk-in';
    const customer = !isWalkIn ? customers.find(c => c.id === data.customerId) : null;

    const grandTotal = data.items.reduce((sum, item) => sum + (item.totalAmount || 0), 0);

    const newTransaction = await addTransaction(data);
    
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
    setLastAddedAmount(0);

  }, [addTransaction, customers, reset, toast]);
  
    const handleQtyChange = (newQty: number) => {
        setCurrentItem(prev => ({
            ...prev,
            quantity: newQty,
            totalAmount: newQty * prev.price,
        }));
    };
    
    const handlePriceChange = (newPrice: number) => {
        setCurrentItem(prev => ({
            ...prev,
            price: newPrice,
            totalAmount: newPrice * prev.quantity,
        }));
    };
    
    const handleTotalAmountChange = (newTotal: number) => {
        const price = currentItem.price;
        const newQty = price > 0 ? newTotal / price : 0;
        setCurrentItem(prev => ({
            ...prev,
            quantity: newQty,
            totalAmount: newTotal,
        }));
    };

    const handleProductSelect = useCallback((product: Product) => {
        if (!product || !productsLoaded) return;
        
        const newPrice = product.retailPrice || product.tradePrice || 0;
        let newQuantity = 1;
        let newTotalAmount = newPrice;

        if(lastAddedAmount > 0) {
            newTotalAmount = lastAddedAmount;
            if(newPrice > 0) {
                newQuantity = newTotalAmount / newPrice;
            }
        }

        setCurrentItem(prev => ({
            ...prev,
            product,
            unit: product.mainUnit,
            price: newPrice,
            quantity: newQuantity,
            totalAmount: newTotalAmount,
        }));

    }, [productsLoaded, lastAddedAmount]);

    const handleAddToCart = useCallback(() => {
        const { product, quantity, price, discountAmt, gstPercent, bonusQty } = currentItem;
        if (!product) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please select a product first.' });
            return;
        }
        
        const totalAmount = (quantity * price) - discountAmt;
        const gstAmount = totalAmount * (gstPercent / 100);
        const finalAmount = totalAmount + gstAmount;

        append({
            productId: product.id!,
            productName: product.name,
            unit: currentItem.unit || product.mainUnit,
            quantity: quantity,
            pricePerUnit: price,
            totalAmount: finalAmount,
            discount: discountAmt,
            bonus: bonusQty,
            gst: gstAmount,
        });

        setLastAddedAmount(finalAmount);
        setCurrentItem({...defaultItemState, totalAmount: finalAmount});
        productSelectionRef.current?.focus();
    }, [append, currentItem, toast]);
  
    const { subTotal, totalDiscount, totalGst, grandTotal, dueBalance, newAccountBalance } = useMemo(() => {
        const sub = watchedItems.reduce((sum, item) => sum + (item.quantity * item.pricePerUnit), 0);
        const discount = watchedItems.reduce((sum, item) => sum + (item.discount || 0), 0);
        const gst = watchedItems.reduce((sum, item) => sum + (item.gst || 0), 0);
        const grand = sub - discount + gst;
        const due = grand - watchedPaidAmount;
        const newBalance = customerBalance + grand - watchedPaidAmount;
        return { subTotal: sub, totalDiscount: discount, totalGst: gst, grandTotal: grand, dueBalance: due, newAccountBalance: newBalance };
    }, [watchedItems, watchedPaidAmount, customerBalance]);
  
    useEffect(() => {
      if (watchedCustomerId === 'walk-in') {
        setValue('paymentMethod', 'Cash');
      } else {
        setValue('paymentMethod', 'On Credit');
      }
    }, [watchedCustomerId, setValue]);
  
    useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
          const target = event.target as HTMLElement;
  
          if (event.key === 'Enter' && target instanceof HTMLInputElement && formRef.current) {
              event.preventDefault();
              const focusable = Array.from(
                  formRef.current.querySelectorAll('input, button, select, textarea')
              ) as HTMLElement[];
              
              const index = focusable.indexOf(target);
              
              if (index > -1 && index < focusable.length - 1) {
                  focusable[index + 1].focus();
              } else if (target.id === 'gstPercentInput') {
                  handleAddToCart();
              }
          }
          
          if ((event.metaKey || event.ctrlKey) && event.key === 's') {
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
    }, [handleSubmit, onSubmit, handleAddToCart]);
    
    const handleCustomerSelect = (customerId: string) => {
      setValue('customerId', customerId);
      setTimeout(() => productSelectionRef.current?.focus(), 100);
    };
  
    if (!isClient) {
      return null;
    }

  return (
    <form onSubmit={handleSubmit(onSubmit)} ref={formRef}>
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
                        <ProductSelection 
                            onProductSelect={handleProductSelect} 
                            selectedProduct={currentItem.product}
                            ref={productSelectionRef} 
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label>Unit</Label>
                             <Select 
                                value={currentItem.unit}
                                onValueChange={(value) => setCurrentItem(prev => ({ ...prev, unit: value }))}
                                disabled={!currentItem.product || !currentItem.product.subUnit}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select unit" />
                                </SelectTrigger>
                                <SelectContent>
                                    {currentItem.product && <SelectItem value={currentItem.product.mainUnit}>{currentItem.product.mainUnit}</SelectItem>}
                                    {currentItem.product?.subUnit && <SelectItem value={currentItem.product.subUnit.name}>{currentItem.product.subUnit.name}</SelectItem>}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-1">
                            <Label>Quantity</Label>
                            <Input type="number" value={currentItem.quantity} onChange={e => handleQtyChange(parseFloat(e.target.value) || 0)} />
                        </div>
                    </div>
                    
                     <div className="space-y-1">
                        <Label>Price</Label>
                        <Input type="number" value={currentItem.price} onChange={e => handlePriceChange(parseFloat(e.target.value) || 0)} />
                    </div>

                    <div className="space-y-1">
                        <Label>Total Amount</Label>
                        <Input type="number" step="any" value={currentItem.totalAmount} onChange={e => handleTotalAmountChange(parseFloat(e.target.value) || 0)} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label>Bonus Qty</Label>
                            <Input type="number" value={currentItem.bonusQty} onChange={e => setCurrentItem(p => ({...p, bonusQty: parseFloat(e.target.value) || 0}))} />
                        </div>
                         <div className="space-y-1">
                            <Label>Discount (Amt)</Label>
                            <Input type="number" value={currentItem.discountAmt} onChange={e => setCurrentItem(p => ({...p, discountAmt: parseFloat(e.target.value) || 0}))} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label>Discount (%)</Label>
                            <Input type="number" value={currentItem.discountPercent} onChange={e => setCurrentItem(p => ({...p, discountPercent: parseFloat(e.target.value) || 0}))} />
                        </div>
                         <div className="space-y-1">
                            <Label>GST (%)</Label>
                            <Input id="gstPercentInput" type="number" value={currentItem.gstPercent} onChange={e => setCurrentItem(p => ({...p, gstPercent: parseFloat(e.target.value) || 0}))} />
                        </div>
                    </div>

                    <Button type="button" className="w-full" onClick={handleAddToCart}><PlusCircle/>Add to Cart</Button>

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
                        <Label>Payment Method</Label>
                         <Controller
                            name="paymentMethod"
                            control={control}
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger><SelectValue placeholder="Select payment method" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Cash"><div className="flex items-center gap-2"><Wallet/>Cash</div></SelectItem>
                                        <SelectItem value="Bank"><div className="flex items-center gap-2"><Landmark/>Bank</div></SelectItem>
                                        <SelectItem value="Mobile"><div className="flex items-center gap-2"><Smartphone/>Mobile</div></SelectItem>
                                        <SelectItem value="On Credit"><div className="flex items-center gap-2"><CreditCard/>On Credit</div></SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>
                     {watchedPaymentMethod === 'Bank' && (
                        <div className="space-y-1">
                          <Label>Bank Account</Label>
                          <Controller
                            name="bankAccountId"
                            control={control}
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger><SelectValue placeholder="Select bank" /></SelectTrigger>
                                <SelectContent>
                                    {bankAccountsLoaded && bankAccounts.map(acc => (
                                        <SelectItem key={acc.id} value={acc.id!}>{acc.bankName} - {acc.accountNumber}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            )}
                          />
                        </div>
                    )}
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
