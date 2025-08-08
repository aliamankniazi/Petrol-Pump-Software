
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, BarChart2, BookOpen, DollarSign, PlusCircle, TrendingDown, TrendingUp, Users, Fuel, Droplets, Receipt, ShoppingCart } from 'lucide-react';
import { useTransactions } from '@/hooks/use-transactions';
import { usePurchases } from '@/hooks/use-purchases';
import { useExpenses } from '@/hooks/use-expenses';
import { useOtherIncomes } from '@/hooks/use-other-incomes';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import { Progress } from '@/components/ui/progress';
import { useProducts } from '@/hooks/use-products';

const chartConfig = {
  sales: {
    label: "Sales",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

type RecentActivity = {
  id: string;
  type: 'Sale' | 'Purchase' | 'Expense';
  description: string;
  amount: number;
  timestamp: string;
  icon: React.ElementType;
  color: string;
}

export default function DashboardPage() {
    const { transactions, isLoaded: transactionsLoaded } = useTransactions();
    const { purchases, isLoaded: purchasesLoaded } = usePurchases();
    const { expenses, isLoaded: expensesLoaded } = useExpenses();
    const { otherIncomes, isLoaded: otherIncomesLoaded } = useOtherIncomes();
    const { products, isLoaded: stockLoaded } = useProducts();

    const isLoaded = transactionsLoaded && purchasesLoaded && expensesLoaded && otherIncomesLoaded && stockLoaded;

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
    
    const salesByDay = useMemo(() => {
        const salesMap = new Map<string, number>();
        transactions.forEach(tx => {
            const day = format(new Date(tx.timestamp!), 'yyyy-MM-dd');
            salesMap.set(day, (salesMap.get(day) || 0) + tx.totalAmount);
        });
        
        const sortedDays = Array.from(salesMap.keys()).sort((a,b) => new Date(a).getTime() - new Date(b).getTime()).slice(-7);
        
        return sortedDays.map(day => ({
            date: format(new Date(day), 'MMM d'),
            sales: salesMap.get(day) || 0,
        }));

    }, [transactions]);
    
    const recentActivity = useMemo((): RecentActivity[] => {
        const sales: RecentActivity[] = transactions.slice(0, 3).map(tx => ({
            id: `sale-${tx.id}`,
            type: 'Sale',
            description: `${tx.customerName || 'Walk-in'} - ${tx.items.length} item(s)`,
            amount: tx.totalAmount,
            timestamp: tx.timestamp!,
            icon: Fuel,
            color: 'text-green-500',
        }));

        const recentPurchases: RecentActivity[] = purchases.slice(0, 2).map(p => ({
            id: `purchase-${p.id}`,
            type: 'Purchase',
            description: `From ${p.supplier} - ${p.items.length} item(s)`,
            amount: -p.totalCost,
            timestamp: p.timestamp!,
            icon: ShoppingCart,
            color: 'text-blue-500',
        }));

        const recentExpenses: RecentActivity[] = expenses.slice(0, 2).map(ex => ({
            id: `expense-${ex.id}`,
            type: 'Expense',
            description: `${ex.category} - ${ex.description}`,
            amount: -ex.amount,
            timestamp: ex.timestamp!,
            icon: Receipt,
            color: 'text-red-500',
        }));

        return [...sales, ...recentPurchases, ...recentExpenses]
            .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 5);
    }, [transactions, purchases, expenses]);


    return (
        <div className="p-4 md:p-8 space-y-8 bg-muted/40 min-h-full">
            <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">A quick overview of your business performance.</p>
                </div>
                <Button asChild>
                    <Link href="/"><PlusCircle/> New Sale</Link>
                </Button>
            </header>
            
            {/* Stat Cards */}
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
                                <p className="text-xs text-muted-foreground">+20.1% from last month</p>
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
                                <p className="text-xs text-muted-foreground">After all costs & expenses</p>
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
            
            <div className="grid gap-8 lg:grid-cols-3">
                {/* Sales Chart */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Sales - Last 7 Days</CardTitle>
                        <CardDescription>A look at your daily sales revenue.</CardDescription>
                    </CardHeader>
                     <CardContent>
                        {isLoaded ? (
                             <ChartContainer config={chartConfig} className="h-[250px] w-full">
                                <AreaChart accessibilityLayer data={salesByDay} margin={{left: -20, right: 10, top: 10, bottom: 0}}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        tickLine={false}
                                        tickMargin={10}
                                        axisLine={false}
                                        tickFormatter={(value) => value.slice(0, 3)}
                                    />
                                    <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                                    <defs>
                                        <linearGradient id="fillSales" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--color-sales)" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="var(--color-sales)" stopOpacity={0.1} />
                                        </linearGradient>
                                    </defs>
                                    <Area dataKey="sales" type="natural" fill="url(#fillSales)" fillOpacity={0.4} stroke="var(--color-sales)" stackId="a" />
                                </AreaChart>
                            </ChartContainer>
                        ) : <Skeleton className="h-[250px] w-full" />}
                     </CardContent>
                </Card>
                
                {/* Fuel Stock */}
                <Card>
                    <CardHeader>
                        <CardTitle>Fuel Inventory</CardTitle>
                        <CardDescription>Current stock levels.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {isLoaded ? (products.filter(p => p.category === 'Fuel').map(fuel => {
                            const currentStock = fuel.stock || 0;
                            const maxStock = 25000;
                            const percentage = Math.min((currentStock/maxStock) * 100, 100);
                            return (
                                <div key={fuel.id}>
                                    <div className="flex justify-between items-baseline mb-1">
                                        <span className="text-sm font-medium">{fuel.name}</span>
                                        <span className="text-xs text-muted-foreground">{currentStock.toLocaleString(undefined, {maximumFractionDigits: 0})} / {maxStock.toLocaleString()} L</span>
                                    </div>
                                    <Progress value={percentage} className="h-2" />
                                </div>
                            )
                        })) : Array.from({length: 3}).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                    </CardContent>
                </Card>
            </div>
            
            {/* Recent Activity */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>A feed of your latest transactions.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {isLoaded ? recentActivity.length > 0 ? recentActivity.map(item => (
                            <div key={item.id} className="flex items-center gap-4">
                                <div className="p-2 bg-muted rounded-full">
                                    <item.icon className={`w-5 h-5 ${item.color}`} />
                                </div>
                                <div className="flex-grow">
                                    <p className="font-medium">{item.type}</p>
                                    <p className="text-sm text-muted-foreground truncate">{item.description}</p>
                                </div>
                                <div className="text-right">
                                    <p className={`font-mono font-semibold ${item.amount > 0 ? 'text-green-600' : 'text-destructive'}`}>
                                       {item.amount > 0 ? '+' : ''}PKR {item.amount.toLocaleString(undefined, {maximumFractionDigits: 0})}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}</p>
                                </div>
                            </div>
                        )) : (
                            <p className="text-center text-muted-foreground py-8">No recent activity.</p>
                        ) : (
                            Array.from({length: 5}).map((_, i) => <div key={i} className="flex items-center gap-4"><Skeleton className="w-10 h-10 rounded-full" /><div className="flex-grow space-y-2"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-4 w-3/4" /></div><Skeleton className="h-6 w-1/5" /></div>)
                        )}
                    </div>
                </CardContent>
                <CardFooter>
                    <Button asChild variant="secondary" className="w-full">
                        <Link href="/all-transactions">View All Transactions <ArrowRight className="ml-2 h-4 w-4"/></Link>
                    </Button>
                </CardFooter>
            </Card>

        </div>
    );
}
