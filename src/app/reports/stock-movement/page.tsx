
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTransactions } from '@/hooks/use-transactions';
import { usePurchases } from '@/hooks/use-purchases';
import { usePurchaseReturns } from '@/hooks/use-purchase-returns';
import { useFuelStock } from '@/hooks/use-fuel-stock';
import type { FuelType } from '@/lib/types';
import { Package } from 'lucide-react';

const FUEL_TYPES: FuelType[] = ['Unleaded', 'Premium', 'Diesel'];

export default function StockMovementPage() {
  const { transactions, isLoaded: txLoaded } = useTransactions();
  const { purchases, isLoaded: purLoaded } = usePurchases();
  const { purchaseReturns, isLoaded: retLoaded } = usePurchaseReturns();
  const { fuelStock, isLoaded: stockLoaded } = useFuelStock();

  const isLoaded = txLoaded && purLoaded && retLoaded && stockLoaded;

  const reportData = useMemo(() => {
    if (!isLoaded) return [];

    return FUEL_TYPES.map(fuelType => {
      const totalPurchased = purchases
        .filter(p => p.fuelType === fuelType)
        .reduce((sum, p) => sum + p.volume, 0);
      
      const totalSold = transactions
        .filter(t => t.fuelType === fuelType)
        .reduce((sum, t) => sum + t.volume, 0);

      const totalReturned = purchaseReturns
        .filter(pr => pr.fuelType === fuelType)
        .reduce((sum, pr) => sum + pr.volume, 0);

      const currentStock = fuelStock[fuelType] || 0;

      return {
        fuelType,
        totalPurchased,
        totalSold,
        totalReturned,
        currentStock,
      };
    });
  }, [isLoaded, purchases, transactions, purchaseReturns, fuelStock]);

  return (
    <div className="p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package /> Stock Sale & Purchase Report
          </CardTitle>
          <CardDescription>
            A summary of stock movement for each fuel type.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fuel Type</TableHead>
                <TableHead className="text-right">Total Purchased (L)</TableHead>
                <TableHead className="text-right">Total Sold (L)</TableHead>
                <TableHead className="text-right">Total Returned (L)</TableHead>
                <TableHead className="text-right">Current Stock (L)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoaded ? (
                reportData.map(row => (
                  <TableRow key={row.fuelType}>
                    <TableCell className="font-medium">{row.fuelType}</TableCell>
                    <TableCell className="text-right font-mono text-green-600">{row.totalPurchased.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right font-mono text-destructive">{row.totalSold.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right font-mono text-blue-600">{row.totalReturned.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right font-mono font-bold">{row.currentStock.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                ))
              ) : (
                Array.from({ length: 3 }).map((_, i) => (
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
