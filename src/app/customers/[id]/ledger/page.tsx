
'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { BookUser, ArrowLeft, User, Phone, Car, Trash2, AlertTriangle, Percent, Briefcase, Printer, LayoutDashboard } from 'lucide-react';
import { useTransactions } from '@/hooks/use-transactions';
import { useCustomerPayments } from '@/hooks/use-customer-payments';
import { useCashAdvances } from '@/hooks/use-cash-advances';
import { useCustomers } from '@/hooks/use-customers';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePurchases } from '@/hooks/use-purchases';
import { useSupplierPayments } from '@/hooks/use-supplier-payments';
import { useSuppliers } from '@/hooks/use-suppliers';
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
import { useInvestments } from '@/hooks/use-investments';
import { useExpenses } from '@/hooks/use-expenses';

type EntityType = 'Customer' | 'Supplier' | 'Partner' | 'Employee';


type LedgerEntry = {
  id: string;
  timestamp: string;
  description: string;
  type: 'Sale' | 'Payment' | 'Cash Advance' | 'Purchase' | 'Supplier Payment' | 'Investment' | 'Withdrawal' | 'Salary';
  debit: number;
  credit: number;
  balance: number;
};

export default function CustomerLedgerPage() {
  const params = useParams();
  const entityId = params.id as string;

  const { customers, isLoaded: customersLoaded } = useCustomers();
  const { suppliers, isLoaded: suppliersLoaded } = useSuppliers();
  const { transactions, deleteTransaction, isLoaded: transactionsLoaded } = useTransactions();
  const { customerPayments, deleteCustomerPayment, isLoaded: paymentsLoaded } = useCustomerPayments();
  const { cashAdvances, deleteCashAdvance, isLoaded: advancesLoaded } = useCashAdvances();
  const { purchases, deletePurchase, isLoaded: purchasesLoaded } = usePurchases();
  const { supplierPayments, deleteSupplierPayment, isLoaded: supplierPaymentsLoaded } = useSupplierPayments();
  const { investments, deleteInvestment, isLoaded: investmentsLoaded } = useInvestments();
  const { expenses, deleteExpense, isLoaded: expensesLoaded } = useExpenses();
  const [entryToDelete, setEntryToDelete] = useState<LedgerEntry | null>(null);
  const { toast } = useToast();

  const isLoaded = customersLoaded && suppliersLoaded && transactionsLoaded && paymentsLoaded && advancesLoaded && purchasesLoaded && supplierPaymentsLoaded && investmentsLoaded && expensesLoaded;

  const { entity, entityType } = useMemo(() => {
    if (!isLoaded) return { entity: null, entityType: null };
    const customer = customers.find(c => c.id === entityId);
    if (customer) {
        if(customer.isPartner) return { entity: customer, entityType: 'Partner' };
        if(customer.isEmployee) return { entity: customer, entityType: 'Employee' };
        return { entity: customer, entityType: 'Customer' };
    }
    const supplier = suppliers.find(s => s.id === entityId);
    if (supplier) return { entity: supplier, entityType: 'Supplier' };
    
    return { entity: null, entityType: null };
  }, [entityId, customers, suppliers, isLoaded]);

  const { entries, finalBalance } = useMemo(() => {
    if (!entity) return { entries: [], finalBalance: 0 };

    const combined: Omit<LedgerEntry, 'balance'>[] = [];

    if (entityType === 'Customer' || entityType === 'Partner' || entityType === 'Employee') {
        const customerTransactions = transactions.filter(tx => tx.customerId === entityId);
        const customerPaymentsReceived = customerPayments.filter(p => p.customerId === entityId);
        const customerCashAdvances = cashAdvances.filter(ca => ca.customerId === entityId);

        customerTransactions.forEach(tx => combined.push({
          id: `tx-${tx.id}`,
          timestamp: tx.timestamp!,
          description: `${tx.items?.map(item => `${item.quantity.toFixed(2)}L of ${item.productName}`).join(', ') || 'Sale'} ${tx.notes ? `- ${tx.notes}` : ''}`,
          type: 'Sale',
          debit: tx.totalAmount,
          credit: 0,
        }));

        customerPaymentsReceived.forEach(p => {
            combined.push({
              id: `pay-${p.id}`,
              timestamp: p.timestamp!,
              description: `Payment Received (${p.paymentMethod})`,
              type: 'Payment',
              debit: 0,
              credit: p.amount,
            })
        });
        
        customerCashAdvances.forEach(ca => {
            combined.push({
              id: `adv-${ca.id}`,
              timestamp: ca.timestamp!,
              description: ca.notes || 'Cash Advance',
              type: 'Cash Advance',
              debit: ca.amount,
              credit: 0,
            })
        });
        
        if (entityType === 'Employee') {
            const employeeSalaries = expenses.filter(exp => exp.employeeId === entityId && exp.category === 'Salaries');
            employeeSalaries.forEach(exp => {
                combined.push({
                    id: `exp-${exp.id}`,
                    timestamp: exp.timestamp!,
                    description: exp.description,
                    type: 'Salary',
                    debit: 0,
                    credit: exp.amount,
                });
            });
        }
        
        if (entityType === 'Partner') {
            const partnerInvestments = investments.filter(inv => inv.partnerId === entityId);
            partnerInvestments.forEach(inv => {
                if (inv.type === 'Investment') {
                    combined.push({
                        id: `inv-${inv.id}`,
                        timestamp: inv.timestamp!,
                        description: inv.notes || 'Investment',
                        type: 'Investment',
                        credit: inv.amount,
                        debit: 0,
                    });
                } else {
                    combined.push({
                        id: `wdr-${inv.id}`,
                        timestamp: inv.timestamp!,
                        description: inv.notes || 'Withdrawal',
                        type: 'Withdrawal',
                        debit: inv.amount,
                        credit: 0,
                    });
                }
            });
        }

    } else if (entityType === 'Supplier') {
        const supplierPurchases = purchases.filter(p => p.supplierId === entityId);
        const supplierPaymentsMade = supplierPayments.filter(sp => sp.supplierId === entityId);

        supplierPurchases.forEach(p => combined.push({
            id: `pur-${p.id}`,
            timestamp: p.timestamp!,
            description: `${p.items.map(item => `${item.quantity.toFixed(2)}L of ${item.productName}`).join(', ')} ${p.notes ? `- ${p.notes}` : ''}`,
            type: 'Purchase',
            credit: p.totalCost,
            debit: 0,
        }));

        supplierPaymentsMade.forEach(sp => combined.push({
            id: `spay-${sp.id}`,
            timestamp: sp.timestamp!,
            description: `Payment Made (${sp.paymentMethod})`,
            type: 'Supplier Payment',
            debit: sp.amount,
            credit: 0,
        }));
    }


    combined.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    let runningBalance = 0;
    const entriesWithBalance: LedgerEntry[] = combined.map(entry => {
      if (entityType === 'Partner' || entityType === 'Supplier') {
          runningBalance += entry.credit - entry.debit;
      } else { // For customers and employees, debit increases their balance (they owe the business more)
          runningBalance += entry.debit - entry.credit;
      }
      return { ...entry, balance: runningBalance };
    });

    return { entries: entriesWithBalance.reverse(), finalBalance: runningBalance };
  }, [entity, entityType, transactions, customerPayments, cashAdvances, purchases, supplierPayments, investments, expenses, entityId]);

  const handleDeleteEntry = () => {
    if (!entryToDelete) return;
    
    const [typePrefix, id] = entryToDelete.id.split(/-(.*)/s);

    switch(typePrefix) {
        case 'tx': deleteTransaction(id); break;
        case 'pur': deletePurchase(id); break;
        case 'pay': deleteCustomerPayment(id); break;
        case 'adv': deleteCashAdvance(id); break;
        case 'spay': deleteSupplierPayment(id); break;
        case 'inv': deleteInvestment(id); break;
        case 'wdr': deleteInvestment(id); break;
        case 'exp': deleteExpense(id); break; // Added for salary deletion
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


  if (!isLoaded) {
    return (
        <div className="p-4 md:p-8 space-y-8">
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-64" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-24 w-full" />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-80 mt-2" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-96 w-full" />
                </CardContent>
            </Card>
        </div>
    );
  }

  if (!entity) {
    return (
      <div className="p-4 md:p-8 text-center">
        <h2 className="text-2xl font-bold text-destructive">Partner Not Found</h2>
        <p className="text-muted-foreground">The partner with the specified ID could not be found.</p>
        <Button asChild className="mt-4">
          <Link href="/partner-ledger"><ArrowLeft className="mr-2 h-4 w-4" />Back to Partner Ledger</Link>
        </Button>
      </div>
    );
  }

  const getEntityTypeIcon = () => {
    switch (entityType) {
        case 'Partner': return <Percent />;
        case 'Employee': return <Briefcase />;
        default: return <User />;
    }
  }


  const balanceColorClass = () => {
      // For partners/suppliers, positive balance means the business owes them (net investment/credit).
      // Visually, a credit balance (money owed to them) is typically green.
      if (entityType === 'Partner' || entityType === 'Supplier') {
          return finalBalance >= 0 ? 'text-green-600' : 'text-destructive';
      }
      // For customers/employees, positive balance means they owe us (bad, red), negative means we owe them (good, green)
      return finalBalance > 0 ? 'text-destructive' : 'text-green-600';
  }

  const rowBalanceColorClass = (balance: number) => {
    if (entityType === 'Partner' || entityType === 'Supplier') {
        return balance >= 0 ? 'text-green-600' : 'text-destructive';
    }
    return balance > 0 ? 'text-destructive' : 'text-green-600';
  }

  const getBadgeType = (entry: LedgerEntry) => {
    if (entityType === 'Partner' || entityType === 'Supplier') {
        return entry.credit > 0 ? 'credit' : 'debit';
    }
    return entry.debit > 0 ? 'debit' : 'credit';
  }
  
  const getBadgeVariant = (entry: LedgerEntry) => {
     const type = getBadgeType(entry);
     if (type === 'debit') return 'destructive';
     return 'outline';
  }
  
  const getBadgeClass = (entry: LedgerEntry) => {
     const type = getBadgeType(entry);
     if(type === 'credit') {
         return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700';
     }
     return '';
  }


  return (
    <div className="p-4 md:p-8 space-y-8 watermark-container">
       <Card>
        <CardHeader className="flex flex-row justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-3">
                  {getEntityTypeIcon()} {entityType} Details
              </CardTitle>
            </div>
             <Button asChild variant="outline">
                <Link href="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" /> Go to Dashboard</Link>
            </Button>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground"/>
                <strong>Name:</strong> {entity.name}
            </div>
            {'contact' in entity && (
                <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground"/>
                    <strong>Contact:</strong> {entity.contact || 'N/A'}
                </div>
            )}
            {entityType === 'Customer' && 'vehicleNumber' in entity && (
                <div className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-muted-foreground"/>
                    <strong>Vehicle No:</strong> {entity.vehicleNumber || 'N/A'}
                </div>
            )}
            {entityType === 'Partner' && 'sharePercentage' in entity && (
                 <div className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-muted-foreground"/>
                    <strong>Share:</strong> {entity.sharePercentage}%
                </div>
            )}
        </CardContent>
       </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookUser /> {entityType} Ledger: {entity.name}
              </CardTitle>
              <CardDescription>A record of all transactions for this {entityType.toLowerCase()}.</CardDescription>
            </div>
             <div className="flex gap-2 print:hidden">
                <Button variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4"/>Print</Button>
                <Button asChild variant="outline">
                    <Link href="/partner-ledger"><ArrowLeft className="mr-2 h-4 w-4" />Back to Unified Ledger</Link>
                </Button>
             </div>
          </div>
        </CardHeader>
        <CardContent>
          {entries.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
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
                    <TableCell>{entry.description}</TableCell>
                    <TableCell>
                       <Badge 
                         variant={getBadgeVariant(entry)}
                         className={cn(getBadgeClass(entry))}
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
                     <TableCell className={cn("text-right font-semibold font-mono", rowBalanceColorClass(entry.balance))}>
                        {Math.abs(entry.balance).toFixed(2)}
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
            </Table>
          ) : (
            <div className="text-center text-muted-foreground p-8">
              <p>No transactions or payments recorded for this {entityType.toLowerCase()} yet.</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end bg-muted/50 p-4 rounded-b-lg">
            <div className="text-right">
                <p className="text-sm text-muted-foreground">Final Balance</p>
                <p className={cn("text-2xl font-bold", balanceColorClass())}>PKR {finalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
        </CardFooter>
      </Card>

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
    </div>
  );
}
