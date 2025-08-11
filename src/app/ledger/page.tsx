
'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { format, isSameDay, startOfDay } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { BookOpen, DollarSign, Calendar as CalendarIcon, X, Trash2, AlertTriangle, Printer, LayoutDashboard, Search } from 'lucide-react';
import { useTransactions } from '@/hooks/use-transactions';
import { usePurchases } from '@/hooks/use-purchases';
import { useExpenses } from '@/hooks/use-expenses';
import { usePurchaseReturns } from '@/hooks/use-purchase-returns';
import { useOtherIncomes } from '@/hooks/use-other-incomes';
import { useSupplierPayments } from '@/hooks/use-supplier-payments';
import { useInvestments } from '@/hooks/use-investments';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useCustomerPayments } from '@/hooks/use-customer-payments';
import { useCashAdvances } from '@/hooks/use-cash-advances';
import { Input } from '@/components/ui/input';

type LedgerEntry = {
  id: string;
  timestamp: string;
  description: string;
  type: 'Sale' | 'Purchase' | 'Expense' | 'Purchase Return' | 'Other Income' | 'Supplier Payment' | 'Investment' | 'Withdrawal' | 'Customer Payment' | 'Cash Advance';
  debit: number;
  credit: number;
  balance: number;
};

export default function LedgerPage() {
  const { transactions, deleteTransaction, isLoaded: transactionsLoaded } = useTransactions();
  const { purchases, deletePurchase, isLoaded: purchasesLoaded } = usePurchases();
  const { expenses, deleteExpense, isLoaded: expensesLoaded } = useExpenses();
  const { purchaseReturns, deletePurchaseReturn, isLoaded: purchaseReturnsLoaded } = usePurchaseReturns();
  const { otherIncomes, deleteOtherIncome, isLoaded: otherIncomesLoaded } = useOtherIncomes();
  const { customerPayments, deleteCustomerPayment, isLoaded: customerPaymentsLoaded } = useCustomerPayments();
  const { supplierPayments, deleteSupplierPayment, isLoaded: supplierPaymentsLoaded } = useSupplierPayments();
  const { investments, deleteInvestment, isLoaded: investmentsLoaded } = useInvestments();
  const { cashAdvances, deleteCashAdvance, isLoaded: cashAdvancesLoaded } = useCashAdvances();
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<LedgerEntry | null>(null);
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  const isLoaded = transactionsLoaded && purchasesLoaded && expensesLoaded && purchaseReturnsLoaded && otherIncomesLoaded && customerPaymentsLoaded && supplierPaymentsLoaded && investmentsLoaded && cashAdvancesLoaded;

  const { entries, finalBalance, openingBalance, totals } = useMemo(() => {
    if (!isLoaded) return { entries: [], finalBalance: 0, openingBalance: 0, totals: { debit: 0, credit: 0 } };

    let combined: Omit<LedgerEntry, 'balance'>[] = [];
    
    // Process transactions based on user's requested logic
    transactions.forEach(tx => {
        if (tx.paymentMethod === 'On Credit') {
            // "On Credit" sales are DEBIT
            combined.push({
                id: `tx-${tx.id}`,
                timestamp: tx.timestamp!,
                description: `Sale to ${tx.customerName || 'Walk-in'}: ${tx.items.length} item(s) ${tx.notes ? `- ${tx.notes}` : ''}`,
                type: 'Sale',
                debit: tx.totalAmount,
                credit: 0,
            });
        } else {
            // "Cash", "Card", "Mobile" sales are CREDIT
            combined.push({
                id: `tx-${tx.id}`,
                timestamp: tx.timestamp!,
                description: `Sale to ${tx.customerName || 'Walk-in'}: ${tx.items.length} item(s) ${tx.notes ? `- ${tx.notes}` : ''}`,
                type: 'Sale',
                debit: 0,
                credit: tx.totalAmount,
            });
        }
    });

    expenses.forEach(e => combined.push({
      id: `exp-${e.id}`,
      timestamp: e.timestamp!,
      description: `Expense: ${e.description}`,
      type: 'Expense',
      debit: e.amount,
      credit: 0,
    }));

    supplierPayments.forEach(sp => combined.push({
      id: `sp-${sp.id}`,
      timestamp: sp.timestamp!,
      description: `Payment to ${sp.supplierName}`,
      type: 'Supplier Payment',
      debit: sp.amount,
      credit: 0,
    }));
    
    investments.filter(inv => inv.type === 'Withdrawal').forEach(inv => combined.push({
      id: `wdr-${inv.id}`,
      timestamp: inv.timestamp!,
      description: `Withdrawal by ${inv.partnerName}`,
      type: 'Withdrawal',
      debit: inv.amount,
      credit: 0,
    }));
    
    cashAdvances.forEach(ca => combined.push({
        id: `ca-${ca.id}`,
        timestamp: ca.timestamp!,
        description: `Cash advance to ${ca.customerName} ${ca.notes ? `- ${ca.notes}` : ''}`,
        type: 'Cash Advance',
        debit: ca.amount,
        credit: 0,
    }));
    
    // CREDITS (Money In or Liability Increase)
    purchases.forEach(p => combined.push({
        id: `pur-${p.id}`,
        timestamp: p.timestamp!,
        description: `Purchase from ${p.supplier}: ${p.items.length} item(s)`,
        type: 'Purchase',
        debit: 0,
        credit: p.totalCost,
    }));

    purchaseReturns.forEach(pr => combined.push({
      id: `pr-${pr.id}`,
      timestamp: pr.timestamp!,
      description: `Return from ${pr.supplier}: ${pr.volume.toFixed(2)}L of ${pr.productName}`,
      type: 'Purchase Return',
      debit: 0,
      credit: pr.totalRefund,
    }));

    otherIncomes.forEach(oi => combined.push({
      id: `oi-${oi.id}`,
      timestamp: oi.timestamp!,
      description: `Income: ${oi.description}`,
      type: 'Other Income',
      debit: 0,
      credit: oi.amount,
    }));
    
    customerPayments.forEach(cp => combined.push({
      id: `cp-${cp.id}`,
      timestamp: cp.timestamp!,
      description: `Payment from ${cp.customerName} ${cp.notes ? `- ${cp.notes}` : ''}`,
      type: 'Customer Payment',
      debit: 0,
      credit: cp.amount,
    }));

    investments.filter(inv => inv.type === 'Investment').forEach(inv => combined.push({
      id: `inv-${inv.id}`,
      timestamp: inv.timestamp!,
      description: `Investment from ${inv.partnerName}`,
      type: 'Investment',
      debit: 0,
      credit: inv.amount,
    }));

    // Filter out any entries with an invalid or missing timestamp
    const validCombined = combined.filter(entry => entry.timestamp && !isNaN(new Date(entry.timestamp).getTime()));

    validCombined.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    let calculatedOpeningBalance = 0;
    let entriesForDisplay = validCombined;

    if (selectedDate) {
      calculatedOpeningBalance = validCombined
        .filter(entry => new Date(entry.timestamp) < startOfDay(selectedDate))
        .reduce((acc, entry) => acc + entry.credit - entry.debit, 0);
      
      entriesForDisplay = validCombined.filter(entry => isSameDay(new Date(entry.timestamp), selectedDate));
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

    const filteredEntries = searchTerm
        ? entriesWithBalance.filter(e => e.description.toLowerCase().includes(searchTerm.toLowerCase()))
        : entriesWithBalance;

    return { 
        entries: filteredEntries.reverse(), 
        finalBalance: runningBalance, 
        openingBalance: calculatedOpeningBalance,
        totals: calculatedTotals,
    };

  }, [transactions, purchases, expenses, purchaseReturns, otherIncomes, customerPayments, supplierPayments, investments, cashAdvances, isLoaded, selectedDate, searchTerm]);

  const getBadgeVariant = (type: LedgerEntry['type']) => {
    switch (type) {
      case 'Expense': 
      case 'Supplier Payment':
      case 'Withdrawal':
      case 'Cash Advance':
      case 'Sale':
        return 'destructive';
      case 'Purchase':
      case 'Purchase Return': 
      case 'Other Income':
      case 'Investment':
      case 'Customer Payment':
        return 'outline';
      default: 
        return 'default';
    }
  };
  
  const isCreditEntry = (type: LedgerEntry['type']) => {
    return ['Purchase', 'Purchase Return', 'Other Income', 'Investment', 'Customer Payment', 'Sale'].includes(type);
  }
  
  const handleDeleteEntry = () => {
    if (!entryToDelete) return;
    
    const [typePrefix, id] = entryToDelete.id.split(/-(.*)/s);

    switch(typePrefix) {
        case 'tx': deleteTransaction(id); break;
        case 'pur': deletePurchase(id); break;
        case 'exp': deleteExpense(id); break;
        case 'pr': deletePurchaseReturn(id); break;
        case 'oi': deleteOtherIncome(id); break;
        case 'cp': deleteCustomerPayment(id); break;
        case 'sp': deleteSupplierPayment(id); break;
        case 'inv': deleteInvestment(id); break;
        case 'wdr': deleteInvestment(id); break; // Both use same hook
        case 'ca': deleteCashAdvance(id); break;
        default:
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not delete entry of unknown type.',
            });
            return;
    }

    toast({
        title: 'Entry Deleted',
        description: `The ${entryToDelete.type} entry has been successfully deleted.`,
    });
    setEntryToDelete(null);
  };


  return (
    <>
      <div className="p-4 md:p-8 watermark-container">
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
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 print:hidden w-full sm:w-auto">
                 <div className="relative w-full sm:w-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search particulars..." 
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                 </div>
                 <div className="flex items-center gap-2">
                   <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
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
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                            setSelectedDate(date);
                            setIsCalendarOpen(false);
                        }}
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
                 <Button asChild variant="outline">
                    <Link href="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" /> Go to Dashboard</Link>
                 </Button>
                 <Button variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4"/>Print</Button>
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
                    <TableHead className="text-center print:hidden">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedDate && !searchTerm && (
                    <TableRow className="bg-muted/30">
                      <TableCell colSpan={5} className="font-bold text-right">Opening Balance</TableCell>
                      <TableCell className={`text-right font-semibold font-mono ${openingBalance >= 0 ? 'text-primary' : 'text-destructive'}`}>
                        {openingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                       <TableCell/>
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
                      <TableCell className={`text-right font-semibold font-mono ${entry.balance >= 0 ? 'text-primary' : 'text-destructive'}`}>
                          {entry.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-center print:hidden">
                          <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-destructive hover:text-destructive"
                              onClick={() => setEntryToDelete(entry)}
                          >
                              <Trash2 className="w-4 h-4" />
                          </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                 {!searchTerm && (
                  <TableFooter>
                    <TableRow className="bg-muted/50 font-bold">
                      <TableCell colSpan={3} className="text-right">Period Totals</TableCell>
                      <TableCell className="text-right font-mono text-destructive">{totals.debit.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-mono text-green-600">{totals.credit.toFixed(2)}</TableCell>
                      <TableCell colSpan={2} />
                    </TableRow>
                  </TableFooter>
                 )}
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                {isLoaded ? (
                  <>
                    <DollarSign className="w-16 h-16" />
                    <h3 className="text-xl font-semibold">
                      {selectedDate || searchTerm ? 'No Transactions Found' : 'No Transactions Recorded'}
                    </h3>
                    <p>
                      {selectedDate || searchTerm
                        ? `There are no transactions for the selected filter.`
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
          {isLoaded && entries.length > 0 && !searchTerm && (
             <CardFooter className="flex justify-end bg-muted/50 p-4 rounded-b-lg">
                <div className="text-right">
                    <p className="text-sm text-muted-foreground">Final Closing Balance</p>
                    <p className={`text-2xl font-bold ${finalBalance >= 0 ? 'text-primary' : 'text-destructive'}`}>PKR {finalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
            </CardFooter>
          )}
        </Card>
      </div>
      
      <AlertDialog open={!!entryToDelete} onOpenChange={(isOpen) => !isOpen && setEntryToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle/>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the entry for: <br />
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
