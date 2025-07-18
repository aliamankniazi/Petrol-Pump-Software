'use client';

import { useTransactions } from '@/hooks/use-transactions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import type { PaymentMethod } from '@/lib/types';
import HistoryLoading from './loading';
import { History, XCircle } from 'lucide-react';

export default function HistoryPage() {
  const { transactions, isLoaded } = useTransactions();

  if (!isLoaded) {
    return <HistoryLoading />;
  }

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
            <History /> Transaction History
          </CardTitle>
          <CardDescription>A record of all completed sales.</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Fuel Type</TableHead>
                  <TableHead className="text-right">Volume (L)</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-center">Payment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map(tx => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-medium">
                      {format(new Date(tx.timestamp), 'PP pp')}
                    </TableCell>
                    <TableCell>{tx.fuelType}</TableCell>
                    <TableCell className="text-right">{tx.volume.toFixed(2)}</TableCell>
                    <TableCell className="text-right">${tx.totalAmount.toFixed(2)}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={getBadgeVariant(tx.paymentMethod)}>{tx.paymentMethod}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
              <XCircle className="w-16 h-16" />
              <h3 className="text-xl font-semibold">No Transactions Yet</h3>
              <p>Complete a sale on the main screen to see it here.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
