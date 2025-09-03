
'use client';

import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { PiggyBank, PlusCircle, List, TrendingUp, TrendingDown, Users, Percent, Edit, Trash2, AlertTriangle, BookText, Phone, LayoutDashboard, ChevronsUpDown, Check } from 'lucide-react';
import { format } from 'date-fns';
import { useInvestments } from '@/hooks/use-investments';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { useCustomers } from '@/hooks/use-customers';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import type { Investment } from '@/lib/types';
import Link from 'next/link';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { DatePickerDropdowns } from '@/components/ui/date-picker-dropdowns';


const investmentSchema = z.object({
  partnerId: z.string().min(1, 'Partner name is required'),
  type: z.enum(['Investment', 'Withdrawal'], { required_error: 'Please select a transaction type.'}),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  notes: z.string().optional(),
  date: z.date({ required_error: "A date is required."}),
});

type InvestmentFormValues = z.infer<typeof investmentSchema>;

export default function InvestmentsPage() {
  const { investments, addInvestment, deleteInvestment, isLoaded: investmentsLoaded } = useInvestments();
  const { customers, isLoaded: partnersLoaded } = useCustomers();
  const [transactionToDelete, setTransactionToDelete] = useState<Investment | null>(null);
  
  const [isClient, setIsClient] = useState(false);
  const [partnerSearch, setPartnerSearch] = useState('');
  const [isPartnerPopoverOpen, setIsPartnerPopoverOpen] = useState(false);


  useEffect(() => {
    setIsClient(true);
  }, []);

  const businessPartners = useMemo(() => customers.filter(c => c.isPartner), [customers]);

  const filteredPartners = useMemo(() => {
    if (!partnerSearch) return businessPartners;
    return businessPartners.filter(p => p.name.toLowerCase().includes(partnerSearch.toLowerCase()));
  }, [businessPartners, partnerSearch]);

  // Form for new investments/withdrawals
  const { register: registerInvestment, handleSubmit: handleSubmitInvestment, reset: resetInvestment, control: controlInvestment, formState: { errors: investmentErrors }, watch } = useForm<InvestmentFormValues>({
    resolver: zodResolver(investmentSchema),
    defaultValues: { type: 'Investment', partnerId: '', amount: 0, notes: '', date: new Date() }
  });

  const isLoaded = investmentsLoaded && partnersLoaded;
  
  const { toast } = useToast();
  
  const onInvestmentSubmit: SubmitHandler<InvestmentFormValues> = (data) => {
    const partner = businessPartners.find(p => p.id === data.partnerId);
    if (!partner) return;

    addInvestment({ 
        ...data, 
        partnerName: partner.name,
    });
    toast({
      title: 'Transaction Recorded',
      description: `${data.type} of PKR ${data.amount} by ${partner.name} has been logged.`,
    });
    const lastDate = watch('date');
    resetInvestment({ partnerId: '', amount: 0, notes: '', date: lastDate, type: 'Investment' });
  };
  
  const handleDeleteTransaction = useCallback(() => {
    if (!transactionToDelete?.id) return;
    deleteInvestment(transactionToDelete.id);
    toast({ title: 'Transaction Deleted', description: 'The investment/withdrawal record has been removed.'});
    setTransactionToDelete(null);
  }, [transactionToDelete, deleteInvestment, toast]);
  
  const partnerSummary = useMemo(() => {
    if (!isLoaded) return [];
    
    const summary = investments.reduce((acc, curr) => {
        const amount = curr.type === 'Investment' ? curr.amount : -curr.amount;
        if (!acc[curr.partnerId]) {
            acc[curr.partnerId] = { investment: 0, withdrawal: 0 };
        }
        if (curr.type === 'Investment') acc[curr.partnerId].investment += curr.amount;
        else acc[curr.partnerId].withdrawal += curr.amount;

        return acc;
    }, {} as Record<string, { investment: number, withdrawal: number }>);
    
    return businessPartners.map(p => {
        const s = summary[p.id] || { investment: 0, withdrawal: 0 };
        const netInvestment = s.investment - s.withdrawal;
        return { 
            ...p, 
            netInvestment,
            totalInvestment: s.investment,
            totalWithdrawal: s.withdrawal,
        }
    }).sort((a,b) => b.netInvestment - a.netInvestment);

  }, [investments, businessPartners, isLoaded]);

  const totalNetInvestment = useMemo(() => partnerSummary.reduce((sum, p) => sum + p.netInvestment, 0), [partnerSummary]);
  const totalSharePercentage = useMemo(() => businessPartners.reduce((sum, p) => sum + (p.sharePercentage || 0), 0), [businessPartners]);

  if (!isClient) {
    return null;
  }

  return (
    <>
    <div className="p-4 md:p-8 space-y-8">
      
      <Card>
        <CardHeader className="flex flex-row justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2"><Users/>Partner Capital Summary</CardTitle>
            <CardDescription>View net investment and share percentage for all business partners.</CardDescription>
          </div>
           <Button asChild variant="outline">
              <Link href="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" /> Go to Dashboard</Link>
          </Button>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Partner Name</TableHead>
                        <TableHead className="text-right">Share %</TableHead>
                        <TableHead className="text-right">Net Investment</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoaded && partnerSummary.length > 0 ? partnerSummary.map(p => (
                        <TableRow key={p.id}>
                            <TableCell className="font-medium">{p.name}</TableCell>
                            <TableCell className="text-right font-mono font-bold">{p.sharePercentage?.toFixed(2)}%</TableCell>
                            <TableCell className={`text-right font-bold font-mono ${p.netInvestment >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                                PKR {p.netInvestment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </TableCell>
                        </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">
                                {isLoaded ? 'No partners found. Add them from the Customers page.' : 'Loading partners...'}
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
                <TableFooter>
                    <TableRow className="font-bold">
                        <TableCell>Total</TableCell>
                        <TableCell className="text-right font-mono font-bold">{totalSharePercentage.toFixed(2)}%</TableCell>
                        <TableCell className={`text-right font-mono font-bold ${totalNetInvestment >= 0 ? 'text-primary' : 'text-destructive'}`}>
                            PKR {totalNetInvestment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                    </TableRow>
                </TableFooter>
            </Table>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Investment/Withdrawal Form */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlusCircle /> New Capital Transaction
            </CardTitle>
            <CardDescription>Record a new investment or withdrawal.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitInvestment(onInvestmentSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Partner</Label>
                 <Controller
                  name="partnerId"
                  control={controlInvestment}
                  render={({ field }) => (
                    <Popover open={isPartnerPopoverOpen} onOpenChange={setIsPartnerPopoverOpen}>
                        <PopoverTrigger asChild>
                            <Button
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between"
                            >
                            {field.value
                                ? businessPartners.find((p) => p.id === field.value)?.name
                                : "Select a partner"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                                <CommandInput placeholder="Search partner..." onValueChange={setPartnerSearch}/>
                                <CommandList>
                                    <CommandEmpty>No partner found.</CommandEmpty>
                                    <CommandGroup>
                                    {filteredPartners.map((p) => (
                                        <CommandItem
                                        key={p.id}
                                        value={p.id!}
                                        onSelect={(currentValue) => {
                                            field.onChange(currentValue === field.value ? "" : currentValue)
                                            setIsPartnerPopoverOpen(false);
                                        }}
                                        >
                                        <Check
                                            className={cn(
                                            "mr-2 h-4 w-4",
                                            field.value === p.id ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        {p.name}
                                        </CommandItem>
                                    ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                  )}
                />
                {investmentErrors.partnerId && <p className="text-sm text-destructive">{investmentErrors.partnerId.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Type</Label>
                 <Controller
                  name="type"
                  control={controlInvestment}
                  render={({ field }) => (
                     <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select transaction type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Investment">Investment</SelectItem>
                            <SelectItem value="Withdrawal">Withdrawal</SelectItem>
                        </SelectContent>
                    </Select>
                  )}
                />
                {investmentErrors.type && <p className="text-sm text-destructive">{investmentErrors.type.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount (PKR)</Label>
                <Input id="amount" type="number" {...registerInvestment('amount')} placeholder="e.g., 100000" step="0.01" />
                {investmentErrors.amount && <p className="text-sm text-destructive">{investmentErrors.amount.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea id="notes" {...registerInvestment('notes')} placeholder="e.g., Initial capital" />
              </div>
              
              <div className="space-y-2">
                <Label>Date</Label>
                <Controller
                  name="date"
                  control={controlInvestment}
                  render={({ field }) => (
                    <DatePickerDropdowns date={field.value} onDateChange={field.onChange} />
                  )}
                />
                {investmentErrors.date && <p className="text-sm text-destructive">{investmentErrors.date.message}</p>}
              </div>

              <Button type="submit" className="w-full">Record Transaction</Button>
            </form>
          </CardContent>
        </Card>
        
        {/* Transaction History */}
        <div className="lg:col-span-2">
            <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                <List /> Transaction History
                </CardTitle>
                <CardDescription>
                A record of all partner investments and withdrawals.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {investments.length > 0 ? (
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Partner</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {investments.map(t => (
                        <TableRow key={t.id}>
                            <TableCell className="font-medium">{t.timestamp ? format(new Date(t.timestamp), 'PP') : 'N/A'}</TableCell>
                            <TableCell>{t.partnerName}</TableCell>
                            <TableCell>
                                <Badge variant={t.type === 'Investment' ? 'outline' : 'destructive'} className={cn(t.type === 'Investment' && 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700')}>
                                    {t.type}
                                </Badge>
                            </TableCell>
                            <TableCell>{t.notes || 'N/A'}</TableCell>
                            <TableCell className={`text-right font-bold ${t.type === 'Investment' ? 'text-green-600' : 'text-destructive'}`}>
                                PKR {t.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="text-center">
                                <Button variant="ghost" size="icon" title="Delete Transaction" className="text-destructive hover:text-destructive" onClick={() => setTransactionToDelete(t)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                </Table>
                ) : (
                <div className="flex flex-col items-center justify-center gap-4 text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                    <PiggyBank className="w-16 h-16" />
                    <h3 className="text-xl font-semibold">No Transactions Recorded</h3>
                    <p>Use the form to log your first investment.</p>
                </div>
                )}
            </CardContent>
            </Card>
        </div>
      </div>
      
      {/* Dialog for Delete Transaction Confirmation */}
      <AlertDialog open={!!transactionToDelete} onOpenChange={(isOpen) => !isOpen && setTransactionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle/>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the transaction for <br />
              <strong className="font-medium text-foreground">{transactionToDelete?.type} of PKR {transactionToDelete?.amount}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTransaction} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Yes, delete transaction
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </>
  );
}
