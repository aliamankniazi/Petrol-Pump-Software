
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
import { PiggyBank, PlusCircle, List, TrendingUp, TrendingDown, Calendar as CalendarIcon, Users, Percent, Edit, Trash2, AlertTriangle, BookText, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { useInvestments } from '@/hooks/use-investments';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { useBusinessPartners } from '@/hooks/use-business-partners';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import type { BusinessPartner, Investment } from '@/lib/types';
import Link from 'next/link';


const investmentSchema = z.object({
  partnerId: z.string().min(1, 'Partner name is required'),
  type: z.enum(['Investment', 'Withdrawal'], { required_error: 'Please select a transaction type.'}),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  notes: z.string().optional(),
  date: z.date({ required_error: "A date is required."}),
});

type InvestmentFormValues = z.infer<typeof investmentSchema>;

const partnerSchema = z.object({
  name: z.string().min(1, 'Partner name is required.'),
  contact: z.string().optional(),
  sharePercentage: z.coerce.number().min(0, "Percentage can't be negative.").max(100, "Percentage can't exceed 100."),
});
type PartnerFormValues = z.infer<typeof partnerSchema>;


export default function InvestmentsPage() {
  const { investments, addInvestment, deleteInvestment, isLoaded: investmentsLoaded } = useInvestments();
  const { businessPartners, addBusinessPartner, updateBusinessPartner, deleteBusinessPartner, isLoaded: partnersLoaded } = useBusinessPartners();
  const [partnerToEdit, setPartnerToEdit] = useState<BusinessPartner | null>(null);
  const [partnerToDelete, setPartnerToDelete] = useState<BusinessPartner | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<Investment | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const { toast } = useToast();
  
  // Form for new investments/withdrawals
  const { register: registerInvestment, handleSubmit: handleSubmitInvestment, reset: resetInvestment, control: controlInvestment, formState: { errors: investmentErrors } } = useForm<InvestmentFormValues>({
    resolver: zodResolver(investmentSchema),
    defaultValues: { date: new Date(), type: 'Investment' }
  });
  
  // Form for adding/editing partners
  const { register: registerPartner, handleSubmit: handleSubmitPartner, reset: resetPartner, setValue: setPartnerValue, formState: { errors: partnerErrors } } = useForm<PartnerFormValues>({
    resolver: zodResolver(partnerSchema),
  });
  
  const isLoaded = investmentsLoaded && partnersLoaded;
  
  const onInvestmentSubmit: SubmitHandler<InvestmentFormValues> = (data) => {
    const partner = businessPartners.find(p => p.id === data.partnerId);
    if (!partner) return;

    addInvestment({ 
        ...data, 
        partnerName: partner.name,
        timestamp: data.date.toISOString() 
    });
    toast({
      title: 'Transaction Recorded',
      description: `${data.type} of PKR ${data.amount} by ${partner.name} has been logged.`,
    });
    resetInvestment({ partnerId: '', amount: 0, notes: '', date: new Date(), type: 'Investment' });
  };
  
  const onPartnerSubmit: SubmitHandler<PartnerFormValues> = (data) => {
    if (partnerToEdit && partnerToEdit.id) {
      updateBusinessPartner(partnerToEdit.id, data);
      toast({ title: 'Partner Updated', description: `${data.name}'s details have been updated.` });
    } else {
      addBusinessPartner(data);
      toast({ title: 'Partner Added', description: `${data.name} has been added as a permanent partner.` });
    }
    setPartnerToEdit(null);
    resetPartner({ name: '', sharePercentage: 0, contact: '' });
  };

  const openEditDialog = (partner: BusinessPartner) => {
    setPartnerToEdit(partner);
    setPartnerValue('name', partner.name);
    setPartnerValue('sharePercentage', partner.sharePercentage);
    setPartnerValue('contact', partner.contact || '');
  }

  const handleDeletePartner = useCallback(() => {
    if (!partnerToDelete) return;
    deleteBusinessPartner(partnerToDelete.id);
    toast({ title: 'Partner Deleted', description: `${partnerToDelete.name} has been removed.`});
    setPartnerToDelete(null);
  }, [partnerToDelete, deleteBusinessPartner, toast]);
  
  const handleDeleteTransaction = useCallback(() => {
    if (!transactionToDelete) return;
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
  const totalSharePercentage = useMemo(() => businessPartners.reduce((sum, p) => sum + p.sharePercentage, 0), [businessPartners]);

  return (
    <>
    <div className="p-4 md:p-8 space-y-8">
      
      {/* Permanent Partner Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users/>Permanent Partner Manager</CardTitle>
          <CardDescription>Add, edit, or remove business partners and manage their share percentages.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Partner Name</TableHead>
                        <TableHead className="text-right">Share %</TableHead>
                        <TableHead className="text-right">Net Investment</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoaded && partnerSummary.length > 0 ? partnerSummary.map(p => (
                        <TableRow key={p.id}>
                            <TableCell className="font-medium">{p.name}</TableCell>
                            <TableCell className="text-right font-mono">{p.sharePercentage.toFixed(2)}%</TableCell>
                            <TableCell className={`text-right font-semibold font-mono ${p.netInvestment >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                                PKR {p.netInvestment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="text-center space-x-1">
                                <Button asChild variant="ghost" size="icon" title="View Partner Ledger">
                                   <Link href={`/customers/${p.id}/ledger`}>
                                     <BookText className="w-5 h-5" />
                                   </Link>
                                </Button>
                                <Button variant="ghost" size="icon" title="Edit Partner" onClick={() => openEditDialog(p)}><Edit className="w-4 h-4" /></Button>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" title="Delete Partner" onClick={() => setPartnerToDelete(p)}><Trash2 className="w-4 h-4" /></Button>
                            </TableCell>
                        </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">
                                {isLoaded ? 'No partners added yet. Use the button below to add one.' : 'Loading partners...'}
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
                <TableFooter>
                    <TableRow className="font-bold">
                        <TableCell>Total</TableCell>
                        <TableCell className="text-right font-mono">{totalSharePercentage.toFixed(2)}%</TableCell>
                        <TableCell className={`text-right font-mono ${totalNetInvestment >= 0 ? 'text-primary' : 'text-destructive'}`}>
                            PKR {totalNetInvestment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell/>
                    </TableRow>
                </TableFooter>
            </Table>
        </CardContent>
        <CardFooter>
            <Button onClick={() => setPartnerToEdit({} as BusinessPartner)}><PlusCircle className="mr-2"/>Add New Partner</Button>
        </CardFooter>
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
                     <Select onValueChange={field.onChange} value={field.value} defaultValue="">
                        <SelectTrigger>
                            <SelectValue placeholder="Select a partner" />
                        </SelectTrigger>
                        <SelectContent>
                            {partnersLoaded ? businessPartners.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            )) : <SelectItem value="loading" disabled>Loading partners...</SelectItem>}
                        </SelectContent>
                    </Select>
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
                {isClient && <Controller
                  name="date"
                  control={controlInvestment}
                  render={({ field }) => (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                />}
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
                            <TableCell className="font-medium">{format(new Date(t.timestamp), 'PP')}</TableCell>
                            <TableCell>{t.partnerName}</TableCell>
                            <TableCell>
                                <Badge variant={t.type === 'Investment' ? 'outline' : 'destructive'} className={cn(t.type === 'Investment' && 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700')}>
                                    {t.type}
                                </Badge>
                            </TableCell>
                            <TableCell>{t.notes || 'N/A'}</TableCell>
                            <TableCell className={`text-right font-semibold ${t.type === 'Investment' ? 'text-green-600' : 'text-destructive'}`}>
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
      
      {/* Dialog for Add/Edit Partner */}
      <Dialog open={!!partnerToEdit} onOpenChange={(isOpen) => { if (!isOpen) { setPartnerToEdit(null); resetPartner(); } }}>
        <DialogContent>
            <form onSubmit={handleSubmitPartner(onPartnerSubmit)}>
                <DialogHeader>
                    <DialogTitle>{partnerToEdit?.id ? 'Edit Partner' : 'Add New Partner'}</DialogTitle>
                    <DialogDescription>
                        {partnerToEdit?.id ? 'Update the details for this partner.' : 'Add a new permanent partner to manage their investments and shares.'}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Partner Name</Label>
                        <Input id="name" {...registerPartner('name')} />
                        {partnerErrors.name && <p className="text-sm text-destructive">{partnerErrors.name.message}</p>}
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="contact" className="flex items-center gap-2"><Phone className="w-4 h-4"/> Contact Number (Optional)</Label>
                        <Input id="contact" {...registerPartner('contact')} placeholder="e.g. 03001234567" />
                        {partnerErrors.contact && <p className="text-sm text-destructive">{partnerErrors.contact.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="sharePercentage" className="flex items-center gap-2"><Percent className="w-4 h-4"/> Share Percentage</Label>
                        <Input id="sharePercentage" type="number" {...registerPartner('sharePercentage')} step="0.01" />
                        {partnerErrors.sharePercentage && <p className="text-sm text-destructive">{partnerErrors.sharePercentage.message}</p>}
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => { setPartnerToEdit(null); resetPartner(); }}>Cancel</Button>
                    <Button type="submit">{partnerToEdit?.id ? 'Save Changes' : 'Add Partner'}</Button>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>
      
      {/* Dialog for Delete Partner Confirmation */}
      <AlertDialog open={!!partnerToDelete} onOpenChange={(isOpen) => !isOpen && setPartnerToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle/>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the partner: <br />
              <strong className="font-medium text-foreground">{partnerToDelete?.name}</strong>.
              All associated investment transactions will remain but will no longer be linked to a permanent partner.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePartner} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Yes, delete partner
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
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
