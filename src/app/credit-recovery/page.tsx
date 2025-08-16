

'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCustomers } from '@/hooks/use-customers';
import { useTransactions } from '@/hooks/use-transactions';
import { useCustomerPayments } from '@/hooks/use-customer-payments';
import { useCashAdvances } from '@/hooks/use-cash-advances';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, FileText, Printer, Search, LayoutDashboard, ChevronsUpDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Customer } from '@/lib/types';
import Link from 'next/link';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useGlobalDate } from '@/hooks/use-global-date';


const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      aria-hidden="true"
      fill="currentColor"
      viewBox="0 0 448 512"
      {...props}
    >
      <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 .9c34.9 0 67.7 13.5 92.8 38.6 25.1 25.1 38.6 57.9 38.6 92.8 0 97.8-79.7 177.6-177.6 177.6-34.9 0-67.7-13.5-92.8-38.6s-38.6-57.9-38.6-92.8c0-97.8 79.7-177.6 177.6-177.6zm93.8 148.6c-3.3-1.5-19.8-9.8-23-11.5s-5.5-2.5-7.8 2.5c-2.3 5-8.7 11.5-10.7 13.8s-3.9 2.5-7.3 1c-3.3-1.5-14-5.2-26.6-16.5c-9.9-8.9-16.5-19.8-18.5-23s-2-5.5-.6-7.5c1.4-2 3-3.3 4.5-5.2s3-4.2 4.5-7.1c1.5-2.8.8-5.2-.4-6.8s-7.8-18.5-10.7-25.4c-2.8-6.8-5.6-5.8-7.8-5.8s-4.5-.4-6.8-.4-7.8 1.1-11.8 5.5c-4 4.4-15.2 14.8-15.2 36.1s15.5 41.9 17.5 44.8c2 2.8 30.4 46.4 73.8 65.4 10.8 4.8 19.3 7.6 25.9 9.8s11.1 1.5 15.2 1c4.8-.7 19.8-8.2 22.5-16.1s2.8-14.8 2-16.1c-.8-1.5-3.3-2.5-6.8-4z"></path>
    </svg>
);


interface ReportRow {
    id: string;
    customer: Customer;
    previousBalance: number;
    sale: number;
    recovery: number;
    currentBalance: number;
}

export default function CreditRecoveryPage() {
    const { customers, isLoaded: customersLoaded } = useCustomers();
    const { transactions, isLoaded: txLoaded } = useTransactions();
    const { customerPayments, isLoaded: paymentsLoaded } = useCustomerPayments();
    const { cashAdvances, isLoaded: advancesLoaded } = useCashAdvances();
    const { globalDateRange, setGlobalDateRange } = useGlobalDate();

    const [selectedCustomerId, setSelectedCustomerId] = useState('all');
    
    const [searchTerm, setSearchTerm] = useState('');
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    const isDataLoaded = customersLoaded && txLoaded && paymentsLoaded && advancesLoaded;

    const reportData = useMemo(() => {
        if (!isDataLoaded) return [];

        let targetCustomers = customers;
        if (selectedCustomerId !== 'all') {
            targetCustomers = customers.filter(c => c.id === selectedCustomerId);
        }

        const report: ReportRow[] = targetCustomers.map(customer => {
            const rangeStart = globalDateRange?.from ? startOfDay(globalDateRange.from) : new Date(0);
            const rangeEnd = globalDateRange?.to ? endOfDay(globalDateRange.to) : new Date();

            // Calculate Previous Balance
            const prevTx = transactions.filter(tx => tx.customerId === customer.id && new Date(tx.timestamp!) < rangeStart);
            const prevPayments = customerPayments.filter(p => p.customerId === customer.id && new Date(p.timestamp!) < rangeStart);
            const prevAdvances = cashAdvances.filter(ca => ca.customerId === customer.id && new Date(ca.timestamp!) < rangeStart);
            
            const prevDebit = prevTx.reduce((sum, tx) => sum + tx.totalAmount, 0) + prevAdvances.reduce((sum, ca) => sum + ca.amount, 0);
            const prevCredit = prevPayments.reduce((sum, p) => sum + p.amount, 0);
            const previousBalance = prevDebit - prevCredit;
            
            // Calculate Sale and Recovery in date range
            const rangeTx = transactions.filter(tx => tx.customerId === customer.id && new Date(tx.timestamp!) >= rangeStart && new Date(tx.timestamp!) <= rangeEnd);
            const rangePayments = customerPayments.filter(p => p.customerId === customer.id && new Date(p.timestamp!) >= rangeStart && new Date(p.timestamp!) <= rangeEnd);
            const rangeAdvances = cashAdvances.filter(ca => ca.customerId === customer.id && new Date(ca.timestamp!) >= rangeStart && new Date(ca.timestamp!) <= rangeEnd);

            const sale = rangeTx.reduce((sum, tx) => sum + tx.totalAmount, 0) + rangeAdvances.reduce((sum, ca) => sum + ca.amount, 0);
            const recovery = rangePayments.reduce((sum, p) => sum + p.amount, 0);
            
            const currentBalance = previousBalance + sale - recovery;

            return {
                id: customer.id!,
                customer,
                previousBalance,
                sale,
                recovery,
                currentBalance,
            };
        });

        return report.sort((a,b) => a.customer.name.localeCompare(b.customer.name));

    }, [customers, transactions, customerPayments, cashAdvances, isDataLoaded, selectedCustomerId, globalDateRange]);
    
    const filteredReportData = useMemo(() => {
        if (!searchTerm) return reportData;
        return reportData.filter(row => 
            row.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            row.customer.contact?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [reportData, searchTerm]);

    const formatPhoneNumberForWhatsApp = (phone: string) => {
        return phone.replace(/[^0-9]/g, '');
    }
    
    const generateWhatsAppMessage = (row: ReportRow) => {
        const message = `As-Salaam-Alaikum,
Dear ${row.customer.name},
Your Previous Amount: ${row.previousBalance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
New Sale Amount: ${row.sale.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
Paid Amount: ${row.recovery.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
Now your balance is: ${row.currentBalance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
Thank You,
Mianwali Petroleum Service`;
        return encodeURIComponent(message);
    }


    return (
        <div className="p-4 md:p-8 space-y-6 watermark-container">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start print:hidden">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <FileText /> Customer Credit Recovery Report
                            </CardTitle>
                            <CardDescription>
                                View sales, recoveries, and balances for customers within a specific date range.
                            </CardDescription>
                        </div>
                        <Button asChild variant="outline">
                            <Link href="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" /> Go to Dashboard</Link>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="bg-muted p-4 rounded-lg flex flex-col md:flex-row items-center gap-4 print:hidden">
                        <div className="w-full md:w-auto flex-1">
                            <label className="text-sm font-medium">Customer</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                    variant="outline"
                                    role="combobox"
                                    className="w-full justify-between"
                                    >
                                    {selectedCustomerId !== 'all' && customersLoaded
                                        ? customers.find((c) => c.id === selectedCustomerId)?.name
                                        : "All Customers"}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                    <Command>
                                        <CommandInput placeholder="Search customer..."/>
                                        <CommandList>
                                            <CommandEmpty>No customer found.</CommandEmpty>
                                            <CommandGroup>
                                            <CommandItem value="all" onSelect={() => setSelectedCustomerId('all')}>
                                                <Check className={cn("mr-2 h-4 w-4", selectedCustomerId === 'all' ? "opacity-100" : "opacity-0")}/>
                                                All Customers
                                            </CommandItem>
                                            {customers.map((c) => (
                                                <CommandItem
                                                key={c.id}
                                                value={c.name}
                                                onSelect={() => {
                                                    setSelectedCustomerId(c.id! === selectedCustomerId ? "all" : c.id!)
                                                }}
                                                >
                                                <Check
                                                    className={cn(
                                                    "mr-2 h-4 w-4",
                                                    selectedCustomerId === c.id ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                {c.name}
                                                </CommandItem>
                                            ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                         <div className="w-full md:w-auto flex-1">
                            <label className="text-sm font-medium">Date Range</label>
                            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        id="date"
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !globalDateRange && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {globalDateRange?.from ? (
                                            globalDateRange.to ? (
                                                <>
                                                    {format(globalDateRange.from, "LLL dd, y")} -{" "}
                                                    {format(globalDateRange.to, "LLL dd, y")}
                                                </>
                                            ) : (
                                                format(globalDateRange.from, "LLL dd, y")
                                            )
                                        ) : (
                                            <span>Pick a date</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        initialFocus
                                        mode="range"
                                        defaultMonth={globalDateRange?.from}
                                        selected={globalDateRange}
                                        onSelect={(range) => {
                                            setGlobalDateRange(range);
                                            if (range?.from && range.to) {
                                                setIsCalendarOpen(false);
                                            }
                                        }}
                                        numberOfMonths={2}
                                        withQuickActions
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <Button className="w-full md:w-auto self-end"><Search className="mr-2 h-4 w-4" /> Search</Button>
                    </div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="relative w-full max-w-sm print:hidden">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search records..." 
                                className="pl-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 print:hidden">
                            <Button variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" /> Print</Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]">No</TableHead>
                                    <TableHead>Customer Name/Code</TableHead>
                                    <TableHead>Area</TableHead>
                                    <TableHead>Mobile</TableHead>
                                    <TableHead className="text-right font-bold">Previous Balance</TableHead>
                                    <TableHead className="text-right font-bold">Sale</TableHead>
                                    <TableHead className="text-right font-bold">Recovery Amount</TableHead>
                                    <TableHead className="text-right font-bold">Current Balance</TableHead>
                                    <TableHead className="text-center print:hidden">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isDataLoaded && filteredReportData.map((row, index) => (
                                    <TableRow key={row.id}>
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell className="font-medium">{row.customer.name}</TableCell>
                                        <TableCell>{row.customer.area || 'N/A'}</TableCell>
                                        <TableCell>{row.customer.contact}</TableCell>
                                        <TableCell className="text-right font-mono font-bold">{row.previousBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                        <TableCell className="text-right font-mono font-bold text-destructive">{row.sale.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                        <TableCell className="text-right font-mono font-bold text-green-600">{row.recovery.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                        <TableCell className={`text-right font-bold font-mono ${row.currentBalance < 0 ? 'text-green-600' : 'text-destructive'}`}>
                                            {row.currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell className="text-center print:hidden">
                                            {row.customer.contact && (
                                                <Button asChild variant="ghost" size="icon" className="text-green-500 hover:text-green-600" title={`Message ${row.customer.name} on WhatsApp`}>
                                                    <a 
                                                        href={`https://wa.me/${formatPhoneNumberForWhatsApp(row.customer.contact)}?text=${generateWhatsAppMessage(row)}`}
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                    >
                                                        <WhatsAppIcon className="w-5 h-5" />
                                                    </a>
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    {!isDataLoaded && <p className="text-center p-8 text-muted-foreground">Loading report data...</p>}
                    {isDataLoaded && filteredReportData.length === 0 && <p className="text-center p-8 text-muted-foreground">No matching records found.</p>}
                </CardContent>
             </Card>
        </div>
    );
}
