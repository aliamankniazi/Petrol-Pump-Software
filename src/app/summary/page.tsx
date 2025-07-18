'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTransactions } from '@/hooks/use-transactions';
import { generateSalesSummary } from '@/ai/flows/generate-sales-summary';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FileText, Sparkles, Terminal, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { isToday } from 'date-fns';

export default function SummaryPage() {
  const { transactions, isLoaded } = useTransactions();
  const [summary, setSummary] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

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
    <div className="p-4 md:p-8">
      <Card className="min-h-[60vh] flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText /> Sales Summary
          </CardTitle>
          <CardDescription>
            Use AI to generate a summary of today's sales transactions.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col gap-4">
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
