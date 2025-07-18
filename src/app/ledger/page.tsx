'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { BookOpen, DollarSign } from 'lucide-react';
import { useTransactions } from '@/hooks/use-transactions';
import { usePurchases } from '@/hooks/use-purchases';
import { useExpenses } from '@/hooks/use-expenses';
import { usePurchaseReturns } from '@/hooks/use-purchase-returns';

type LedgerEntry = {
  id: string;
  timestamp: string;
  description: string;
  type: 'Sale' | 'Purchase' | 'Expense' | 'Purchase Return';
  amount: number;
  balanceEffect: 'credit' | 'debit';
};

export default function LedgerPage() {
  const { transactions, isLoaded: transactionsLoaded } = useTransactions();
  const { purchases, isLoaded: purchasesLoaded } = usePurchases();
  const { expenses, isLoaded: expensesLoaded } = useExpenses();
  const { purchaseReturns, isLoaded: purchaseReturnsLoaded } = usePurchaseReturns();

  const isLoaded = transactionsLoaded && purchasesLoaded && expensesLoaded && purchaseReturnsLoaded;

  const ledgerEntries = useMemo(() => {
    if (!isLoaded) return [];

    const allEntries: LedgerEntry[] = [];

    transactions.forEach(tx => allEntries.push({
      id: `tx-${tx.id}`,
      timestamp: tx.timestamp,
      description: `Sale: ${tx.volume.toFixed(2)}L of ${tx.fuelType}`,
      type: 'Sale',
      amount: tx.totalAmount,
      balanceEffect: 'debit', // Changed to debit to appear red
    }));

    purchases.forEach(p => allEntries.push({
      id: `pur-${p.id}`,
      timestamp: p.timestamp,
      description: `Purchase from ${p.supplier}: ${p.volume.toFixed(2)}L of ${p.fuelType}`,
      type: 'Purchase',
      amount: p.totalCost,
      balanceEffect: 'debit',
    }));

    expenses.forEach(e => allEntries.push({
        id: `exp-${e.id}`,
        timestamp: e.timestamp,
        description: `Expense: ${e.description}`,
        type: 'Expense',
        amount: e.amount,
        balanceEffect: 'debit',
    }));
      
    purchaseReturns.forEach(pr => allEntries.push({
        id: `pr-${pr.id}`,
        timestamp: pr.timestamp,
        description: `Return to ${pr.supplier}: ${pr.volume.toFixed(2)}L of ${pr.fuelType}`,
        type: 'Purchase Return',
        amount: pr.totalRefund,
        balanceEffect: 'credit',
    }));

    return allEntries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  }, [transactions, purchases, expenses, purchaseReturns, isLoaded]);

  const getBadgeVariant = (type: LedgerEntry['type']) => {
    switch (type) {
      case 'Sale': return 'default';
      case 'Purchase': return 'destructive';
      case 'Expense': return 'secondary';
      case 'Purchase Return': return 'outline';
      default: return 'default';
    }
  };

  return (
    <div className="p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen /> General Ledger
          </CardTitle>
          <CardDescription>A chronological record of all financial transactions.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoaded && ledgerEntries.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount (PKR)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledgerEntries.map(entry => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">
                      {format(new Date(entry.timestamp), 'PP pp')}
                    </TableCell>
                    <TableCell>{entry.description}</TableCell>
                    <TableCell>
                      <Badge variant={getBadgeVariant(entry.type)}>{entry.type}</Badge>
                    </TableCell>
                    <TableCell className={`text-right font-semibold ${entry.balanceEffect === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                       {entry.balanceEffect === 'credit' ? '+' : '-'} {entry.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
              {isLoaded ? (
                <>
                  <DollarSign className="w-16 h-16" />
                  <h3 className="text-xl font-semibold">No Transactions Recorded</h3>
                  <p>Your financial ledger is currently empty.</p>
                </>
              ) : (
                 <p>Loading financial data...</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
