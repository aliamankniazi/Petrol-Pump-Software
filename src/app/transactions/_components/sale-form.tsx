
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash2, Calendar as CalendarIcon, ShoppingCart, UserPlus, Check, ChevronsUpDown } from 'lucide-react';
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
import { useRouter } from 'next/navigation';
import { Textarea } from '@/components/ui/textarea';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';


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

export function SaleForm() {
  const { addTransaction, transactions } = useTransactions();
  const { customers, isLoaded: customersLoaded } = useCustomers();
  const { products, isLoaded: productsLoaded } = useProducts();
  const { bankAccounts, isLoaded: bankAccountsLoaded } = useBankAccounts();
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const router = useRouter();
  
  const [currentItem, setCurrentItem] = useState({ productId: 'placeholder', selectedUnit: '...', quantity: '', pricePerUnit: '', bonus: '', discountAmount: '', discountPercent: '', totalValue: '' });
  const [lastFocused, setLastFocused] = useState<'quantity' | 'total'>('quantity');
  
  const [productSearch, setProductSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');

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

  const { balance: customerBalance } = useCustomerBalance(watchedCustomerId === 'walk-in' ? null : watchedCustomerId || null);
  
    useEffect(() => {
        const quantity = parseFloat(currentItem.quantity) || 0;
        const price = parseFloat(currentItem.pricePerUnit) || 0;
        const discountAmount = parseFloat(currentItem.discountAmount) || 0;
        const totalValue = parseFloat(currentItem.totalValue) || 0;
        
        if (lastFocused === 'quantity') {
            let total = quantity * price;
            if (discountAmount > 0) {
                total -= discountAmount;
            }
            setCurrentItem(prev => ({...prev, totalValue: total > 0 ? total.toFixed(2) : ''}));
        } else if (lastFocused === 'total' && price > 0) {
            let calculatedQty = totalValue / price;
             setCurrentItem(prev => ({...prev, quantity: calculatedQty > 0 ? calculatedQty.toFixed(2) : ''}));
        }
    
    }, [currentItem.quantity, currentItem.pricePerUnit, currentItem.discountAmount, currentItem.totalValue, lastFocused]);
  
  const handleCurrentProductChange = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if(product) {
        // Find the most recent transaction for this product to get the last sale price
        const lastSaleOfProduct = transactions
            .flatMap(tx => tx.items.map(item => ({...item, timestamp: tx.timestamp})))
            .filter(item => item.productId === productId && item.timestamp)
            .sort((a, b) => new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime())
            [0];

        const salePrice = lastSaleOfProduct ? lastSaleOfProduct.pricePerUnit : (product.tradePrice || 0);

        setCurrentItem(prev => ({
            ...prev, 
            productId, 
            pricePerUnit: salePrice.toString(),
            selectedUnit: product.mainUnit,
        }));
    } else {
        setCurrentItem({ productId: 'placeholder', selectedUnit: '...', quantity: '', pricePerUnit: '', bonus: '', discountAmount: '', discountPercent: '', totalValue: '' });
    }
  }

  const handleUnitChange = (unitName: string) => {
      const product = products.find(p => p.id === currentItem.productId);
      if (!product) return;
      
      let newPrice = product.tradePrice || 0;
      if (unitName !== product.mainUnit && product.subUnit && product.subUnit.name === unitName) {
          if (product.subUnit.tradePrice) {
              newPrice = product.subUnit.tradePrice;
          } else if(product.subUnit.conversionRate) {
              newPrice = (product.tradePrice || 0) / product.subUnit.conversionRate;
          }
      }

      setCurrentItem(prev => ({
          ...prev,
          selectedUnit: unitName,
          pricePerUnit: newPrice.toFixed(2),
      }))
  }
  
  const handleAddItemToSale = () => {
    const product = products.find(p => p.id === currentItem.productId);
    if (!product || !product.id || currentItem.productId === 'placeholder') {
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

    if (!totalAmount || totalAmount <= 0) {
        toast({ variant: 'destructive', title: 'Error', description: 'Total value must be greater than zero.' });
        return;
    }

    append({
        productId: product.id!,
        productName: product.name,
        unit: currentItem.selectedUnit,
        quantity: quantity,
        pricePerUnit: pricePerUnit,
        totalAmount: totalAmount,
        discount: discount,
        bonus: parseFloat(currentItem.bonus) || 0,
    });
    
    setCurrentItem({ productId: 'placeholder', selectedUnit: '...', quantity: '', pricePerUnit: '', bonus: '', discountAmount: '', discountPercent: '', totalValue: '' });
  }

  const { grandTotal } = useMemo(() => {
    const sub = watchedItems.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
    const discount = Number(getValues('extraDiscount')) || 0;
    const grand = sub - discount;
    return { grandTotal: grand };
  }, [watchedItems, getValues]);


  const onSubmit: SubmitHandler<SaleFormValues> = async (data) => {
    const isWalkIn = !data.customerId || data.customerId === 'walk-in';
    const customer = !isWalkIn ? customers.find(c => c.id === data.customerId) : null;

    const newTransaction = await addTransaction({
      ...data,
      totalAmount: grandTotal,
      customerName: isWalkIn ? 'Walk-in Customer' : customer?.name,
    });
    
    toast({
      title: 'Sale Recorded',
      description: `Transaction of PKR ${grandTotal.toLocaleString()} has been successfully recorded.`,
    });
    
    const defaultDate = isClient && localStorage.getItem(LOCAL_STORAGE_KEY) ? new Date(localStorage.getItem(LOCAL_STORAGE_KEY)!) : new Date();
    reset({ 
        items: [],
        paymentMethod: 'On Credit',
        customerId: 'walk-in',
        date: defaultDate,
        orderDeliveryDate: defaultDate,
        bankAccountId: '',
        notes: '',
        extraDiscount: 0,
        paidAmount: 0,
        expenseAmount: 0,
        expenseBankAccountId: '',
        referenceNo: '',
    });

    if (newTransaction?.id) {
        router.push(`/invoice/sale/${newTransaction.id}`);
    }
  };

  const selectedProduct = products.find(p => p.id === currentItem.productId);


  if (!isClient) {
    return null;
  }

  return (
      <form onSubmit={handleSubmit(onSubmit)}>
            <div className="p-4 rounded-lg bg-muted/50 border space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                        <Label>Product</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                variant="outline"
                                role="combobox"
                                className="w-full justify-between"
                                >
                                {currentItem.productId !== 'placeholder'
                                    ? products.find((p) => p.id === currentItem.productId)?.name
                                    : "Select Product"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command>
                                <CommandInput placeholder="Search product..." onValueChange={setProductSearch}/>
                                <CommandList>
                                    <CommandEmpty>No product found.</CommandEmpty>
                                    <CommandGroup>
                                    {products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase())).map((p) => (
                                        <CommandItem
                                        key={p.id}
                                        value={p.id}
                                        onSelect={(currentValue) => {
                                            handleCurrentProductChange(currentValue === currentItem.productId ? 'placeholder' : currentValue)
                                        }}
                                        >
                                        <Check
                                            className={cn(
                                            "mr-2 h-4 w-4",
                                            currentItem.productId === p.id ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        {p.name}
                                        </CommandItem>
                                    ))}
                                    </CommandGroup>
                                </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="space-y-1">
                        <Label>Unit</Label>
                         <Select onValueChange={handleUnitChange} value={currentItem.selectedUnit}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Unit"/>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="..." disabled>...</SelectItem>
                                {selectedProduct && <SelectItem key={selectedProduct.mainUnit} value={selectedProduct.mainUnit}>{selectedProduct.mainUnit}</SelectItem>}
                                {selectedProduct?.subUnit && <SelectItem key={selectedProduct.subUnit.name} value={selectedProduct.subUnit.name}>{selectedProduct.subUnit.name}</SelectItem>}
                            </SelectContent>
                         </Select>
                    </div>
                     <div className="space-y-1">
                        <Label>Enter Qty</Label>
                        <Input type="number" step="any" placeholder="0" value={currentItem.quantity} onFocus={() => setLastFocused('quantity')} onChange={e => setCurrentItem(prev => ({...prev, quantity: e.target.value}))}/>
                    </div>
                    <div className="space-y-1">
                        <Label>Sale At</Label>
                        <Input type="number" step="any" placeholder="0.00" value={currentItem.pricePerUnit} onChange={e => setCurrentItem(prev => ({...prev, pricePerUnit: e.target.value}))} />
                    </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                     <div className="space-y-1 hidden">
                        <Label>Bonus</Label>
                        <Input type="number" placeholder="bonus qty" value={currentItem.bonus} onChange={e => setCurrentItem(prev => ({...prev, bonus: e.target.value}))}/>
                    </div>
                    <div className="space-y-1 hidden">
                        <Label>Discount (Amount)</Label>
                        <Input type="number" step="0.01" placeholder="RS 0" value={currentItem.discountAmount} onChange={e => setCurrentItem(prev => ({...prev, discountAmount: e.target.value}))}/>
                    </div>
                    <div className="space-y-1">
                        <Label>Total Value</Label>
                        <Input type="number" step="any" placeholder="0.00" value={currentItem.totalValue} onFocus={() => setLastFocused('total')} onChange={e => setCurrentItem(prev => ({...prev, totalValue: e.target.value}))} />
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
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                    variant="outline"
                                    role="combobox"
                                    className="w-full justify-between"
                                    >
                                    {field.value && field.value !== 'walk-in'
                                        ? customers.find((c) => c.id === field.value)?.name
                                        : "Walk-in Customer"}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                    <Command>
                                    <CommandInput placeholder="Search customer..." onValueChange={setCustomerSearch} />
                                    <CommandList>
                                        <CommandEmpty>No customer found.</CommandEmpty>
                                        <CommandGroup>
                                            <CommandItem value="walk-in" onSelect={() => field.onChange('walk-in')}>
                                                <Check className={cn("mr-2 h-4 w-4", field.value === 'walk-in' ? "opacity-100" : "opacity-0")}/>
                                                Walk-in Customer
                                            </CommandItem>
                                        {customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase())).map((c) => (
                                            <CommandItem
                                            key={c.id}
                                            value={c.id}
                                            onSelect={(currentValue) => {
                                                field.onChange(currentValue === field.value ? '' : currentValue)
                                            }}
                                            >
                                            <Check
                                                className={cn(
                                                "mr-2 h-4 w-4",
                                                field.value === c.id ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            {c.name}
                                            </CommandItem>
                                        ))}
                                        </CommandGroup>
                                    </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
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
                 <div className="space-y-1 lg:col-span-2">
                    <Label>Sale Description</Label>
                    <Textarea placeholder="Type sale description or notes..." {...register('notes')} />
                </div>
            </div>
            <div className="mt-4">
                 <Button type="submit" size="lg">Save & Go to Invoice</Button>
            </div>
      </form>
  );
}
