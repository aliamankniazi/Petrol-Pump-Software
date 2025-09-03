
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTransactions } from '@/hooks/use-transactions';
import { usePurchases } from '@/hooks/use-purchases';
import { usePurchaseReturns } from '@/hooks/use-purchase-returns';
import { Package, Printer } from 'lucide-react';
import { useProducts } from '@/hooks/use-products';
import { Button } from '@/components/ui/button';

export default function StockMovementPage() {
  const { transactions, isLoaded: txLoaded } = useTransactions();
  const { purchases, isLoaded: purLoaded } = usePurchases();
  const { purchaseReturns, isLoaded: retLoaded } = usePurchaseReturns();
  const { products, isLoaded: stockLoaded } = useProducts();

  const isLoaded = txLoaded && purLoaded && retLoaded && stockLoaded;

  const reportData = useMemo(() => {
    if (!isLoaded) return [];

    return products.map(product => {
      const totalPurchased = purchases
        .flatMap(p => p.items)
        .filter(item => item.productId === product.id)
        .reduce((sum, item) => sum + item.quantity, 0);
      
      const totalSold = transactions
        .flatMap(tx => tx.items)
        .filter(item => item.productId === product.id)
        .reduce((sum, item) => sum + item.quantity, 0);

      const totalReturned = purchaseReturns
        .filter(pr => pr.productId === product.id)
        .reduce((sum, pr) => sum + pr.volume, 0);

      const currentStock = product.stock || 0;

      return {
        ...product,
        totalPurchased,
        totalSold,
        totalReturned,
        currentStock,
      };
    });
  }, [isLoaded, purchases, transactions, purchaseReturns, products]);

  return (
    <div className="p-4 md:p-8 watermark-container">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package /> Stock Sale & Purchase Report
              </CardTitle>
              <CardDescription>
                A summary of stock movement for each product.
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
                <TableHead className="text-right">Total Purchased</TableHead>
                <TableHead className="text-right">Total Sold</TableHead>
                <TableHead className="text-right">Total Returned</TableHead>
                <TableHead className="text-right">Current Stock</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoaded ? (
                reportData.map(row => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell className="text-right font-mono font-bold text-green-600">{row.totalPurchased.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {row.mainUnit}(s)</TableCell>
                    <TableCell className="text-right font-mono font-bold text-destructive">{row.totalSold.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {row.mainUnit}(s)</TableCell>
                    <TableCell className="text-right font-mono font-bold text-blue-600">{row.totalReturned.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {row.mainUnit}(s)</TableCell>
                    <TableCell className="text-right font-mono font-bold">{row.currentStock.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {row.mainUnit}(s)</TableCell>
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
