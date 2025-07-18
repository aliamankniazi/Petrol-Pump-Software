'use client';

import { useCustomerPayments } from '@/hooks/use-customer-payments';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import type { PaymentMethod } from '@/lib/types';
import { HandCoins, XCircle } from 'lucide-react';

export default function CustomerPaymentsPage() {
  const { customerPayments, isLoaded } = useCustomerPayments();

  const getBadgeVariant = (method: PaymentMethod) => {
    switch (method) {
      case 'Card':
        return 'default';
      case 'Cash':
        return 'secondary';
      case 'Mobile':
        return 'outline';
      default:
        return 'default';
    }
  };

  return (
    <div className="p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HandCoins /> Customer Payment History
          </CardTitle>
          <CardDescription>A record of all payments received from customers.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoaded && customerPayments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-center">Payment Method</TableHead>
                  <TableHead className="text-right">Amount (PKR)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customerPayments.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      {format(new Date(p.timestamp), 'PP pp')}
                    </TableCell>
                    <TableCell>{p.customerName}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={getBadgeVariant(p.paymentMethod)}>{p.paymentMethod}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{p.amount.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                {isLoaded ? (
                    <>
                        <XCircle className="w-16 h-16" />
                        <h3 className="text-xl font-semibold">No Customer Payments Yet</h3>
                        <p>Record a payment on the main screen to see it here.</p>
                    </>
                ) : (
                    <p>Loading payment data...</p>
                )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
