'use client';

import { useState, useTransition, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTransactions } from '@/hooks/use-transactions';
import { usePurchases } from '@/hooks/use-purchases';
import { useExpenses } from '@/hooks/use-expenses';
import { generateSalesSummary } from '@/ai/flows/generate-sales-summary';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FileText, Sparkles, Terminal, AlertTriangle, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { isToday } from 'date-fns';
import { Separator } from '@/components/ui/separator';

export default function SummaryPage() {
  const { transactions, isLoaded: transactionsLoaded } = useTransactions();
  const { purchases, isLoaded: purchasesLoaded } = usePurchases();
  const { expenses, isLoaded: expensesLoaded } = useExpenses();

  const [summary, setSummary] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const isLoaded = transactionsLoaded && purchasesLoaded && expensesLoaded;

  const financialSummary = useMemo(() => {
    if (!isLoaded) return null;

    const totalRevenue = transactions.reduce((sum, tx) => sum + tx.totalAmount, 0);
    const totalExpenses = expenses.reduce((sum, ex) => sum + ex.amount, 0);
    const totalCostOfGoods = purchases.reduce((sum, p) => sum + p.totalCost, 0);

    // This is a simplified profit calculation. A more accurate one would
    // calculate COGS based on inventory sold, not all purchases.
    const grossProfit = totalRevenue - totalCostOfGoods;
    const netProfit = grossProfit - totalExpenses;

    return {
      totalRevenue,
      totalExpenses,
      totalCostOfGoods,
      grossProfit,
      netProfit,
    };
  }, [transactions, purchases, expenses, isLoaded]);

  const handleGenerateSummary = () => {
    setError('');
    setSummary('');
    startTransition(async () => {
      try {
        const todayTransactions = transactions.filter(tx => isToday(new Date(tx.timestamp)));
        if (todayTransactions.length === 0) {
          setError("No sales recorded today to generate a summary.");
          return;
        }

        const result = await generateSalesSummary({
          dailySalesData: JSON.stringify(todayTransactions),
        });
        setSummary(result.summary);
      } catch (e) {
        console.error(e);
        setError('Failed to generate summary. Please try again later.');
      }
    });
  };
  
  const hasTodayTransactions = isLoaded && transactions.some(tx => isToday(new Date(tx.timestamp)));

  return (
    <div className="p-4 md:p-8 space-y-8">
      <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign /> Financial Report
            </CardTitle>
            <CardDescription>An overview of your business's financial performance.</CardDescription>
          </CardHeader>
          <CardContent>
            {!isLoaded ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-8 w-2/3" />
              </div>
            ) : financialSummary ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                 <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">PKR {financialSummary.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <p className="text-xs text-muted-foreground">From all sales transactions</p>
                  </CardContent>
                </Card>
                 <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Gross Profit</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">PKR {financialSummary.grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <p className="text-xs text-muted-foreground">Revenue minus cost of goods</p>
                  </CardContent>
                </Card>
                 <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${financialSummary.netProfit >= 0 ? 'text-primary' : 'text-destructive'}`}>
                      PKR {financialSummary.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <p className="text-xs text-muted-foreground">After all expenses and costs</p>
                  </CardContent>
                </Card>
                 <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Cost of Goods</CardTitle>
                    <TrendingDown className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">PKR {financialSummary.totalCostOfGoods.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <p className="text-xs text-muted-foreground">From all fuel purchases</p>
                  </CardContent>
                </Card>
                 <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Operating Expenses</CardTitle>
                    <TrendingDown className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">PKR {financialSummary.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <p className="text-xs text-muted-foreground">From all expense entries</p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <p>No data available to generate a financial report.</p>
            )}
          </CardContent>
        </Card>

      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText /> Daily Sales AI Summary
          </CardTitle>
          <CardDescription>
            Use AI to generate a summary of today's sales transactions.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col gap-4 min-h-[200px]">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isPending ? (
            <div className="space-y-4">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : summary ? (
            <div className="prose prose-sm sm:prose-base dark:prose-invert bg-muted/50 p-6 rounded-lg">
              <p>{summary}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 text-center text-muted-foreground flex-grow p-8 border-2 border-dashed rounded-lg">
              <Sparkles className="w-16 h-16" />
              <h3 className="text-xl font-semibold">Ready to Analyze</h3>
              <p>Click the button below to generate a summary of today's sales.</p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={handleGenerateSummary} disabled={isPending || !hasTodayTransactions}>
            {isPending ? 'Generating...' : 'Generate Daily Summary'}
          </Button>
           {!isLoaded && <p className="text-sm text-muted-foreground ml-4">Loading transactions...</p>}
           {isLoaded && !hasTodayTransactions && <p className="text-sm text-muted-foreground ml-4">No sales data for today.</p>}
        </CardFooter>
      </Card>
    </div>
  );
}
