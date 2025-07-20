
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, BarChart2, BookOpen, DollarSign, PlusCircle, TrendingDown, TrendingUp, Users } from 'lucide-react';
import { useTransactions } from '@/hooks/use-transactions';
import { usePurchases } from '@/hooks/use-purchases';
import { useExpenses } from '@/hooks/use-expenses';
import { useOtherIncomes } from '@/hooks/use-other-incomes';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';

const chartConfig = {
  sales: {
    label: "Sales",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;


export default function DashboardPage() {
    const { transactions, isLoaded: transactionsLoaded } = useTransactions();
    const { purchases, isLoaded: purchasesLoaded } = usePurchases();
    const { expenses, isLoaded: expensesLoaded } = useExpenses();
    const { otherIncomes, isLoaded: otherIncomesLoaded } = useOtherIncomes();

    const isLoaded = transactionsLoaded && purchasesLoaded && expensesLoaded && otherIncomesLoaded;

    const financialSummary = useMemo(() => {
        if (!isLoaded) return null;

        const totalRevenue = transactions.reduce((sum, tx) => sum + tx.totalAmount, 0) + otherIncomes.reduce((sum, oi) => sum + oi.amount, 0);
        const totalCostOfGoods = purchases.reduce((sum, p) => sum + p.totalCost, 0);
        const totalExpenses = expenses.reduce((sum, ex) => sum + ex.amount, 0);
        const netProfit = totalRevenue - totalCostOfGoods - totalExpenses;
        const totalCustomers = new Set(transactions.map(tx => tx.customerId).filter(Boolean)).size;

        return {
            totalRevenue,
            netProfit,
            totalExpenses,
            totalCustomers,
        };
    }, [isLoaded, transactions, purchases, expenses, otherIncomes]);
    
    const recentTransactions = useMemo(() => {
        return transactions.slice(0, 5);
    }, [transactions]);
    
    const salesByDay = useMemo(() => {
        const salesMap = new Map<string, number>();
        transactions.forEach(tx => {
            const day = format(new Date(tx.timestamp), 'yyyy-MM-dd');
            salesMap.set(day, (salesMap.get(day) || 0) + tx.totalAmount);
        });
        
        const sortedDays = Array.from(salesMap.keys()).sort((a,b) => new Date(a).getTime() - new Date(b).getTime()).slice(-7);
        
        return sortedDays.map(day => ({
            date: format(new Date(day), 'MMM d'),
            sales: salesMap.get(day) || 0,
        }));

    }, [transactions]);

    return (
        <div className="p-4 md:p-8 space-y-8">
            <header>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">Welcome back! Here's a quick overview of your business.</p>
            </header>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {isLoaded && financialSummary ? (
                    <>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">PKR {financialSummary.totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</div>
                                <p className="text-xs text-muted-foreground">From all sales and incomes</p>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className={`text-2xl font-bold ${financialSummary.netProfit >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                                    PKR {financialSummary.netProfit.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                                </div>
                                <p className="text-xs text-muted-foreground">After all costs and expenses</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                                <TrendingDown className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">PKR {financialSummary.totalExpenses.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</div>
                                <p className="text-xs text-muted-foreground">Operational and other costs</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{financialSummary.totalCustomers}</div>
                                <p className="text-xs text-muted-foreground">Customers with recorded sales</p>
                            </CardContent>
                        </Card>
                    </>
                ) : (
                   Array.from({length: 4}).map((_, i) => <Skeleton key={i} className="h-[126px]" />)
                )}
            </div>
            
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
                <Card className="lg:col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Sales</CardTitle>
                        <CardDescription>
                            Here are the last 5 sales transactions.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoaded ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Fuel</TableHead>
                                        <TableHead className="text-right">Volume</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recentTransactions.length > 0 ? recentTransactions.map(tx => (
                                        <TableRow key={tx.id}>
                                            <TableCell>
                                                <div className="font-medium">{tx.customerName || "Walk-in"}</div>
                                                <div className="text-xs text-muted-foreground">{format(new Date(tx.timestamp), 'PP p')}</div>
                                            </TableCell>
                                            <TableCell><Badge variant="outline">{tx.fuelType}</Badge></TableCell>
                                            <TableCell className="text-right">{tx.volume.toFixed(2)} L</TableCell>
                                            <TableCell className="text-right font-mono">PKR {tx.totalAmount.toLocaleString()}</TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center h-24">No sales recorded yet.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        ) : <Skeleton className="h-48 w-full" />}
                    </CardContent>
                </Card>
                
                 <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Sales - Last 7 Days</CardTitle>
                        <CardDescription>A look at your daily sales revenue.</CardDescription>
                    </CardHeader>
                     <CardContent>
                        {isLoaded ? (
                             <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                                <BarChart accessibilityLayer data={salesByDay}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        tickLine={false}
                                        tickMargin={10}
                                        axisLine={false}
                                        tickFormatter={(value) => value.slice(0, 3)}
                                    />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Bar dataKey="sales" fill="var(--color-sales)" radius={4} />
                                </BarChart>
                            </ChartContainer>
                        ) : <Skeleton className="h-[248px] w-full" />}
                     </CardContent>
                </Card>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Jump to common tasks with a single click.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
                        <Link href="/">
                            <PlusCircle className="w-6 h-6 text-primary" />
                            <span className="font-semibold">New Sale</span>
                        </Link>
                    </Button>
                     <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
                        <Link href="/customers">
                            <Users className="w-6 h-6 text-primary" />
                            <span className="font-semibold">Add Customer</span>
                        </Link>
                    </Button>
                     <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
                        <Link href="/expenses">
                            <TrendingDown className="w-6 h-6 text-primary" />
                            <span className="font-semibold">Add Expense</span>
                        </Link>
                    </Button>
                     <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
                        <Link href="/ledger">
                            <BookOpen className="w-6 h-6 text-primary" />
                            <span className="font-semibold">View Ledger</span>
                        </Link>
                    </Button>
                </CardContent>
            </Card>

        </div>
    );
}
