
'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, isSameDay, startOfDay } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { BookOpen, DollarSign, Calendar as CalendarIcon, X } from 'lucide-react';
import { useTransactions } from '@/hooks/use-transactions';
import { usePurchases } from '@/hooks/use-purchases';
import { useExpenses } from '@/hooks/use-expenses';
import { usePurchaseReturns } from '@/hooks/use-purchase-returns';
import { useOtherIncomes } from '@/hooks/use-other-incomes';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

type LedgerEntry = {
  id: string;
  timestamp: string;
  description: string;
  type: 'Sale' | 'Purchase' | 'Expense' | 'Purchase Return' | 'Other Income';
  debit: number;
  credit: number;
  balance: number;
};

export default function LedgerPage() {
  const { transactions, isLoaded: transactionsLoaded } = useTransactions();
  const { purchases, isLoaded: purchasesLoaded } = usePurchases();
  const { expenses, isLoaded: expensesLoaded } = useExpenses();
  const { purchaseReturns, isLoaded: purchaseReturnsLoaded } = usePurchaseReturns();
  const { otherIncomes, isLoaded: otherIncomesLoaded } = useOtherIncomes();
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  const isLoaded = transactionsLoaded && purchasesLoaded && expensesLoaded && purchaseReturnsLoaded && otherIncomesLoaded;

  const { entries, finalBalance, openingBalance, totals } = useMemo(() => {
    if (!isLoaded) return { entries: [], finalBalance: 0, openingBalance: 0, totals: { debit: 0, credit: 0 } };

    let combined: Omit<LedgerEntry, 'balance'>[] = [];

    transactions.forEach(tx => combined.push({
      id: `tx-${tx.id}`,
      timestamp: tx.timestamp,
      description: `Sale: ${tx.volume.toFixed(2)}L of ${tx.fuelType} to ${tx.customerName || 'Walk-in'}`,
      type: 'Sale',
      debit: 0,
      credit: tx.totalAmount,
    }));

    purchases.forEach(p => combined.push({
      id: `pur-${p.id}`,
      timestamp: p.timestamp,
      description: `Purchase from ${p.supplier}: ${p.volume.toFixed(2)}L of ${p.fuelType}`,
      type: 'Purchase',
      debit: p.totalCost,
      credit: 0,
    }));

    expenses.forEach(e => combined.push({
        id: `exp-${e.id}`,
        timestamp: e.timestamp,
        description: `Expense: ${e.description}`,
        type: 'Expense',
        debit: e.amount,
        credit: 0,
    }));
      
    purchaseReturns.forEach(pr => combined.push({
        id: `pr-${pr.id}`,
        timestamp: pr.timestamp,
        description: `Return to ${pr.supplier}: ${pr.volume.toFixed(2)}L of ${pr.fuelType}`,
        type: 'Purchase Return',
        debit: 0,
        credit: pr.totalRefund,
    }));

    otherIncomes.forEach(oi => combined.push({
        id: `oi-${oi.id}`,
        timestamp: oi.timestamp,
        description: `Income: ${oi.description}`,
        type: 'Other Income',
        debit: 0,
        credit: oi.amount,
    }));
    
    combined.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    let calculatedOpeningBalance = 0;
    let entriesForDisplay = combined;

    if (selectedDate) {
      calculatedOpeningBalance = combined
        .filter(entry => new Date(entry.timestamp) < startOfDay(selectedDate))
        .reduce((acc, entry) => acc + entry.credit - entry.debit, 0);
      
      entriesForDisplay = combined.filter(entry => isSameDay(new Date(entry.timestamp), selectedDate));
    }
    
    let runningBalance = calculatedOpeningBalance;
    const entriesWithBalance: LedgerEntry[] = entriesForDisplay.map(entry => {
      runningBalance += entry.credit - entry.debit;
      return { ...entry, balance: runningBalance };
    });
    
    const calculatedTotals = entriesForDisplay.reduce(
        (acc, entry) => {
            acc.debit += entry.debit;
            acc.credit += entry.credit;
            return acc;
        },
        { debit: 0, credit: 0 }
    );

    return { 
        entries: entriesWithBalance.reverse(), 
        finalBalance: runningBalance, 
        openingBalance: calculatedOpeningBalance,
        totals: calculatedTotals,
    };

  }, [transactions, purchases, expenses, purchaseReturns, otherIncomes, isLoaded, selectedDate]);

  const getBadgeVariant = (type: LedgerEntry['type']) => {
    switch (type) {
      case 'Purchase':
      case 'Expense': 
        return 'destructive';
      case 'Sale':
      case 'Purchase Return': 
      case 'Other Income':
        return 'outline';
      default: 
        return 'default';
    }
  };
  
  const isCreditEntry = (type: LedgerEntry['type']) => {
    return type === 'Sale' || type === 'Purchase Return' || type === 'Other Income';
  }

  return (
    <div className="p-4 md:p-8">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen /> General Journal
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
                    {selectedDate ? format(selectedDate, "PPP") : <span>Filter by date...</span>}
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
          {isLoaded && entries.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Particulars</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Debit (PKR)</TableHead>
                  <TableHead className="text-right">Credit (PKR)</TableHead>
                  <TableHead className="text-right">Balance (PKR)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedDate && (
                  <TableRow className="bg-muted/30">
                    <TableCell colSpan={5} className="font-bold">Opening Balance</TableCell>
                    <TableCell className={`text-right font-semibold font-mono ${openingBalance >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                      {openingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                )}
                {entries.map(entry => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium whitespace-nowrap">
                      {format(new Date(entry.timestamp), 'dd/MM/yy hh:mm a')}
                    </TableCell>
                    <TableCell>{entry.description}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={getBadgeVariant(entry.type)}
                        className={cn('text-xs', isCreditEntry(entry.type) && 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700')}
                      >
                        {entry.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-destructive">
                        {entry.debit > 0 ? entry.debit.toFixed(2) : '-'}
                    </TableCell>
                    <TableCell className="text-right font-mono text-green-600">
                        {entry.credit > 0 ? entry.credit.toFixed(2) : '-'}
                    </TableCell>
                    <TableCell className={`text-right font-semibold font-mono ${entry.balance >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                        {entry.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
               <TableFooter>
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell colSpan={3} className="text-right">Period Totals</TableCell>
                  <TableCell className="text-right font-mono text-destructive">{totals.debit.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-mono text-green-600">{totals.credit.toFixed(2)}</TableCell>
                  <TableCell />
                </TableRow>
              </TableFooter>
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
        {isLoaded && entries.length > 0 && (
           <CardFooter className="flex justify-end bg-muted/50 p-4 rounded-b-lg">
              <div className="text-right">
                  <p className="text-sm text-muted-foreground">Final Closing Balance</p>
                  <p className={`text-2xl font-bold ${finalBalance >= 0 ? 'text-green-600' : 'text-destructive'}`}>PKR {finalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
