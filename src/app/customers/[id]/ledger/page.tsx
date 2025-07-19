
'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { BookUser, ArrowLeft, User, Phone, Car } from 'lucide-react';
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


type LedgerEntry = {
  id: string;
  timestamp: string;
  description: string;
  type: 'Sale' | 'Payment' | 'Cash Advance' | 'Purchase' | 'Supplier Payment';
  debit: number;
  credit: number;
  balance: number;
};

export default function CustomerLedgerPage() {
  const params = useParams();
  const entityId = params.id as string;

  const { customers, isLoaded: customersLoaded } = useCustomers();
  const { suppliers, isLoaded: suppliersLoaded } = useSuppliers();
  const { transactions, isLoaded: transactionsLoaded } = useTransactions();
  const { customerPayments, isLoaded: paymentsLoaded } = useCustomerPayments();
  const { cashAdvances, isLoaded: advancesLoaded } = useCashAdvances();
  const { purchases, isLoaded: purchasesLoaded } = usePurchases();
  const { supplierPayments, isLoaded: supplierPaymentsLoaded } = useSupplierPayments();

  const isLoaded = customersLoaded && suppliersLoaded && transactionsLoaded && paymentsLoaded && advancesLoaded && purchasesLoaded && supplierPaymentsLoaded;

  const { entity, entityType } = useMemo(() => {
    if (!isLoaded) return { entity: null, entityType: null };
    const customer = customers.find(c => c.id === entityId);
    if (customer) return { entity: customer, entityType: 'Customer' };
    const supplier = suppliers.find(s => s.id === entityId);
    if (supplier) return { entity: supplier, entityType: 'Supplier' };
    return { entity: null, entityType: null };
  }, [entityId, customers, suppliers, isLoaded]);

  const { entries, finalBalance } = useMemo(() => {
    if (!entity) return { entries: [], finalBalance: 0 };

    const combined: Omit<LedgerEntry, 'balance'>[] = [];

    if (entityType === 'Customer') {
        const customerTransactions = transactions.filter(tx => tx.customerId === entityId);
        const customerPaymentsReceived = customerPayments.filter(p => p.customerId === entityId);
        const customerCashAdvances = cashAdvances.filter(ca => ca.customerId === entityId);

        customerTransactions.forEach(tx => combined.push({
          id: `tx-${tx.id}`,
          timestamp: tx.timestamp,
          description: `${tx.volume.toFixed(2)}L of ${tx.fuelType}`,
          type: 'Sale',
          debit: tx.totalAmount,
          credit: 0,
        }));

        customerPaymentsReceived.forEach(p => combined.push({
          id: `pay-${p.id}`,
          timestamp: p.timestamp,
          description: `Payment Received (${p.paymentMethod})`,
          type: 'Payment',
          debit: 0,
          credit: p.amount,
        }));
        
        customerCashAdvances.forEach(ca => combined.push({
          id: `adv-${ca.id}`,
          timestamp: ca.timestamp,
          description: `Cash Advance (${ca.notes || 'No notes'})`,
          type: 'Cash Advance',
          debit: ca.amount,
          credit: 0,
        }));
    } else if (entityType === 'Supplier') {
        const supplierPurchases = purchases.filter(p => p.supplierId === entityId);
        const supplierPaymentsMade = supplierPayments.filter(sp => sp.supplierId === entityId);

        supplierPurchases.forEach(p => combined.push({
            id: `pur-${p.id}`,
            timestamp: p.timestamp,
            description: `${p.volume.toFixed(2)}L of ${p.fuelType}`,
            type: 'Purchase',
            credit: p.totalCost, // Credit to supplier's account
            debit: 0,
        }));

        supplierPaymentsMade.forEach(sp => combined.push({
            id: `spay-${sp.id}`,
            timestamp: sp.timestamp,
            description: `Payment Made (${sp.paymentMethod})`,
            type: 'Supplier Payment',
            debit: sp.amount,
            credit: 0,
        }));
    }


    combined.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    let runningBalance = 0;
    const entriesWithBalance: LedgerEntry[] = combined.map(entry => {
      runningBalance += entry.debit - entry.credit;
      return { ...entry, balance: runningBalance };
    });

    return { entries: entriesWithBalance.reverse(), finalBalance: runningBalance };
  }, [entity, entityType, transactions, customerPayments, cashAdvances, purchases, supplierPayments]);

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
          <Link href="/customer-payments"><ArrowLeft className="mr-2 h-4 w-4" />Back to Partner Ledger</Link>
        </Button>
      </div>
    );
  }

  const isCustomer = entityType === 'Customer';

  return (
    <div className="p-4 md:p-8 space-y-8">
       <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-3">
                <User /> {entityType} Details
            </CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground"/>
                <strong>Name:</strong> {entity.name}
            </div>
            <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground"/>
                <strong>Contact:</strong> {entity.contact}
            </div>
            {isCustomer && 'vehicleNumber' in entity && (
                <div className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-muted-foreground"/>
                    <strong>Vehicle No:</strong> {entity.vehicleNumber || 'N/A'}
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
             <Button asChild variant="outline">
                <Link href="/customer-payments"><ArrowLeft className="mr-2 h-4 w-4" />Back to Partner Ledger</Link>
             </Button>
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
                         variant={entry.debit > 0 ? 'destructive' : 'outline'}
                         className={cn(entry.credit > 0 && 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700')}
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
                     <TableCell className={`text-right font-semibold font-mono ${entry.balance > 0 ? 'text-destructive' : 'text-green-600'}`}>
                        {entry.balance.toFixed(2)}
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
                <p className={`text-2xl font-bold ${finalBalance > 0 ? 'text-destructive' : 'text-green-600'}`}>PKR {finalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}
