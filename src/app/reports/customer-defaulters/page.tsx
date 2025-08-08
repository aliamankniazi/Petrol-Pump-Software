
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCustomers } from '@/hooks/use-customers';
import { useTransactions } from '@/hooks/use-transactions';
import { useCustomerPayments } from '@/hooks/use-customer-payments';
import { useCashAdvances } from '@/hooks/use-cash-advances';
import { UserX, BookText, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface DefaulterRow {
  id: string;
  name: string;
  contact: string;
  area?: string;
  balance: number;
}

export default function CustomerDefaulterReportPage() {
  const { customers, isLoaded: customersLoaded } = useCustomers();
  const { transactions, isLoaded: txLoaded } = useTransactions();
  const { customerPayments, isLoaded: paymentsLoaded } = useCustomerPayments();
  const { cashAdvances, isLoaded: advancesLoaded } = useCashAdvances();

  const isDataLoaded = customersLoaded && txLoaded && paymentsLoaded && advancesLoaded;

  const defaulters = useMemo(() => {
    if (!isDataLoaded) return [];

    return customers
      .map(customer => {
        const debit = transactions
          .filter(tx => tx.customerId === customer.id)
          .reduce((sum, tx) => sum + tx.totalAmount, 0)
          + cashAdvances
          .filter(ca => ca.customerId === customer.id)
          .reduce((sum, ca) => sum + ca.amount, 0);
          
        const credit = customerPayments
          .filter(p => p.customerId === customer.id)
          .reduce((sum, p) => sum + p.amount, 0);

        const balance = debit - credit;

        return {
          id: customer.id!,
          name: customer.name,
          contact: customer.contact,
          area: customer.area,
          balance,
        };
      })
      .filter(customer => customer.balance > 0)
      .sort((a, b) => b.balance - a.balance);
  }, [customers, transactions, customerPayments, cashAdvances, isDataLoaded]);

  return (
    <div className="p-4 md:p-8 watermark-container">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <UserX /> Customer Defaulter Report
              </CardTitle>
              <CardDescription>
                A list of all customers with a positive (outstanding) balance.
              </CardDescription>
            </div>
            <Button variant="outline" onClick={() => window.print()} className="print:hidden"><Printer className="mr-2 h-4 w-4" />Print</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Area</TableHead>
                <TableHead className="text-right">Outstanding Balance (PKR)</TableHead>
                <TableHead className="text-center print:hidden">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isDataLoaded ? (
                defaulters.length > 0 ? (
                  defaulters.map(d => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.name}</TableCell>
                      <TableCell>{d.contact}</TableCell>
                      <TableCell>{d.area || 'N/A'}</TableCell>
                      <TableCell className="text-right font-mono text-destructive">
                        {d.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-center print:hidden">
                        <Button asChild variant="ghost" size="icon" title="View Ledger">
                           <Link href={`/customers/${d.id}/ledger`}>
                             <BookText className="w-5 h-5" />
                           </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No customer defaulters found.
                    </TableCell>
                  </TableRow>
                )
              ) : (
                Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell colSpan={5} className="h-12 text-center">Loading...</TableCell>
                    </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
