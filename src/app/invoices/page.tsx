
'use client';

import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, startOfDay, endOfDay } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Receipt, Printer, LayoutDashboard, ShoppingCart, Calendar as CalendarIcon, X } from 'lucide-react';
import { useTransactions } from '@/hooks/use-transactions';
import { usePurchases } from '@/hooks/use-purchases';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { Transaction, Purchase } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useProducts } from '@/hooks/use-products';
import { useGlobalDate } from '@/hooks/use-global-date.tsx';


export default function InvoicesPage() {
  const { transactions, isLoaded: transactionsLoaded } = useTransactions();
  const { purchases, isLoaded: purchasesLoaded } = usePurchases();
  const { products, isLoaded: productsLoaded } = useProducts();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  
  const { globalDateRange, setGlobalDateRange } = useGlobalDate();
  const [dateRange, setDateRange] = useState<DateRange | undefined>(globalDateRange);
  useEffect(() => { setDateRange(globalDateRange) }, [globalDateRange]);

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const isLoaded = transactionsLoaded && purchasesLoaded && productsLoaded;

  const sortedPurchases = useMemo(() => {
    if (!purchasesLoaded) return [];
    // Sort purchases by date ascending to make finding the last purchase easier
    return [...purchases].sort((a, b) => new Date(a.timestamp!).getTime() - new Date(b.timestamp!).getTime());
  }, [purchases, purchasesLoaded]);


  const filteredSales = useMemo(() => {
    let sales = transactions.filter(tx => tx.timestamp);
    if (searchTerm) {
        sales = sales.filter(sale =>
            sale.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sale.items.some(item => item.productName.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }
    if (dateRange?.from) {
        sales = sales.filter(sale => new Date(sale.timestamp!) >= startOfDay(dateRange.from!));
    }
    if (dateRange?.to) {
        sales = sales.filter(sale => new Date(sale.timestamp!) <= endOfDay(dateRange.to!));
    }
    
    return sales.map(sale => {
        const profit = sale.items.reduce((totalProfit, item) => {
            const saleTimestamp = new Date(sale.timestamp!);
            
            // Find the last purchase of this product that happened on or before the sale date
            const lastRelevantPurchaseItem = sortedPurchases
                .flatMap(p => p.items.map(pi => ({ ...pi, purchaseTimestamp: p.timestamp })))
                .filter(pi => pi.productId === item.productId && new Date(pi.purchaseTimestamp!) <= saleTimestamp)
                .pop(); // Get the last one from the sorted array

            let costOfGoods = 0;
            if (lastRelevantPurchaseItem) {
                // Use historical cost
                costOfGoods = item.quantity * lastRelevantPurchaseItem.costPerUnit;
            } else {
                // Fallback to current product purchase price if no historical purchase found
                const product = products.find(p => p.id === item.productId);
                costOfGoods = (product?.purchasePrice || 0) * item.quantity;
            }

            return totalProfit + (item.totalAmount - costOfGoods);
        }, 0);
        return { ...sale, profit };
    });

  }, [transactions, products, searchTerm, dateRange, sortedPurchases]);

  const filteredPurchases = useMemo(() => {
    let allPurchases = purchases.filter(p => p.timestamp);
    if (searchTerm) {
        allPurchases = allPurchases.filter(purchase =>
            purchase.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
            purchase.items.some(item => item.productName.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }
     if (dateRange?.from) {
        allPurchases = allPurchases.filter(p => new Date(p.timestamp!) >= startOfDay(dateRange.from!));
    }
    if (dateRange?.to) {
        allPurchases = allPurchases.filter(p => new Date(p.timestamp!) <= endOfDay(dateRange.to!));
    }
    return allPurchases;
  }, [purchases, searchTerm, dateRange]);


  const showSales = typeFilter === 'all' || typeFilter === 'sales';
  const showPurchases = typeFilter === 'all' || typeFilter === 'purchases';


  return (
    <div className="p-4 md:p-8 space-y-8">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
                <CardTitle className="flex items-center gap-2">
                    <Receipt /> All Invoices
                </CardTitle>
                <CardDescription>A record of all sales and purchase invoices.</CardDescription>
            </div>
            <div className='flex gap-2 items-center flex-wrap justify-end'>
                 <Input 
                    placeholder="Search by partner or product..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                />
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by type..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Invoices</SelectItem>
                        <SelectItem value="sales">Sales</SelectItem>
                        <SelectItem value="purchases">Purchases</SelectItem>
                    </SelectContent>
                </Select>
                 <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            id="date"
                            variant={"outline"}
                            className={cn(
                                "w-[280px] justify-start text-left font-normal",
                                !dateRange && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange?.from ? (
                                dateRange.to ? (
                                    <>
                                        {format(dateRange.from, "LLL dd, y")} -{" "}
                                        {format(dateRange.to, "LLL dd, y")}
                                    </>
                                ) : (
                                    format(dateRange.from, "LLL dd, y")
                                )
                            ) : (
                                <span>Pick a date range</span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={dateRange?.from}
                            selected={dateRange}
                            onSelect={(range) => {
                                setDateRange(range);
                                setGlobalDateRange(range);
                                if (range?.from && range.to) {
                                    setIsCalendarOpen(false);
                                }
                            }}
                            numberOfMonths={2}
                            withQuickActions
                        />
                    </PopoverContent>
                </Popover>
                 {(dateRange || typeFilter !== 'all') && (
                    <Button variant="ghost" size="icon" onClick={() => { setDateRange(undefined); setTypeFilter('all'); setGlobalDateRange(undefined); }}>
                        <X className="h-4 w-4" />
                    </Button>
                 )}
                <Button asChild variant="outline">
                    <Link href="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" /> Go to Dashboard</Link>
                </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {showSales && (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg"><Receipt /> Sale Invoices</CardTitle>
            </CardHeader>
            <CardContent>
            {isLoaded ? (
                filteredSales.length > 0 ? (
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead>Payment Method</TableHead>
                        <TableHead className="text-right">Amount (PKR)</TableHead>
                        <TableHead className="text-right">Profit (PKR)</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {filteredSales.map((sale) => (
                        <TableRow key={sale.id}>
                        <TableCell className="font-medium whitespace-nowrap">
                            {sale.timestamp ? format(new Date(sale.timestamp), 'PP pp') : 'N/A'}
                        </TableCell>
                        <TableCell>{sale.customerName || 'Walk-in'}</TableCell>
                        <TableCell>{sale.items.map(i => i.productName).join(', ')}</TableCell>
                        <TableCell>
                            <Badge variant="outline">{sale.paymentMethod}</Badge>
                        </TableCell>
                        <TableCell className={cn("text-right font-semibold font-mono")}>
                            {sale.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className={cn("text-right font-semibold font-mono", sale.profit >= 0 ? 'text-green-600' : 'text-destructive')}>
                            {sale.profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-center space-x-0.5">
                            <Button asChild variant="ghost" size="icon" title="Print Invoice">
                                <Link href={`/invoice/sale/${sale.id}`} target="_blank">
                                <Printer className="w-4 h-4" />
                                </Link>
                            </Button>
                        </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
                ) : (
                <div className="text-center py-12 text-muted-foreground">No sale invoices found matching the current filters.</div>
                )
            ) : (
                <div className="text-center py-12 text-muted-foreground">Loading invoices...</div>
            )}
            </CardContent>
        </Card>
      )}
      
      {showPurchases && (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <ShoppingCart /> Purchase Invoices
                </CardTitle>
            </CardHeader>
            <CardContent>
                {isLoaded ? (
                    filteredPurchases.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Supplier</TableHead>
                                    <TableHead>Details</TableHead>
                                    <TableHead className="text-right">Amount (PKR)</TableHead>
                                    <TableHead className="text-center">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredPurchases.map((purchase: Purchase) => (
                                    <TableRow key={purchase.id}>
                                    <TableCell className="font-medium whitespace-nowrap">
                                        {purchase.timestamp ? format(new Date(purchase.timestamp), 'PP pp') : 'N/A'}
                                    </TableCell>
                                    <TableCell>{purchase.supplier}</TableCell>
                                    <TableCell>{purchase.items.map(i => i.productName).join(', ')}</TableCell>
                                    <TableCell className="text-right font-semibold font-mono text-destructive">
                                        {purchase.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </TableCell>
                                    <TableCell className="text-center space-x-0.5">
                                        <Button asChild variant="ghost" size="icon" title="Print Invoice">
                                            <Link href={`/invoice/purchase/${purchase.id}`} target="_blank">
                                            <Printer className="w-4 h-4" />
                                            </Link>
                                        </Button>
                                    </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">No purchase invoices found matching the current filters.</div>
                    )
                ) : (
                    <div className="text-center py-12 text-muted-foreground">Loading invoices...</div>
                )}
            </CardContent>
        </Card>
      )}
    </div>
  );
}
