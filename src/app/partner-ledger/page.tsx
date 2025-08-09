
'use client';

import { useState, useMemo, useCallback } from 'react';
import { useCustomerPayments } from '@/hooks/use-customer-payments';
import { useCustomers } from '@/hooks/use-customers';
import { useTransactions } from '@/hooks/use-transactions';
import { useCashAdvances } from '@/hooks/use-cash-advances';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { format, isSameDay, startOfDay } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { HandCoins, XCircle, Calendar as CalendarIcon, X, TrendingUp, TrendingDown, Wallet, BookText, AlertTriangle, Trash2, Printer, LayoutDashboard } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useSuppliers } from '@/hooks/use-suppliers';
import { usePurchases } from '@/hooks/use-purchases';
import { useSupplierPayments } from '@/hooks/use-supplier-payments';
import Link from 'next/link';
import { useInvestments } from '@/hooks/use-investments';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useExpenses } from '@/hooks/use-expenses';


type EntityType = 'Customer' | 'Supplier' | 'Partner' | 'Employee';

type CombinedEntry = {
  id: string;
  timestamp: string;
  entityId: string;
  entityName: string;
  entityType: EntityType;
  type: 'Sale' | 'Payment' | 'Cash Advance' | 'Purchase' | 'Supplier Payment' | 'Investment' | 'Withdrawal' | 'Salary';
  description: string;
  debit: number;
  credit: number;
  balance?: number;
};

export default function UnifiedLedgerPage() {
  const { customerPayments, deleteCustomerPayment, isLoaded: paymentsLoaded } = useCustomerPayments();
  const { customers, isLoaded: customersLoaded } = useCustomers();
  const { transactions, deleteTransaction, isLoaded: transactionsLoaded } = useTransactions();
  const { cashAdvances, deleteCashAdvance, isLoaded: advancesLoaded } = useCashAdvances();
  const { suppliers, isLoaded: suppliersLoaded } = useSuppliers();
  const { purchases, deletePurchase, isLoaded: purchasesLoaded } = usePurchases();
  const { supplierPayments, deleteSupplierPayment, isLoaded: supplierPaymentsLoaded } = useSupplierPayments();
  const { investments, deleteInvestment, isLoaded: investmentsLoaded } = useInvestments();
  const { expenses, deleteExpense, isLoaded: expensesLoaded } = useExpenses();
  
  const [selectedEntityId, setSelectedEntityId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [entryToDelete, setEntryToDelete] = useState<CombinedEntry | null>(null);
  const { toast } = useToast();

  const isLoaded = paymentsLoaded && customersLoaded && transactionsLoaded && advancesLoaded && suppliersLoaded && purchasesLoaded && supplierPaymentsLoaded && investmentsLoaded && expensesLoaded;

  const entities = useMemo(() => {
    if (!isLoaded) return [];

    const entityMap = new Map<string, { id: string; name: string; type: EntityType }>();

    customers.forEach(c => {
      let type: EntityType = 'Customer';
      if (c.isPartner) type = 'Partner';
      else if (c.isEmployee) type = 'Employee';
      entityMap.set(c.id!, { id: c.id!, name: c.name, type: type });
    });

    suppliers.forEach(s => {
      entityMap.set(s.id!, { id: s.id!, name: s.name, type: 'Supplier' });
    });

    const allEntities = Array.from(entityMap.values());
    
    return allEntities.sort((a,b) => a.name.localeCompare(b.name));
  }, [customers, suppliers, isLoaded]);

  const { entries, totals, finalBalance, specialReport } = useMemo(() => {
    if (!isLoaded) return { entries: [], totals: { debit: 0, credit: 0 }, finalBalance: 0, specialReport: null };

    const combined: Omit<CombinedEntry, 'balance'>[] = [];

    // Customer and Partner related transactions
    transactions.forEach(tx => {
      if (tx.customerId && tx.timestamp) {
        const entity = entities.find(e => e.id === tx.customerId);
        if (!entity) return;
        combined.push({
          id: `tx-${tx.id}`,
          timestamp: tx.timestamp!,
          entityId: tx.customerId,
          entityName: tx.customerName || 'N/A',
          entityType: entity.type,
          type: 'Sale',
          description: `${tx.items?.map(item => `${item.quantity.toFixed(2)}L of ${item.productName}`).join(', ') || 'Sale'} ${tx.notes ? `- ${tx.notes}` : ''}`,
          debit: tx.totalAmount,
          credit: 0,
        });
      }
    });

    customerPayments.forEach(p => {
       if(p.timestamp) {
         const entity = entities.find(e => e.id === p.customerId);
         if (!entity) return;
         combined.push({
          id: `pay-${p.id}`,
          timestamp: p.timestamp!,
          entityId: p.customerId,
          entityName: p.customerName,
          entityType: entity.type,
          type: 'Payment',
          description: `Payment Received (${p.paymentMethod})`,
          debit: 0,
          credit: p.amount,
        });
       }
    });

    cashAdvances.forEach(ca => {
      if (ca.timestamp) {
        const entity = entities.find(e => e.id === ca.customerId);
        if (!entity) return;
        combined.push({
          id: `adv-${ca.id}`,
          timestamp: ca.timestamp!,
          entityId: ca.customerId,
          entityName: ca.customerName,
          entityType: entity.type,
          type: 'Cash Advance',
          description: ca.notes || 'Cash Advance',
          debit: ca.amount,
          credit: 0,
        });
      }
    });
    
    // Supplier transactions
    purchases.forEach(p => {
      if(p.timestamp) {
        const entity = entities.find(e => e.id === p.supplierId);
        if (!entity) return;
        combined.push({
            id: `pur-${p.id}`,
            timestamp: p.timestamp!,
            entityId: p.supplierId,
            entityName: p.supplier,
            entityType: 'Supplier',
            type: 'Purchase',
            description: `${p.items.map(item => `${item.quantity.toFixed(2)}L of ${item.productName}`).join(', ')} ${p.notes ? `- ${p.notes}` : ''}`,
            debit: 0,
            credit: p.totalCost,
        });
      }
    });

    supplierPayments.forEach(sp => {
      if(sp.timestamp){
        const entity = entities.find(e => e.id === sp.supplierId);
        if (!entity) return;
        combined.push({
            id: `spay-${sp.id}`,
            timestamp: sp.timestamp!,
            entityId: sp.supplierId,
            entityName: sp.supplierName,
            entityType: 'Supplier',
            type: 'Supplier Payment',
            description: `Payment Made (${sp.paymentMethod})`,
            debit: sp.amount,
            credit: 0,
        });
      }
    });
    
    // Partner-specific transactions
    investments.forEach(inv => {
      if (inv.timestamp) {
        const entity = entities.find(e => e.id === inv.partnerId);
        if (!entity) return;
        combined.push({
            id: `inv-${inv.id}`,
            timestamp: inv.timestamp!,
            entityId: inv.partnerId,
            entityName: inv.partnerName,
            entityType: 'Partner',
            type: inv.type,
            description: inv.notes || inv.type,
            debit: inv.type === 'Withdrawal' ? inv.amount : 0,
            credit: inv.type === 'Investment' ? inv.amount : 0,
        });
      }
    });

    // Employee Salaries
    expenses.forEach(exp => {
        if(exp.category === 'Salaries' && exp.employeeId && exp.timestamp) {
            const entity = entities.find(e => e.id === exp.employeeId);
            if (!entity) return;
            combined.push({
                id: `exp-${exp.id}`,
                timestamp: exp.timestamp!,
                entityId: exp.employeeId,
                entityName: entity.name,
                entityType: 'Employee',
                type: 'Salary',
                description: exp.description,
                debit: 0, // Salary is a credit to the employee's ledger
                credit: exp.amount,
            });
        }
    });


    combined.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const entityFilteredEntries = selectedEntityId 
      ? combined.filter(entry => entry.entityId === selectedEntityId)
      : combined;
      
    let reportData = null;
    if (selectedEntityId && entityFilteredEntries.length > 0) {
        const lastDebitEntry = [...entityFilteredEntries].reverse().find(e => e.debit > 0);
        const lastCreditEntry = [...entityFilteredEntries].reverse().find(e => e.credit > 0);
        
        const entityType = entities.find(e => e.id === selectedEntityId)?.type;
        
        let entityTotalBalance;
        if (entityType === 'Partner' || entityType === 'Supplier') {
          entityTotalBalance = entityFilteredEntries.reduce((acc, entry) => acc + (entry.credit - entry.debit), 0);
        } else {
          entityTotalBalance = entityFilteredEntries.reduce((acc, entry) => acc + (entry.debit - entry.credit), 0);
        }

        reportData = {
            totalBalance: entityTotalBalance,
            lastDebit: lastDebitEntry ? lastDebitEntry.debit : 0,
            lastCredit: lastCreditEntry ? lastCreditEntry.credit : 0,
            entityType: entityType || 'Customer',
        };
    }

    let openingBalance = 0;
    let entriesForDisplay = entityFilteredEntries;
    
    if (selectedDate) {
      openingBalance = entityFilteredEntries
        .filter(entry => new Date(entry.timestamp) < startOfDay(selectedDate))
        .reduce((acc, entry) => {
            const entityType = entities.find(e => e.id === entry.entityId)?.type;
            if (entityType === 'Partner' || entityType === 'Supplier') {
                return acc + (entry.credit - entry.debit);
            }
            return acc + (entry.debit - entry.credit);
        }, 0);

      entriesForDisplay = entityFilteredEntries.filter(entry => isSameDay(new Date(entry.timestamp), selectedDate!));
    }

    let runningBalance = openingBalance;
    const entriesWithBalance: CombinedEntry[] = entriesForDisplay.map(entry => {
        const entityType = entry.entityType;
        if(entityType === 'Partner' || entityType === 'Supplier'){
            runningBalance += entry.credit - entry.debit;
        }
        else {
             runningBalance += entry.debit - entry.credit;
        }

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
  }, [customerPayments, transactions, cashAdvances, purchases, supplierPayments, investments, expenses, selectedEntityId, selectedDate, isLoaded, entities]);
  
  const getBadgeVariant = (type: CombinedEntry['type']) => {
    switch (type) {
      case 'Sale':
      case 'Cash Advance':
      case 'Supplier Payment':
      case 'Withdrawal':
        return 'destructive';
      case 'Payment':
      case 'Purchase':
      case 'Investment':
      case 'Salary':
        return 'outline';
      default:
        return 'default';
    }
  };

  const isCreditType = (type: CombinedEntry['type']) => {
    return ['Payment', 'Purchase', 'Investment', 'Salary'].includes(type);
  }

  const clearFilters = useCallback(() => {
    setSelectedEntityId('');
    setSelectedDate(undefined);
  }, []);
  
  const handleDeleteEntry = () => {
    if (!entryToDelete) return;
    
    const [typePrefix, id] = entryToDelete.id.split(/-(.*)/s);

    try {
      switch(typePrefix) {
          case 'tx': deleteTransaction(id); break;
          case 'pur': deletePurchase(id); break;
          case 'pay': deleteCustomerPayment(id); break;
          case 'adv': deleteCashAdvance(id); break;
          case 'spay': deleteSupplierPayment(id); break;
          case 'exp': deleteExpense(id); break;
          case 'inv':
          case 'wdr': deleteInvestment(id); break;
          default:
              throw new Error('Could not delete entry of unknown type.');
      }
      toast({
          title: 'Entry Deleted',
          description: `The ${entryToDelete.type} entry has been successfully deleted.`,
      });
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: error.message || "An error occurred while deleting the entry.",
        });
    } finally {
        setEntryToDelete(null);
    }
  };

  const hasActiveFilters = selectedEntityId || selectedDate;
  const selectedEntity = entities.find(e => e.id === selectedEntityId);

  const getBalanceColor = useCallback((balance: number, type: EntityType) => {
    // For suppliers & partners, a positive balance means we owe them. (Good for them, so green)
    if (type === 'Partner' || type === 'Supplier') {
        return balance >= 0 ? 'text-green-600' : 'text-destructive';
    }
    // For customers & employees, a positive balance means they owe us. (Bad for them, so red)
    return balance > 0 ? 'text-destructive' : 'text-green-600';
  }, []);

  return (
    <>
    <div className="p-4 md:p-8 space-y-6">
       <Card>
        <CardHeader>
            <div className='flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4'>
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <HandCoins /> Unified Ledger
                    </CardTitle>
                    <CardDescription>A unified record of all transactions. Use the filters below to refine your search.</CardDescription>
                </div>
                 <div className='print:hidden flex gap-2'>
                    <Button asChild variant="outline">
                        <Link href="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" /> Go to Dashboard</Link>
                    </Button>
                    <Button variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4"/>Print</Button>
                </div>
            </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-4 print:hidden">
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
                    {selectedEntity.type} Report for {selectedEntity.name}
                </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground"><Wallet /> Total Balance</div>
                    <div className={cn("text-2xl font-bold", getBalanceColor(specialReport.totalBalance, specialReport.entityType))}>
                        PKR {specialReport.totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground"><TrendingDown /> Last Debit</div>
                    <div className="text-2xl font-bold text-destructive">PKR {specialReport.lastDebit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground"><TrendingUp /> Last Credit</div>
                    <div className="text-2xl font-bold text-green-600">PKR {specialReport.lastCredit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
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
                  <TableHead className="text-center print:hidden">Actions</TableHead>
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
                         className={cn(isCreditType(entry.type) && 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700')}
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
                    <TableCell className={cn("text-right font-semibold font-mono", getBalanceColor(entry.balance || 0, entry.entityType))}>
                        {entry.balance?.toFixed(2)}
                    </TableCell>
                     <TableCell className="text-center space-x-0 print:hidden">
                        <Button asChild variant="ghost" size="icon" title="View Partner Ledger">
                           <Link href={`/customers/${entry.entityId}/ledger`}>
                             <BookText className="w-5 h-5" />
                           </Link>
                        </Button>
                        <Button variant="ghost" size="icon" title="Delete" className="text-destructive hover:text-destructive" onClick={() => setEntryToDelete(entry)}>
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
               <TableFooter>
                <TableRow>
                  <TableCell colSpan={4} className="font-bold text-right">Totals for Period</TableCell>
                  <TableCell className="text-right font-bold font-mono text-destructive">PKR {totals.debit.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-bold font-mono text-green-600">PKR {totals.credit.toFixed(2)}</TableCell>
                  <TableCell colSpan={2} />
                </TableRow>
                <TableRow>
                  <TableCell colSpan={5} className="font-bold text-right">Closing Balance for Period</TableCell>
                  <TableCell colSpan={3} className={`text-right font-bold text-lg font-mono ${finalBalance >= 0 ? 'text-green-600' : 'text-destructive'}`}>
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
    
    <AlertDialog open={!!entryToDelete} onOpenChange={(isOpen) => !isOpen && setEntryToDelete(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle/>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the entry: <br />
            <strong className="font-medium text-foreground">{entryToDelete?.description}</strong>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDeleteEntry} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Yes, delete entry
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}

