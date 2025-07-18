
'use client';

import { useState, useMemo } from 'react';
import { useCustomerPayments } from '@/hooks/use-customer-payments';
import { useCustomers } from '@/hooks/use-customers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, isSameDay } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import type { PaymentMethod } from '@/lib/types';
import { HandCoins, XCircle, Calendar as CalendarIcon, Filter, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

export default function CustomerPaymentsPage() {
  const { customerPayments, isLoaded: paymentsLoaded } = useCustomerPayments();
  const { customers, isLoaded: customersLoaded } = useCustomers();
  
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  const isLoaded = paymentsLoaded && customersLoaded;

  const filteredPayments = useMemo(() => {
    if (!isLoaded) return [];
    
    return customerPayments.filter(payment => {
      const customerMatch = !selectedCustomerId || payment.customerId === selectedCustomerId;
      const dateMatch = !selectedDate || isSameDay(new Date(payment.timestamp), selectedDate);
      return customerMatch && dateMatch;
    });
  }, [customerPayments, selectedCustomerId, selectedDate, isLoaded]);

  const getBadgeVariant = (method: PaymentMethod) => {
    switch (method) {
      case 'Card':
        return 'default';
      case 'Cash':
        return 'secondary';
      case 'Mobile':
        return 'outline';
      default:
        return 'default';
    }
  };

  const clearFilters = () => {
    setSelectedCustomerId('');
    setSelectedDate(undefined);
  };

  const hasActiveFilters = selectedCustomerId || selectedDate;

  return (
    <div className="p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HandCoins /> Customer Payment History
          </CardTitle>
          <CardDescription>A record of all payments received from customers. Use the filters below to refine your search.</CardDescription>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-4">
              <Select value={selectedCustomerId} onValueChange={(value) => setSelectedCustomerId(value === 'all' ? '' : value)}>
                <SelectTrigger className="sm:w-[240px]">
                  <SelectValue placeholder="Filter by customer..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  {customers.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full sm:w-[240px] justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : <span>Filter by date...</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {hasActiveFilters && (
                <Button variant="ghost" onClick={clearFilters}>
                  <X className="mr-2 h-4 w-4" />
                  Clear Filters
                </Button>
              )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoaded && filteredPayments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-center">Payment Method</TableHead>
                  <TableHead className="text-right">Amount (PKR)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      {format(new Date(p.timestamp), 'PP pp')}
                    </TableCell>
                    <TableCell>{p.customerName}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={getBadgeVariant(p.paymentMethod)}>{p.paymentMethod}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{p.amount.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                {isLoaded ? (
                    <>
                        <XCircle className="w-16 h-16" />
                        <h3 className="text-xl font-semibold">
                          {hasActiveFilters ? 'No Matching Payments Found' : 'No Customer Payments Yet'}
                        </h3>
                        <p>
                          {hasActiveFilters ? 'Try adjusting or clearing your filters.' : 'Record a payment on the main screen to see it here.'}
                        </p>
                    </>
                ) : (
                    <p>Loading payment data...</p>
                )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
