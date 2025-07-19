
'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Archive, XCircle } from 'lucide-react';
import { useTransactions } from '@/hooks/use-transactions';
import { usePurchases } from '@/hooks/use-purchases';
import { usePurchaseReturns } from '@/hooks/use-purchase-returns';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

type CombinedEntry = {
  id: string;
  timestamp: string;
  type: 'Sale' | 'Purchase' | 'Purchase Return';
  partner: string;
  details: string;
  amount: number;
};

export default function AllTransactionsPage() {
  const { transactions, isLoaded: transactionsLoaded } = useTransactions();
  const { purchases, isLoaded: purchasesLoaded } = usePurchases();
  const { purchaseReturns, isLoaded: purchaseReturnsLoaded } = usePurchaseReturns();
  const [searchTerm, setSearchTerm] = useState('');

  const isLoaded = transactionsLoaded && purchasesLoaded && purchaseReturnsLoaded;

  const combinedEntries = useMemo(() => {
    if (!isLoaded) return [];

    const sales: CombinedEntry[] = transactions.map(tx => ({
      id: `sale-${tx.id}`,
      timestamp: tx.timestamp,
      type: 'Sale',
      partner: tx.customerName || 'Walk-in Customer',
      details: `${tx.volume.toFixed(2)}L of ${tx.fuelType}`,
      amount: tx.totalAmount,
    }));

    const allPurchases: CombinedEntry[] = purchases.map(p => ({
      id: `purchase-${p.id}`,
      timestamp: p.timestamp,
      type: 'Purchase',
      partner: p.supplier,
      details: `${p.volume.toFixed(2)}L of ${p.fuelType}`,
      amount: p.totalCost,
    }));

    const returns: CombinedEntry[] = purchaseReturns.map(pr => ({
      id: `return-${pr.id}`,
      timestamp: pr.timestamp,
      type: 'Purchase Return',
      partner: pr.supplier,
      details: `${pr.volume.toFixed(2)}L of ${pr.fuelType}`,
      amount: pr.totalRefund,
    }));

    return [...sales, ...allPurchases, ...returns].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [isLoaded, transactions, purchases, purchaseReturns]);

  const filteredEntries = useMemo(() => {
    if (!searchTerm) return combinedEntries;
    return combinedEntries.filter(entry =>
      entry.partner.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.details.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [combinedEntries, searchTerm]);

  const getBadgeVariant = (type: CombinedEntry['type']) => {
    switch (type) {
      case 'Sale': return 'outline';
      case 'Purchase': return 'destructive';
      case 'Purchase Return': return 'secondary';
      default: return 'default';
    }
  };
  
  const getAmountClass = (type: CombinedEntry['type']) => {
      switch(type) {
          case 'Sale': return 'text-green-600';
          case 'Purchase': return 'text-destructive';
          case 'Purchase Return': return 'text-blue-600';
          default: return '';
      }
  }

  return (
    <div className="p-4 md:p-8">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
                <CardTitle className="flex items-center gap-2">
                    <Archive /> All Transactions
                </CardTitle>
                <CardDescription>A unified record of all sales, purchases, and returns.</CardDescription>
            </div>
            <Input 
                placeholder="Search by partner, type, details..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoaded && filteredEntries.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Partner</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead className="text-right">Amount (PKR)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map(entry => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium whitespace-nowrap">
                      {format(new Date(entry.timestamp), 'PP pp')}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={getBadgeVariant(entry.type)}
                        className={cn(entry.type === 'Sale' && 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700')}
                      >{entry.type}</Badge>
                    </TableCell>
                    <TableCell>{entry.partner}</TableCell>
                    <TableCell>{entry.details}</TableCell>
                    <TableCell className={cn("text-right font-semibold font-mono", getAmountClass(entry.type))}>
                        {entry.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
              {isLoaded ? (
                <>
                  <XCircle className="w-16 h-16" />
                  <h3 className="text-xl font-semibold">
                    {searchTerm ? 'No Matching Transactions' : 'No Transactions Yet'}
                  </h3>
                  <p>{searchTerm ? 'Try a different search term.' : 'Sales, purchases, and returns will appear here.'}</p>
                </>
              ) : (
                <p>Loading transactions...</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
