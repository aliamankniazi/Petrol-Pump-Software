
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
import { Receipt, ListChecks, WalletCards, Calendar as CalendarIcon, Trash2, AlertTriangle, LayoutDashboard } from 'lucide-react';
import type { ExpenseCategory, Expense } from '@/lib/types';
import { format } from 'date-fns';
import { useExpenses } from '@/hooks/use-expenses';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useState, useEffect } from 'react';
import Link from 'next/link';


const EXPENSE_CATEGORIES: ExpenseCategory[] = ['Utilities', 'Salaries', 'Maintenance', 'Other'];

const expenseSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  category: z.enum(EXPENSE_CATEGORIES, { required_error: 'Please select a category.' }),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  date: z.date({ required_error: "A date is required."}),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

const LOCAL_STORAGE_KEY = 'global-transaction-date';

export default function ExpensesPage() {
  const { expenses, addExpense, deleteExpense } = useExpenses();
  const { toast } = useToast();
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const { register, handleSubmit, reset, control, formState: { errors }, watch, setValue } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { date: new Date() }
  });
  
  useEffect(() => {
    if (isClient) {
      const storedDate = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedDate) {
        setValue('date', new Date(storedDate));
      }
    }
  }, [setValue, isClient]);
  
  const selectedDate = watch('date');
  useEffect(() => {
    if (selectedDate && isClient) {
      localStorage.setItem(LOCAL_STORAGE_KEY, selectedDate.toISOString());
    }
  }, [selectedDate, isClient]);

  const onSubmit: SubmitHandler<ExpenseFormValues> = (data) => {
    addExpense({
      ...data,
      timestamp: data.date.toISOString(),
    });
    toast({
      title: 'Expense Recorded',
      description: `Expense of PKR ${data.amount} for "${data.description}" has been logged.`,
    });
    const lastDate = watch('date');
    reset({ description: '', category: undefined, amount: 0, date: lastDate });
  };
  
  const handleDeleteExpense = () => {
    if (!expenseToDelete) return;
    deleteExpense(expenseToDelete.id);
    toast({
      title: 'Expense Deleted',
      description: `The expense for "${expenseToDelete.description}" has been removed.`,
    });
    setExpenseToDelete(null);
  };

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
              <WalletCards /> New Expense
            </CardTitle>
            <CardDescription>Record a new business expense.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" {...register('description')} placeholder="e.g., Office electricity bill" />
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
                            {EXPENSE_CATEGORIES.map(cat => (
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
                <Input id="amount" type="number" {...register('amount')} placeholder="e.g., 5000" step="0.01" />
                {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
              </div>

               <div className="space-y-2">
                  <Label>Date</Label>
                  <Controller
                    name="date"
                    control={control}
                    render={({ field }) => (
                      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
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
                            onSelect={(date) => {
                                if(date) field.onChange(date);
                                setIsCalendarOpen(false);
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  />
                  {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
                </div>


              <Button type="submit" className="w-full">Record Expense</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Card>
          <CardHeader className="flex flex-row justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Receipt /> Expense History
              </CardTitle>
              <CardDescription>
                A record of all business expenses.
              </CardDescription>
            </div>
             <Button asChild variant="outline">
                <Link href="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" /> Go to Dashboard</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {expenses.length > 0 ? (
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
                  {expenses.map(e => (
                      <TableRow key={e.id}>
                        <TableCell className="font-medium">{format(new Date(e.timestamp), 'PP')}</TableCell>
                        <TableCell>{e.description}</TableCell>
                        <TableCell>{e.category}</TableCell>
                        <TableCell className="text-right">PKR {e.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        <TableCell className="text-center">
                            <Button variant="ghost" size="icon" title="Delete" className="text-destructive hover:text-destructive" onClick={() => setExpenseToDelete(e)}>
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
                <h3 className="text-xl font-semibold">No Expenses Recorded</h3>
                <p>Use the form to log your first business expense.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
    <AlertDialog open={!!expenseToDelete} onOpenChange={(isOpen) => !isOpen && setExpenseToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle/>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the expense entry for: <br />
              <strong className="font-medium text-foreground">{expenseToDelete?.description}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteExpense} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Yes, delete entry
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
