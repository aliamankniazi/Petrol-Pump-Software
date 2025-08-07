
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { useTransactions } from '@/hooks/use-transactions';
import { useProducts } from '@/hooks/use-products';
import { Box, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProductSaleRow {
  productName: string;
  totalVolume: number;
  totalRevenue: number;
  avgPricePerUnit: number;
}

export default function ProductSalesPage() {
  const { transactions, isLoaded: txLoaded } = useTransactions();
  const { products, isLoaded: productsLoaded } = useProducts();
  const isLoaded = txLoaded && productsLoaded;

  const salesByProduct = useMemo(() => {
    if (!isLoaded) return [];

    return products.map(product => {
      const salesForProduct = transactions.flatMap(tx => tx.items).filter(item => item.productId === product.id);

      const totalQuantity = salesForProduct.reduce((sum, item) => sum + item.quantity, 0);
      const totalRevenue = salesForProduct.reduce((sum, item) => sum + item.totalAmount, 0);

      return {
        productName: product.name,
        totalQuantity,
        totalRevenue,
        avgPricePerUnit: totalQuantity > 0 ? totalRevenue / totalQuantity : 0,
        unit: product.unit,
      };
    });
  }, [transactions, products, isLoaded]);
  
  const totals = useMemo(() => {
    return {
      totalRevenue: salesByProduct.reduce((sum, p) => sum + p.totalRevenue, 0),
    }
  }, [salesByProduct]);

  return (
    <div className="p-4 md:p-8">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Box /> Product Wise Sales Report
              </CardTitle>
              <CardDescription>
                A breakdown of sales volume and revenue for each product.
              </CardDescription>
            </div>
            <Button variant="outline" onClick={() => window.print()} className="print:hidden"><Printer className="mr-2 h-4 w-4" />Print</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Total Sold</TableHead>
                <TableHead className="text-right">Average Price / Unit (PKR)</TableHead>
                <TableHead className="text-right">Total Revenue (PKR)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoaded ? (
                salesByProduct.length > 0 ? (
                  salesByProduct.map(product => (
                    <TableRow key={product.productName}>
                      <TableCell className="font-medium">{product.productName}</TableCell>
                      <TableCell className="text-right font-mono">{product.totalQuantity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {product.unit}s</TableCell>
                      <TableCell className="text-right font-mono">{product.avgPricePerUnit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
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
                    <TableCell colSpan={3}>Total</TableCell>
                    <TableCell className="text-right font-mono">{totals.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
