'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, isSameDay } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { BookOpen, DollarSign, Calendar as CalendarIcon, X } from 'lucide-react';
import { useTransactions } from '@/hooks/use-transactions';
import { usePurchases } from '@/hooks/use-purchases';
import { useExpenses } from '@/hooks/use-expenses';
import { usePurchaseReturns } from '@/hooks/use-purchase-returns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

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
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  const isLoaded = transactionsLoaded && purchasesLoaded && expensesLoaded && purchaseReturnsLoaded;

  const ledgerEntries = useMemo(() => {
    if (!isLoaded) return [];

    let allEntries: LedgerEntry[] = [];

    transactions.forEach(tx => allEntries.push({
      id: `tx-${tx.id}`,
      timestamp: tx.timestamp,
      description: `Sale: ${tx.volume.toFixed(2)}L of ${tx.fuelType}`,
      type: 'Sale',
      amount: tx.totalAmount,
      balanceEffect: 'debit',
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
    
    if (selectedDate) {
      allEntries = allEntries.filter(entry => isSameDay(new Date(entry.timestamp), selectedDate));
    }

    return allEntries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  }, [transactions, purchases, expenses, purchaseReturns, isLoaded, selectedDate]);

  const getBadgeVariant = (type: LedgerEntry['type']) => {
    switch (type) {
      case 'Sale': return 'destructive';
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
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen /> General Ledger
              </CardTitle>
              <CardDescription>
                {selectedDate 
                  ? `Showing financial transactions for ${format(selectedDate, 'PPP')}.`
                  : 'A chronological record of all financial transactions.'
                }
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
               <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-[240px] justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {selectedDate && (
                <Button variant="ghost" size="icon" onClick={() => setSelectedDate(undefined)}>
                  <X className="h-4 w-4" />
                  <span className="sr-only">Clear filter</span>
                </Button>
              )}
            </div>
          </div>
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
                  <h3 className="text-xl font-semibold">
                    {selectedDate ? 'No Transactions Found' : 'No Transactions Recorded'}
                  </h3>
                  <p>
                    {selectedDate 
                      ? `There are no transactions for ${format(selectedDate, 'PPP')}.`
                      : 'Your financial ledger is currently empty.'
                    }
                  </p>
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
