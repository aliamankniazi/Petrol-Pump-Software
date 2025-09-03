

'use client';

import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, ListChecks, WalletCards, Trash2, AlertTriangle, LayoutDashboard, Search } from 'lucide-react';
import type { OtherIncomeCategory, OtherIncome } from '@/lib/types';
import { format } from 'date-fns';
import { useOtherIncomes } from '@/hooks/use-other-incomes';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { DatePickerDropdowns } from '@/components/ui/date-picker-dropdowns';

const INCOME_CATEGORIES: OtherIncomeCategory[] = ['Service Station', 'Tire Shop', 'Tuck Shop', 'Other'];

const incomeSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  category: z.enum(INCOME_CATEGORIES, { required_error: 'Please select a category.' }),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  date: z.date({ required_error: "A date is required."}),
});

type IncomeFormValues = z.infer<typeof incomeSchema>;

export default function OtherIncomesPage() {
  const { otherIncomes, addOtherIncome, deleteOtherIncome } = useOtherIncomes();
  const { toast } = useToast();
  const [incomeToDelete, setIncomeToDelete] = useState<OtherIncome | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const { register, handleSubmit, reset, control, formState: { errors }, watch, setValue } = useForm<IncomeFormValues>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      description: '',
      amount: 0,
      date: new Date(),
    }
  });

  const onSubmit: SubmitHandler<IncomeFormValues> = (data) => {
    addOtherIncome({
        ...data,
    });
    toast({
      title: 'Income Recorded',
      description: `Income of PKR ${data.amount} for "${data.description}" has been logged.`,
    });
    const lastDate = watch('date');
    reset({ description: '', category: undefined, amount: 0, date: lastDate });
  };
  
  const handleDeleteIncome = () => {
    if (!incomeToDelete?.id) return;
    deleteOtherIncome(incomeToDelete.id);
    toast({
      title: 'Income Deleted',
      description: `The income entry for "${incomeToDelete.description}" has been removed.`,
    });
    setIncomeToDelete(null);
  };
  
  const filteredIncomes = useMemo(() => {
    return otherIncomes.filter(income => {
        if (categoryFilter !== 'all' && income.category !== categoryFilter) {
            return false;
        }
        if (searchTerm && !income.description.toLowerCase().includes(searchTerm.toLowerCase())) {
            return false;
        }
        return true;
    });
  }, [otherIncomes, categoryFilter, searchTerm]);

  if (!isClient) {
    return null;
  }

  return (
    <>
    <div className="p-4 md:p-8 grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <WalletCards /> New Income
            </CardTitle>
            <CardDescription>Record a new source of income.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" {...register('description')} placeholder="e.g., Oil change for customer" />
                {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                 <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                     <Select onValueChange={field.onChange} value={field.value} defaultValue="">
                        <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                            {INCOME_CATEGORIES.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                  )}
                />
                {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount (PKR)</Label>
                <Input id="amount" type="number" {...register('amount')} placeholder="e.g., 1500" step="0.01" />
                {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
              </div>
              
              <div className="space-y-2">
                  <Label>Date</Label>
                  <Controller
                    name="date"
                    control={control}
                    render={({ field }) => (
                      <DatePickerDropdowns date={field.value} onDateChange={field.onChange} />
                    )}
                  />
                  {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
                </div>

              <Button type="submit" className="w-full">Record Income</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign /> Income History
                </CardTitle>
                <CardDescription>
                  A record of all other business income.
                </CardDescription>
              </div>
               <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search description..." 
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by category..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {INCOME_CATEGORIES.map(cat => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button asChild variant="outline">
                        <Link href="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" /> Go to Dashboard</Link>
                    </Button>
               </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredIncomes.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIncomes.map(e => (
                      <TableRow key={e.id}>
                        <TableCell className="font-medium">{e.timestamp ? format(new Date(e.timestamp), 'PP') : 'N/A'}</TableCell>
                        <TableCell>{e.description}</TableCell>
                        <TableCell>{e.category}</TableCell>
                        <TableCell className="text-right">PKR {e.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        <TableCell className="text-center">
                            <Button variant="ghost" size="icon" title="Delete" className="text-destructive hover:text-destructive" onClick={() => setIncomeToDelete(e)}>
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                <ListChecks className="w-16 h-16" />
                <h3 className="text-xl font-semibold">{searchTerm || categoryFilter !== 'all' ? 'No Matching Incomes' : 'No Income Recorded'}</h3>
                <p>{searchTerm || categoryFilter !== 'all' ? 'Try adjusting your filters.' : 'Use the form to log your first business income.'}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
    <AlertDialog open={!!incomeToDelete} onOpenChange={(isOpen) => !isOpen && setIncomeToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle/>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the income entry for: <br />
              <strong className="font-medium text-foreground">{incomeToDelete?.description}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteIncome} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Yes, delete entry
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
