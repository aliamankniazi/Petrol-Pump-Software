
'use client';

import { useState, useMemo } from 'react';
import { useCustomerPayments } from '@/hooks/use-customer-payments';
import { useCustomers } from '@/hooks/use-customers';
import { useTransactions } from '@/hooks/use-transactions';
import { useCashAdvances } from '@/hooks/use-cash-advances';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { format, isSameDay, startOfDay } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { HandCoins, XCircle, Calendar as CalendarIcon, X, TrendingUp, TrendingDown, Wallet, Hourglass, Info } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useSuppliers } from '@/hooks/use-suppliers';
import { usePurchases } from '@/hooks/use-purchases';
import { useSupplierPayments } from '@/hooks/use-supplier-payments';

type CombinedEntry = {
  id: string;
  timestamp: string;
  entityId: string;
  entityName: string;
  entityType: 'Customer' | 'Supplier';
  type: 'Sale' | 'Payment' | 'Cash Advance' | 'Purchase' | 'Supplier Payment';
  description: string;
  debit: number;
  credit: number;
  balance?: number;
};

export default function CustomerPaymentsPage() {
  const { customerPayments, isLoaded: paymentsLoaded } = useCustomerPayments();
  const { customers, isLoaded: customersLoaded } = useCustomers();
  const { transactions, isLoaded: transactionsLoaded } = useTransactions();
  const { cashAdvances, isLoaded: advancesLoaded } = useCashAdvances();
  const { suppliers, isLoaded: suppliersLoaded } = useSuppliers();
  const { purchases, isLoaded: purchasesLoaded } = usePurchases();
  const { supplierPayments, isLoaded: supplierPaymentsLoaded } = useSupplierPayments();
  
  const [selectedEntityId, setSelectedEntityId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  const isLoaded = paymentsLoaded && customersLoaded && transactionsLoaded && advancesLoaded && suppliersLoaded && purchasesLoaded && supplierPaymentsLoaded;

  const entities = useMemo(() => {
    if (!isLoaded) return [];
    const allEntities = [
      ...customers.map(c => ({ id: c.id, name: c.name, type: 'Customer' })),
      ...suppliers.map(s => ({ id: s.id, name: s.name, type: 'Supplier' }))
    ];
    // Remove duplicates by name, preferring customers in case of a name clash
    const uniqueNames = new Set();
    return allEntities.filter(e => {
        if (uniqueNames.has(e.name)) return false;
        uniqueNames.add(e.name);
        return true;
    });
  }, [customers, suppliers, isLoaded]);

  const { entries, totals, finalBalance, specialReport } = useMemo(() => {
    if (!isLoaded) return { entries: [], totals: { debit: 0, credit: 0 }, finalBalance: 0, specialReport: null };

    const combined: Omit<CombinedEntry, 'balance'>[] = [];

    // Customer transactions
    transactions.forEach(tx => {
      if (tx.customerId) {
        combined.push({
          id: `tx-${tx.id}`,
          timestamp: tx.timestamp,
          entityId: tx.customerId,
          entityName: tx.customerName || 'N/A',
          entityType: 'Customer',
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
        entityId: p.customerId,
        entityName: p.customerName,
        entityType: 'Customer',
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
        entityId: ca.customerId,
        entityName: ca.customerName,
        entityType: 'Customer',
        type: 'Cash Advance',
        description: ca.notes || 'Cash Advance',
        debit: ca.amount,
        credit: 0,
      });
    });
    
    // Supplier transactions
    purchases.forEach(p => {
        combined.push({
            id: `pur-${p.id}`,
            timestamp: p.timestamp,
            entityId: p.supplierId,
            entityName: p.supplier,
            entityType: 'Supplier',
            type: 'Purchase',
            description: `${p.volume.toFixed(2)}L of ${p.fuelType}`,
            debit: 0, // Debit from company perspective, but credit to supplier account
            credit: p.totalCost,
        });
    });

    supplierPayments.forEach(sp => {
        combined.push({
            id: `sp-${sp.id}`,
            timestamp: sp.timestamp,
            entityId: sp.supplierId,
            entityName: sp.supplierName,
            entityType: 'Supplier',
            type: 'Supplier Payment',
            description: `Payment Made (${sp.paymentMethod})`,
            debit: sp.amount,
            credit: 0,
        });
    });


    combined.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const entityFilteredEntries = selectedEntityId 
      ? combined.filter(entry => entry.entityId === selectedEntityId)
      : combined;
      
    // Calculations for the special report are based on the full history of the selected entity
    let reportData = null;
    if (selectedEntityId && entityFilteredEntries.length > 0) {
        const lastDebitEntry = [...entityFilteredEntries].reverse().find(e => e.debit > 0);
        const lastCreditEntry = [...entityFilteredEntries].reverse().find(e => e.credit > 0);
        const entityTotalBalance = entityFilteredEntries.reduce((acc, entry) => acc + (entry.debit - entry.credit), 0);
        const lastTransactionBalance = entityFilteredEntries.length > 0
            ? entityFilteredEntries.slice(0, entityFilteredEntries.length).reduce((acc, entry) => acc + (entry.debit - entry.credit), 0)
            : 0;

        reportData = {
            totalBalance: entityTotalBalance,
            lastDebit: lastDebitEntry ? lastDebitEntry.debit : 0,
            lastCredit: lastCreditEntry ? lastCreditEntry.credit : 0,
            lastRemaining: lastTransactionBalance,
        };
    }

    let openingBalance = 0;
    let entriesForDisplay = entityFilteredEntries;
    
    if (selectedDate) {
      openingBalance = entityFilteredEntries
        .filter(entry => new Date(entry.timestamp) < startOfDay(selectedDate))
        .reduce((acc, entry) => acc + (entry.debit - entry.credit), 0);

      entriesForDisplay = entityFilteredEntries.filter(entry => isSameDay(new Date(entry.timestamp), selectedDate));
    }

    let runningBalance = openingBalance;
    const entriesWithBalance: CombinedEntry[] = entriesForDisplay.map(entry => {
        runningBalance += (entry.debit - entry.credit);
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
        totals: calculatedTotals,
        finalBalance: runningBalance,
        specialReport: reportData,
    };
  }, [customerPayments, transactions, cashAdvances, purchases, supplierPayments, selectedEntityId, selectedDate, isLoaded]);
  
  const getBadgeVariant = (type: CombinedEntry['type']) => {
    switch (type) {
      case 'Sale':
      case 'Cash Advance':
      case 'Supplier Payment':
        return 'destructive';
      case 'Payment':
      case 'Purchase':
        return 'outline';
      default:
        return 'default';
    }
  };

  const clearFilters = () => {
    setSelectedEntityId('');
    setSelectedDate(undefined);
  };

  const hasActiveFilters = selectedEntityId || selectedDate;
  const selectedEntity = entities.find(e => e.id === selectedEntityId);

  return (
    <div className="p-4 md:p-8 space-y-6">
       <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HandCoins /> Partner Ledger
          </CardTitle>
          <CardDescription>A unified record of all transactions for customers and suppliers. Use the filters below to refine your search.</CardDescription>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-4">
              <Select value={selectedEntityId} onValueChange={(value) => setSelectedEntityId(value === 'all' ? '' : value)}>
                <SelectTrigger className="sm:w-[240px]">
                  <SelectValue placeholder="Filter by partner..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Partners</SelectItem>
                  {entities.map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.name} ({e.type})</SelectItem>
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
      </Card>

      {selectedEntityId && specialReport && selectedEntity && (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Info className="w-5 h-5" />
                    Special {selectedEntity.type} Report for {selectedEntity.name}
                </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground"><Wallet /> Total Balance</div>
                    <div className={`text-2xl font-bold ${specialReport.totalBalance > 0 ? 'text-destructive' : 'text-green-600'}`}>PKR {specialReport.totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground"><TrendingDown /> Last Debit</div>
                    <div className="text-2xl font-bold text-destructive">PKR {specialReport.lastDebit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground"><TrendingUp /> Last Credit</div>
                    <div className="text-2xl font-bold text-green-600">PKR {specialReport.lastCredit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground"><Hourglass /> Last Transaction Balance</div>
                    <div className={`text-2xl font-bold ${specialReport.lastRemaining > 0 ? 'text-destructive' : 'text-green-600'}`}>PKR {specialReport.lastRemaining.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
            </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            {selectedDate 
              ? `Showing transactions for ${format(selectedDate, 'PPP')}` 
              : 'A detailed log of all transactions for the selected filter.'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoaded && entries.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Partner</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-center">Type</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map(entry => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">
                      {format(new Date(entry.timestamp), 'PP pp')}
                    </TableCell>
                    <TableCell>
                      <div>{entry.entityName}</div>
                      <div className="text-xs text-muted-foreground">{entry.entityType}</div>
                    </TableCell>
                    <TableCell>{entry.description}</TableCell>
                    <TableCell className="text-center">
                       <Badge 
                         variant={getBadgeVariant(entry.type)}
                         className={cn((entry.type === 'Payment' || entry.type === 'Purchase') && 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700')}
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
                    <TableCell className={`text-right font-semibold font-mono ${entry.balance && entry.balance > 0 ? 'text-destructive' : 'text-green-600'}`}>
                        {entry.balance?.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
               <TableFooter>
                <TableRow>
                  <TableCell colSpan={4} className="font-bold text-right">Totals for Period</TableCell>
                  <TableCell className="text-right font-bold font-mono text-destructive">PKR {totals.debit.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-bold font-mono text-green-600">PKR {totals.credit.toFixed(2)}</TableCell>
                  <TableCell />
                </TableRow>
                <TableRow>
                  <TableCell colSpan={5} className="font-bold text-right">Closing Balance for Period</TableCell>
                  <TableCell colSpan={2} className={`text-right font-bold text-lg font-mono ${finalBalance > 0 ? 'text-destructive' : 'text-green-600'}`}>
                    PKR {finalBalance.toFixed(2)}
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
                          {hasActiveFilters ? 'No Matching Transactions' : 'No Partner Transactions Yet'}
                        </h3>
                        <p>
                          {hasActiveFilters ? 'Try adjusting or clearing your filters.' : 'Sales, purchases, and payments will appear here.'}
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
