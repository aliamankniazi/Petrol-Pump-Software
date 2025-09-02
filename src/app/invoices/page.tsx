

'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, startOfDay, endOfDay } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Receipt, Printer, LayoutDashboard, ShoppingCart, Calendar as CalendarIcon, X, DollarSign, Trash2, AlertTriangle } from 'lucide-react';
import { useTransactions } from '@/hooks/use-transactions';
import { usePurchases } from '@/hooks/use-purchases';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { Transaction, Purchase, Customer } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useProducts } from '@/hooks/use-products';
import { useGlobalDate } from '@/hooks/use-global-date';
import { useCustomers } from '@/hooks/use-customers';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';


export default function InvoicesPage() {
  const { transactions, deleteTransaction, isLoaded: transactionsLoaded } = useTransactions();
  const { purchases, deletePurchase, isLoaded: purchasesLoaded } = usePurchases();
  const { products, isLoaded: productsLoaded } = useProducts();
  const { customers, isLoaded: customersLoaded } = useCustomers();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  
  const { globalDateRange, setGlobalDateRange } = useGlobalDate();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  const [invoiceToDelete, setInvoiceToDelete] = useState<{ type: 'sale' | 'purchase', id: string, description: string } | null>(null);
  const { toast } = useToast();

  const isLoaded = transactionsLoaded && purchasesLoaded && productsLoaded && customersLoaded;

  const sortedPurchases = useMemo(() => {
    if (!purchasesLoaded) return [];
    // Sort purchases by date ascending to make finding the last purchase easier
    return [...purchases].sort((a, b) => new Date(a.timestamp!).getTime() - new Date(b.timestamp!).getTime());
  }, [purchases, purchasesLoaded]);


  const filteredSales = useMemo(() => {
    let sales = transactions.filter(tx => tx.timestamp && typeof tx.totalAmount === 'number');

    if (globalDateRange?.from) {
        const from = startOfDay(globalDateRange.from);
        const to = globalDateRange.to ? endOfDay(globalDateRange.to) : endOfDay(globalDateRange.from);

        sales = sales.filter(sale => {
            const saleDate = new Date(sale.timestamp!);
            return saleDate >= from && saleDate <= to;
        });
    }

    if (searchTerm) {
        sales = sales.filter(sale =>
            sale.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sale.items.some(item => item.productName.toLowerCase().includes(searchTerm.toLowerCase()))
        );
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

  }, [transactions, products, searchTerm, globalDateRange, sortedPurchases]);
  
  const customerProfitSummary = useMemo(() => {
    if (!isLoaded) return [];

    const summary: Record<string, { name: string; totalSale: number; totalProfit: number }> = {};

    transactions.forEach(tx => {
        if (typeof tx.totalAmount !== 'number') return;
        
        const customerId = tx.customerId || 'walk-in';
        const customerName = tx.customerName || 'Walk-in Customer';

        if (!summary[customerId]) {
            summary[customerId] = { name: customerName, totalSale: 0, totalProfit: 0 };
        }

        const saleProfit = tx.items.reduce((profit, item) => {
             const saleTimestamp = new Date(tx.timestamp!);
            const lastRelevantPurchaseItem = sortedPurchases
                .flatMap(p => p.items.map(pi => ({ ...pi, purchaseTimestamp: p.timestamp })))
                .filter(pi => pi.productId === item.productId && new Date(pi.purchaseTimestamp!) <= saleTimestamp)
                .pop();

            let costOfGoods = 0;
            if (lastRelevantPurchaseItem) {
                costOfGoods = item.quantity * lastRelevantPurchaseItem.costPerUnit;
            } else {
                const product = products.find(p => p.id === item.productId);
                costOfGoods = (product?.purchasePrice || 0) * item.quantity;
            }
            return profit + (item.totalAmount - costOfGoods);
        }, 0);

        summary[customerId].totalSale += tx.totalAmount;
        summary[customerId].totalProfit += saleProfit;
    });

    return Object.values(summary).sort((a, b) => b.totalProfit - a.totalProfit);

  }, [isLoaded, transactions, products, sortedPurchases]);


  const filteredPurchases = useMemo(() => {
    let allPurchases = purchases.filter(p => p.timestamp);

    if (globalDateRange?.from) {
        const from = startOfDay(globalDateRange.from);
        const to = globalDateRange.to ? endOfDay(globalDateRange.to) : endOfDay(globalDateRange.from);
        
        allPurchases = allPurchases.filter(p => {
            const purchaseDate = new Date(p.timestamp!);
            return purchaseDate >= from && purchaseDate <= to;
        });
    }
    
    if (searchTerm) {
        allPurchases = allPurchases.filter(purchase =>
            purchase.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
            purchase.items.some(item => item.productName.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }
    
    return allPurchases;
  }, [purchases, searchTerm, globalDateRange]);

  const handleDeleteInvoice = useCallback(() => {
    if (!invoiceToDelete) return;
    
    if (invoiceToDelete.type === 'sale') {
      deleteTransaction(invoiceToDelete.id);
      toast({ title: 'Sale Invoice Deleted', description: `The invoice has been successfully deleted.` });
    } else {
      deletePurchase(invoiceToDelete.id);
      toast({ title: 'Purchase Invoice Deleted', description: `The invoice has been successfully deleted.` });
    }
    
    setInvoiceToDelete(null);
  }, [invoiceToDelete, deleteTransaction, deletePurchase, toast]);


  const showSales = typeFilter === 'all' || typeFilter === 'sales';
  const showPurchases = typeFilter === 'all' || typeFilter === 'purchases';
  
  const hasActiveFilters = searchTerm || typeFilter !== 'all' || !!globalDateRange;

  return (
    <>
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
                                !globalDateRange && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {globalDateRange?.from ? (
                                globalDateRange.to ? (
                                    <>
                                        {format(globalDateRange.from, "LLL dd, y")} -{" "}
                                        {format(globalDateRange.to, "LLL dd, y")}
                                    </>
                                ) : (
                                    format(globalDateRange.from, "LLL dd, y")
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
                            defaultMonth={globalDateRange?.from}
                            selected={globalDateRange}
                            onSelect={(range) => {
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
                 {(globalDateRange || typeFilter !== 'all') && (
                    <Button variant="ghost" size="icon" onClick={() => { setGlobalDateRange(undefined); setTypeFilter('all'); }}>
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
                <CardTitle className="flex items-center gap-2 text-lg"><DollarSign /> Customer Profit Summary</CardTitle>
                <CardDescription>Total sales and profit calculated for each customer across all their transactions.</CardDescription>
            </CardHeader>
             <CardContent>
                {isLoaded ? (
                    customerProfitSummary.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Customer Name</TableHead>
                                    <TableHead className="text-right">Total Sales (PKR)</TableHead>
                                    <TableHead className="text-right">Total Profit (PKR)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {customerProfitSummary.map(summary => (
                                    <TableRow key={summary.name}>
                                        <TableCell className="font-medium">{summary.name}</TableCell>
                                        <TableCell className="text-right font-mono font-bold">{summary.totalSale.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</TableCell>
                                        <TableCell className={cn("text-right font-mono font-bold", summary.totalProfit >= 0 ? 'text-green-600' : 'text-destructive')}>
                                            {summary.totalProfit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">No customer sales found to generate a summary.</div>
                    )
                ) : (
                    <div className="text-center py-12 text-muted-foreground">Loading summary...</div>
                )}
             </CardContent>
         </Card>
      )}


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
                        <TableCell className={cn("text-right font-bold font-mono")}>
                            {(sale.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className={cn("text-right font-bold font-mono", sale.profit >= 0 ? 'text-green-600' : 'text-destructive')}>
                            {sale.profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-center space-x-0.5">
                            <Button asChild variant="ghost" size="icon" title="Print Invoice">
                                <Link href={`/invoice/sale/${sale.id}`} target="_blank">
                                <Printer className="w-4 h-4" />
                                </Link>
                            </Button>
                            <Button variant="ghost" size="icon" title="Delete Invoice" className="text-destructive" onClick={() => setInvoiceToDelete({type: 'sale', id: sale.id!, description: `invoice for ${sale.customerName}`})}>
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
                ) : (
                <div className="text-center py-12 text-muted-foreground">{hasActiveFilters ? 'No sale invoices found matching the current filters.' : 'No sale invoices found.'}</div>
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
                                    <TableCell className="text-right font-bold font-mono text-destructive">
                                        {purchase.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </TableCell>
                                    <TableCell className="text-center space-x-0.5">
                                        <Button asChild variant="ghost" size="icon" title="Print Invoice">
                                            <Link href={`/invoice/purchase/${purchase.id}`} target="_blank">
                                            <Printer className="w-4 h-4" />
                                            </Link>
                                        </Button>
                                        <Button variant="ghost" size="icon" title="Delete Invoice" className="text-destructive" onClick={() => setInvoiceToDelete({type: 'purchase', id: purchase.id!, description: `invoice from ${purchase.supplier}`})}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                         <div className="text-center py-12 text-muted-foreground">{hasActiveFilters ? 'No purchase invoices found matching the current filters.' : 'No purchase invoices found.'}</div>
                    )
                ) : (
                    <div className="text-center py-12 text-muted-foreground">Loading invoices...</div>
                )}
            </CardContent>
        </Card>
      )}
    </div>

    <AlertDialog open={!!invoiceToDelete} onOpenChange={(isOpen) => !isOpen && setInvoiceToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle/>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the {invoiceToDelete?.description}. All associated stock changes will be reverted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteInvoice} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Yes, delete invoice
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
