
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { useTransactions } from '@/hooks/use-transactions';
import type { FuelType } from '@/lib/types';
import { Box } from 'lucide-react';

interface ProductSaleRow {
  fuelType: FuelType;
  totalVolume: number;
  totalRevenue: number;
  avgPricePerLitre: number;
}

const FUEL_TYPES: FuelType[] = ['Unleaded', 'Premium', 'Diesel'];

export default function ProductSalesPage() {
  const { transactions, isLoaded } = useTransactions();

  const salesByProduct = useMemo(() => {
    if (!isLoaded) return [];

    const productSales = FUEL_TYPES.map(fuelType => {
      
      const salesForFuel = transactions.flatMap(tx => tx.items).filter(item => item.fuelType === fuelType);

      const totalVolume = salesForFuel.reduce((sum, item) => sum + item.volume, 0);
      const totalRevenue = salesForFuel.reduce((sum, item) => sum + item.totalAmount, 0);

      return {
        fuelType,
        totalVolume,
        totalRevenue,
        avgPricePerLitre: totalVolume > 0 ? totalRevenue / totalVolume : 0,
      };
    });

    return productSales;
  }, [transactions, isLoaded]);
  
  const totals = useMemo(() => {
    return {
      totalVolume: salesByProduct.reduce((sum, p) => sum + p.totalVolume, 0),
      totalRevenue: salesByProduct.reduce((sum, p) => sum + p.totalRevenue, 0),
    }
  }, [salesByProduct]);

  return (
    <div className="p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Box /> Product Wise Sales Report
          </CardTitle>
          <CardDescription>
            A breakdown of sales volume and revenue for each fuel type.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product (Fuel Type)</TableHead>
                <TableHead className="text-right">Total Volume Sold (Litres)</TableHead>
                <TableHead className="text-right">Average Price / Litre (PKR)</TableHead>
                <TableHead className="text-right">Total Revenue (PKR)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoaded ? (
                salesByProduct.length > 0 ? (
                  salesByProduct.map(product => (
                    <TableRow key={product.fuelType}>
                      <TableCell className="font-medium">{product.fuelType}</TableCell>
                      <TableCell className="text-right font-mono">{product.totalVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-right font-mono">{product.avgPricePerLitre.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-right font-mono font-semibold">{product.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      No sales data available.
                    </TableCell>
                  </TableRow>
                )
              ) : (
                 Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell colSpan={4} className="h-12 text-center">Loading...</TableCell>
                    </TableRow>
                ))
              )}
            </TableBody>
            <TableFooter>
                <TableRow className="font-bold bg-muted/50">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right font-mono">{totals.totalVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                    <TableCell />
                    <TableCell className="text-right font-mono">{totals.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
