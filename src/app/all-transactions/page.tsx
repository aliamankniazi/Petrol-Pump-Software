

'use client';

import { useMemo, useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, startOfDay, endOfDay } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Archive, XCircle, Printer, Trash2, AlertTriangle, LayoutDashboard, Calendar as CalendarIcon, X } from 'lucide-react';
import { useTransactions } from '@/hooks/use-transactions';
import { usePurchases } from '@/hooks/use-purchases';
import { usePurchaseReturns } from '@/hooks/use-purchase-returns';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useCustomers } from '@/hooks/use-customers';
import type { Customer, Purchase, PurchaseReturn, Transaction } from '@/lib/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGlobalDate } from '@/hooks/use-global-date';


type CombinedEntry = {
  id: string;
  originalId: string;
  timestamp: string;
  type: 'Sale' | 'Purchase' | 'Purchase Return';
  partner: string;
  details: string;
  notes?: string;
  amount: number;
  original: Transaction | Purchase | PurchaseReturn;
};

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


export default function AllTransactionsPage() {
  const { transactions, deleteTransaction, isLoaded: transactionsLoaded } = useTransactions();
  const { purchases, deletePurchase, isLoaded: purchasesLoaded } = usePurchases();
  const { purchaseReturns, deletePurchaseReturn, isLoaded: purchaseReturnsLoaded } = usePurchaseReturns();
  const { customers, isLoaded: customersLoaded } = useCustomers();
  const [searchTerm, setSearchTerm] = useState('');
  const [entryToDelete, setEntryToDelete] = useState<CombinedEntry | null>(null);
  const { toast } = useToast();
  
  const { globalDateRange, setGlobalDateRange } = useGlobalDate();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const [typeFilter, setTypeFilter] = useState('all');

  const isLoaded = transactionsLoaded && purchasesLoaded && purchaseReturnsLoaded && customersLoaded;

  const combinedEntries = useMemo(() => {
    if (!isLoaded) return [];

    const sales: CombinedEntry[] = transactions
      .filter(tx => tx.timestamp)
      .map(tx => ({
        id: `sale-${tx.id}`,
        originalId: tx.id!,
        timestamp: tx.timestamp!,
        type: 'Sale',
        partner: tx.customerName || 'Walk-in Customer',
        details: tx.items.map(item => `${item.quantity.toFixed(2)} units of ${item.productName}`).join(', '),
        notes: tx.notes,
        amount: tx.totalAmount,
        original: tx,
      }));

    const allPurchases: CombinedEntry[] = purchases
      .filter(p => p.timestamp)
      .map(p => ({
        id: `purchase-${p.id}`,
        originalId: p.id!,
        timestamp: p.timestamp!,
        type: 'Purchase',
        partner: p.supplier,
        details: p.items.map(item => `${item.quantity.toFixed(2)} units of ${item.productName}`).join(', '),
        notes: p.notes,
        amount: p.totalCost,
        original: p,
      }));

    const returns: CombinedEntry[] = purchaseReturns
      .filter(pr => pr.timestamp)
      .map(pr => ({
        id: `return-${pr.id}`,
        originalId: pr.id!,
        timestamp: pr.timestamp!,
        type: 'Purchase Return',
        partner: pr.supplier,
        details: `${pr.volume.toFixed(2)} units of ${pr.productName}`,
        notes: pr.reason,
        amount: pr.totalRefund,
        original: pr,
      }));

    return [...sales, ...allPurchases, ...returns].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [isLoaded, transactions, purchases, purchaseReturns]);

  const filteredEntries = useMemo(() => {
    return combinedEntries.filter(entry => {
      
      if (globalDateRange?.from) {
          const entryDate = new Date(entry.timestamp);
          const from = startOfDay(globalDateRange.from);
          const to = globalDateRange.to ? endOfDay(globalDateRange.to) : endOfDay(globalDateRange.from);
          if (entryDate < from || entryDate > to) {
              return false;
          }
      }

      if (typeFilter !== 'all' && entry.type !== typeFilter) {
          return false;
      }

      if (!searchTerm) {
          return true;
      }

      const searchLower = searchTerm.toLowerCase();
      return (
        entry.partner.toLowerCase().includes(searchLower) ||
        entry.type.toLowerCase().includes(searchLower) ||
        entry.details.toLowerCase().includes(searchLower) ||
        (entry.notes && entry.notes.toLowerCase().includes(searchLower))
      );
    });
  }, [combinedEntries, searchTerm, globalDateRange, typeFilter]);

  const getBadgeVariant = (type: CombinedEntry['type']) => {
    switch (type) {
      case 'Sale': return 'outline';
      case 'Purchase': return 'destructive';
      case 'Purchase Return': return 'secondary';
      default: return 'default';
    }
  };
  
  const getAmountClass = (type: CombinedEntry['type']) => {
      switch(type) {
          case 'Sale': return 'text-green-600';
          case 'Purchase': return 'text-destructive';
          case 'Purchase Return': return 'text-blue-600';
          default: return '';
      }
  }

  const formatPhoneNumberForWhatsApp = (phone: string) => {
    return phone.replace(/[^0-9]/g, '');
  }

  const getCustomerForEntry = useCallback((entry: CombinedEntry): Customer | undefined => {
      if (entry.type === 'Sale' && 'customerId' in entry.original && entry.original.customerId) {
          return customers.find(c => c.id === entry.original.customerId);
      }
      return undefined;
  }, [customers]);
  
  const handleDeleteEntry = useCallback(() => {
    if (!entryToDelete) return;
    
    try {
        switch(entryToDelete.type) {
            case 'Sale': deleteTransaction(entryToDelete.originalId); break;
            case 'Purchase': deletePurchase(entryToDelete.originalId); break;
            case 'Purchase Return': deletePurchaseReturn(entryToDelete.originalId); break;
            default:
                throw new Error('Could not delete entry of unknown type.');
        }

        toast({
            title: 'Entry Deleted',
            description: `The ${entryToDelete.type} entry for ${entryToDelete.partner} has been successfully deleted.`,
        });
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: error.message || "An error occurred while deleting the entry.",
        });
    } finally {
        setEntryToDelete(null);
    }
  }, [entryToDelete, deleteTransaction, deletePurchase, deletePurchaseReturn, toast]);


  return (
    <>
    <div className="p-4 md:p-8">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
                <CardTitle className="flex items-center gap-2">
                    <Archive /> All Transactions
                </CardTitle>
                <CardDescription>A unified record of all sales, purchases, and returns.</CardDescription>
            </div>
            <div className='flex flex-wrap items-center justify-end gap-2'>
                 <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by type..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="Sale">Sale</SelectItem>
                        <SelectItem value="Purchase">Purchase</SelectItem>
                        <SelectItem value="Purchase Return">Purchase Return</SelectItem>
                    </SelectContent>
                 </Select>
                 <Input 
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-xs"
                />
                 <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            id="date"
                            variant={"outline"}
                            className={cn(
                                "w-[280px] justify-start text-left font-normal",
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
                                <span>Pick a date range</span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
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
                 {(globalDateRange || typeFilter !== 'all') && (
                    <Button variant="ghost" size="icon" onClick={() => { setGlobalDateRange(undefined); setTypeFilter('all'); }}>
                        <X className="h-4 w-4" />
                    </Button>
                 )}
                <Button asChild variant="outline">
                    <Link href="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" /> Go to Dashboard</Link>
                </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoaded ? (
            filteredEntries.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Partner</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Amount (PKR)</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map(entry => {
                    const customer = getCustomerForEntry(entry);
                    const isPrintable = entry.type === 'Sale' || entry.type === 'Purchase';
                    return (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium whitespace-nowrap">
                        {format(new Date(entry.timestamp), 'PP pp')}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={getBadgeVariant(entry.type)}
                          className={cn(entry.type === 'Sale' && 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700')}
                        >{entry.type}</Badge>
                      </TableCell>
                      <TableCell>{entry.partner}</TableCell>
                      <TableCell>{entry.details}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{entry.notes || 'N/A'}</TableCell>
                      <TableCell className={cn("text-right font-bold font-mono", getAmountClass(entry.type))}>
                          {entry.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-center">
                          <div className="flex justify-center items-center">
                              {isPrintable && (
                                <a href={`/invoice/${entry.type.toLowerCase().replace(' ', '')}/${entry.originalId}`} target="_blank" rel="noopener noreferrer">
                                  <Button variant="ghost" size="icon" title="Print Invoice">
                                    <Printer className="w-4 h-4" />
                                  </Button>
                                </a>
                              )}
                              {entry.type === 'Sale' && customer?.contact && (
                                  <Button asChild variant="ghost" size="icon" className="text-green-500 hover:text-green-600 shrink-0" title={`Message ${customer.name} on WhatsApp`}>
                                      <a 
                                      href={`https://wa.me/${formatPhoneNumberForWhatsApp(customer.contact)}`}
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      >
                                      <WhatsAppIcon className="w-5 h-5" />
                                      </a>
                                  </Button>
                              )}
                              <Button variant="ghost" size="icon" title="Delete" className="text-destructive hover:text-destructive" onClick={() => setEntryToDelete(entry)}>
                                  <Trash2 className="w-4 h-4" />
                              </Button>
                          </div>
                      </TableCell>
                    </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                <XCircle className="w-16 h-16" />
                <h3 className="text-xl font-semibold">
                  {searchTerm || globalDateRange || typeFilter !== 'all' ? 'No Matching Transactions' : 'Not showing any details'}
                </h3>
                <p>{searchTerm || globalDateRange || typeFilter !== 'all' ? 'Try adjusting your search or filters.' : ''}</p>
              </div>
            )
          ) : (
            <div className="flex items-center justify-center p-8">
              <p>Loading transactions...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>

    <AlertDialog open={!!entryToDelete} onOpenChange={(isOpen) => !isOpen && setEntryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle/>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the entry: <br />
              <strong className="font-medium text-foreground">{entryToDelete?.type} for {entryToDelete?.partner} - {entryToDelete?.details}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEntry} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Yes, delete entry
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
