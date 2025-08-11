
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { useTransactions } from '@/hooks/use-transactions';
import { useProducts } from '@/hooks/use-products';
import { usePurchases } from '@/hooks/use-purchases';
import { Percent, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ProductProfitMarginPage() {
  const { transactions, isLoaded: txLoaded } = useTransactions();
  const { products, isLoaded: productsLoaded } = useProducts();
  const { purchases, isLoaded: purchasesLoaded } = usePurchases();

  const isLoaded = txLoaded && productsLoaded && purchasesLoaded;

  const sortedPurchases = useMemo(() => {
    if (!purchasesLoaded) return [];
    // Sort purchases by date ascending to make finding the last purchase easier
    return [...purchases].sort((a, b) => new Date(a.timestamp!).getTime() - new Date(b.timestamp!).getTime());
  }, [purchases, purchasesLoaded]);

  const reportData = useMemo(() => {
    if (!isLoaded) return [];

    return products.map(product => {
      const salesForProduct = transactions.flatMap(tx => 
        tx.items
          .filter(item => item.productId === product.id)
          .map(item => ({ ...item, saleTimestamp: tx.timestamp! }))
      );

      const totalQuantitySold = salesForProduct.reduce((sum, item) => sum + item.quantity, 0);
      const totalRevenue = salesForProduct.reduce((sum, item) => sum + item.totalAmount, 0);
      
      const totalCost = salesForProduct.reduce((sum, item) => {
        const saleTimestamp = new Date(item.saleTimestamp);
        
        // Find the last purchase of this product that happened on or before the sale date
        const lastRelevantPurchaseItem = sortedPurchases
            .flatMap(p => p.items.map(pi => ({ ...pi, purchaseTimestamp: p.timestamp })))
            .filter(pi => pi.productId === item.productId && new Date(pi.purchaseTimestamp!) <= saleTimestamp)
            .pop(); // Get the last one from the sorted array

        let costOfGoods = 0;
        if (lastRelevantPurchaseItem) {
            costOfGoods = item.quantity * lastRelevantPurchaseItem.costPerUnit;
        } else {
            // Fallback to current product purchase price if no historical purchase found
            costOfGoods = (product?.purchasePrice || 0) * item.quantity;
        }
        return sum + costOfGoods;
      }, 0);
      
      const totalProfit = totalRevenue - totalCost;
      const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

      return {
        productName: product.name,
        totalQuantitySold,
        totalRevenue,
        totalCost,
        totalProfit,
        profitMargin,
        unit: product.unit,
      };
    }).filter(p => p.totalQuantitySold > 0); // Only show products that have been sold

  }, [transactions, products, sortedPurchases, isLoaded]);
  
  const totals = useMemo(() => {
    return reportData.reduce((acc, curr) => {
        acc.totalRevenue += curr.totalRevenue;
        acc.totalCost += curr.totalCost;
        acc.totalProfit += curr.totalProfit;
        return acc;
    }, { totalRevenue: 0, totalCost: 0, totalProfit: 0 });
  }, [reportData]);

  return (
    <div className="p-4 md:p-8 watermark-container">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Percent /> Product Profit Margin Report
              </CardTitle>
              <CardDescription>
                A breakdown of profit margins for each product sold.
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
                <TableHead className="text-right">Qty Sold</TableHead>
                <TableHead className="text-right">Total Revenue</TableHead>
                <TableHead className="text-right">Total Cost</TableHead>
                <TableHead className="text-right">Total Profit</TableHead>
                <TableHead className="text-right">Profit Margin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoaded ? (
                reportData.length > 0 ? (
                  reportData.map(product => (
                    <TableRow key={product.productName}>
                      <TableCell className="font-medium">{product.productName}</TableCell>
                      <TableCell className="text-right font-mono">{product.totalQuantitySold.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-right font-mono">{product.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-right font-mono text-destructive">{product.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-right font-mono font-semibold text-green-600">{product.totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-right font-mono font-bold">{product.profitMargin.toFixed(2)}%</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No sales data available to calculate profit margins.
                    </TableCell>
                  </TableRow>
                )
              ) : (
                 Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell colSpan={6} className="h-12 text-center">Loading report data...</TableCell>
                    </TableRow>
                ))
              )}
            </TableBody>
            {isLoaded && reportData.length > 0 && (
                <TableFooter>
                    <TableRow className="font-bold bg-muted/50">
                        <TableCell colSpan={2}>Totals</TableCell>
                        <TableCell className="text-right font-mono">{totals.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        <TableCell className="text-right font-mono text-destructive">{totals.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        <TableCell className="text-right font-mono text-green-600">{totals.totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        <TableCell/>
                    </TableRow>
                </TableFooter>
            )}
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
