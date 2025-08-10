

'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Receipt, Printer, LayoutDashboard, ShoppingCart } from 'lucide-react';
import { useTransactions } from '@/hooks/use-transactions';
import { usePurchases } from '@/hooks/use-purchases';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { Transaction, Purchase } from '@/lib/types';


export default function InvoicesPage() {
  const { transactions, isLoaded: transactionsLoaded } = useTransactions();
  const { purchases, isLoaded: purchasesLoaded } = usePurchases();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSales = useMemo(() => {
    let sales = transactions.filter(tx => tx.timestamp);
    if (!searchTerm) return sales;
    return sales.filter(sale =>
      sale.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.items.some(item => item.productName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [transactions, searchTerm]);

  const filteredPurchases = useMemo(() => {
    let allPurchases = purchases.filter(p => p.timestamp);
    if (!searchTerm) return allPurchases;
    return allPurchases.filter(purchase =>
        purchase.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
        purchase.items.some(item => item.productName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [purchases, searchTerm]);

  const isLoaded = transactionsLoaded && purchasesLoaded;


  return (
    <div className="p-4 md:p-8 space-y-8">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
                <CardTitle className="flex items-center gap-2">
                    <Receipt /> Sale Invoices
                </CardTitle>
                <CardDescription>A record of all sales transactions.</CardDescription>
            </div>
            <div className='flex gap-2 items-center'>
                 <Input 
                    placeholder="Search by customer or product..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                />
                <Button asChild variant="outline">
                    <Link href="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" /> Go to Dashboard</Link>
                </Button>
            </div>
          </div>
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
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.map((sale: Transaction) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium whitespace-nowrap">
                        {sale.timestamp ? format(new Date(sale.timestamp), 'PP pp') : 'N/A'}
                      </TableCell>
                      <TableCell>{sale.customerName || 'Walk-in'}</TableCell>
                      <TableCell>{sale.items.map(i => i.productName).join(', ')}</TableCell>
                      <TableCell>
                          <Badge variant="outline">{sale.paymentMethod}</Badge>
                      </TableCell>
                      <TableCell className={cn("text-right font-semibold font-mono", 'text-green-600')}>
                          {sale.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
              <div className="text-center py-12 text-muted-foreground">No sale invoices found.</div>
            )
          ) : (
            <div className="text-center py-12 text-muted-foreground">Loading invoices...</div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <ShoppingCart /> Purchase Invoices
            </CardTitle>
            <CardDescription>A record of all purchase transactions.</CardDescription>
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
                    <div className="text-center py-12 text-muted-foreground">No purchase invoices found.</div>
                )
            ) : (
                <div className="text-center py-12 text-muted-foreground">Loading invoices...</div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}

