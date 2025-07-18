
'use client';

import { useState, useMemo } from 'react';
import { useCustomerPayments } from '@/hooks/use-customer-payments';
import { useCustomers } from '@/hooks/use-customers';
import { useTransactions } from '@/hooks/use-transactions';
import { useCashAdvances } from '@/hooks/use-cash-advances';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { format, isSameDay } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { HandCoins, XCircle, Calendar as CalendarIcon, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

type CombinedEntry = {
  id: string;
  timestamp: string;
  customerId: string;
  customerName: string;
  type: 'Sale' | 'Payment' | 'Cash Advance';
  description: string;
  debit: number;
  credit: number;
};

export default function CustomerPaymentsPage() {
  const { customerPayments, isLoaded: paymentsLoaded } = useCustomerPayments();
  const { customers, isLoaded: customersLoaded } = useCustomers();
  const { transactions, isLoaded: transactionsLoaded } = useTransactions();
  const { cashAdvances, isLoaded: advancesLoaded } = useCashAdvances();
  
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  const isLoaded = paymentsLoaded && customersLoaded && transactionsLoaded && advancesLoaded;

  const { filteredEntries, totals } = useMemo(() => {
    if (!isLoaded) return { filteredEntries: [], totals: { debit: 0, credit: 0, balance: 0 } };

    const combined: CombinedEntry[] = [];

    transactions.forEach(tx => {
      if (tx.customerId) {
        combined.push({
          id: `tx-${tx.id}`,
          timestamp: tx.timestamp,
          customerId: tx.customerId,
          customerName: tx.customerName || 'N/A',
          type: 'Sale',
          description: `${tx.volume.toFixed(2)}L of ${tx.fuelType}`,
          debit: tx.totalAmount,
          credit: 0,
        });
      }
    });

    customerPayments.forEach(p => {
      combined.push({
        id: `pay-${p.id}`,
        timestamp: p.timestamp,
        customerId: p.customerId,
        customerName: p.customerName,
        type: 'Payment',
        description: `Payment Received (${p.paymentMethod})`,
        debit: 0,
        credit: p.amount,
      });
    });

    cashAdvances.forEach(ca => {
      combined.push({
        id: `adv-${ca.id}`,
        timestamp: ca.timestamp,
        customerId: ca.customerId,
        customerName: ca.customerName,
        type: 'Cash Advance',
        description: ca.notes || 'Cash Advance',
        debit: ca.amount,
        credit: 0,
      });
    });

    const sorted = combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    const filtered = sorted.filter(entry => {
      const customerMatch = !selectedCustomerId || entry.customerId === selectedCustomerId;
      const dateMatch = !selectedDate || isSameDay(new Date(entry.timestamp), selectedDate);
      return customerMatch && dateMatch;
    });

    const calculatedTotals = filtered.reduce(
        (acc, entry) => {
            acc.debit += entry.debit;
            acc.credit += entry.credit;
            return acc;
        },
        { debit: 0, credit: 0 }
    );
    
    return { 
        filteredEntries: filtered, 
        totals: {
            ...calculatedTotals,
            balance: calculatedTotals.debit - calculatedTotals.credit,
        }
    };
  }, [customerPayments, transactions, cashAdvances, selectedCustomerId, selectedDate, isLoaded]);
  
  const getBadgeVariant = (type: CombinedEntry['type']) => {
    switch (type) {
      case 'Sale':
      case 'Cash Advance':
        return 'destructive';
      case 'Payment':
        return 'outline';
      default:
        return 'default';
    }
  };

  const clearFilters = () => {
    setSelectedCustomerId('');
    setSelectedDate(undefined);
  };

  const hasActiveFilters = selectedCustomerId || selectedDate;

  return (
    <div className="p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HandCoins /> Customer Transactions
          </CardTitle>
          <CardDescription>A record of all payments, sales, and advances for customers. Use the filters below to refine your search.</CardDescription>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-4">
              <Select value={selectedCustomerId} onValueChange={(value) => setSelectedCustomerId(value === 'all' ? '' : value)}>
                <SelectTrigger className="sm:w-[240px]">
                  <SelectValue placeholder="Filter by customer..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  {customers.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full sm:w-[240px] justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : <span>Filter by date...</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {hasActiveFilters && (
                <Button variant="ghost" onClick={clearFilters}>
                  <X className="mr-2 h-4 w-4" />
                  Clear Filters
                </Button>
              )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoaded && filteredEntries.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-center">Type</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map(entry => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">
                      {format(new Date(entry.timestamp), 'PP pp')}
                    </TableCell>
                    <TableCell>{entry.customerName}</TableCell>
                    <TableCell>{entry.description}</TableCell>
                    <TableCell className="text-center">
                       <Badge 
                         variant={getBadgeVariant(entry.type)}
                         className={cn(entry.type === 'Payment' && 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700')}
                       >
                         {entry.type}
                       </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-destructive">
                        {entry.debit > 0 ? `PKR ${entry.debit.toFixed(2)}` : '-'}
                    </TableCell>
                    <TableCell className="text-right font-mono text-green-600">
                        {entry.credit > 0 ? `PKR ${entry.credit.toFixed(2)}` : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
               <TableFooter>
                <TableRow>
                  <TableCell colSpan={4} className="font-bold text-right">Totals</TableCell>
                  <TableCell className="text-right font-bold font-mono text-destructive">PKR {totals.debit.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-bold font-mono text-green-600">PKR {totals.credit.toFixed(2)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={4} className="font-bold text-right">Net Balance (Debit - Credit)</TableCell>
                  <TableCell colSpan={2} className={`text-right font-bold text-lg font-mono ${totals.balance > 0 ? 'text-destructive' : 'text-green-600'}`}>
                    PKR {totals.balance.toFixed(2)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                {isLoaded ? (
                    <>
                        <XCircle className="w-16 h-16" />
                        <h3 className="text-xl font-semibold">
                          {hasActiveFilters ? 'No Matching Transactions' : 'No Customer Transactions Yet'}
                        </h3>
                        <p>
                          {hasActiveFilters ? 'Try adjusting or clearing your filters.' : 'Sales and payments for customers will appear here.'}
                        </p>
                    </>
                ) : (
                    <p>Loading transaction data...</p>
                )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
