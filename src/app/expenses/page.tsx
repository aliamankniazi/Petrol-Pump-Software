'use client';

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Receipt, ListChecks, WalletCards } from 'lucide-react';
import type { Expense, ExpenseCategory } from '@/lib/types';
import { format } from 'date-fns';

const EXPENSE_CATEGORIES: ExpenseCategory[] = ['Utilities', 'Salaries', 'Maintenance', 'Other'];

const expenseSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  category: z.enum(EXPENSE_CATEGORIES, { required_error: 'Please select a category.' }),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const { toast } = useToast();
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
  });

  const onSubmit: SubmitHandler<ExpenseFormValues> = (data) => {
    const newExpense: Expense = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...data,
    };
    setExpenses(prev => [newExpense, ...prev]);
    toast({
      title: 'Expense Recorded',
      description: `Expense of PKR ${data.amount} for "${data.description}" has been logged.`,
    });
    reset();
  };

  return (
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
                <Select onValueChange={(value: ExpenseCategory) => setValue('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount (PKR)</Label>
                <Input id="amount" type="number" {...register('amount')} placeholder="e.g., 5000" step="0.01" />
                {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
              </div>

              <Button type="submit" className="w-full">Record Expense</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt /> Expense History
            </CardTitle>
            <CardDescription>
              A record of all business expenses.
            </CardDescription>
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map(e => (
                      <TableRow key={e.id}>
                        <TableCell className="font-medium">{format(new Date(e.timestamp), 'PP')}</TableCell>
                        <TableCell>{e.description}</TableCell>
                        <TableCell>{e.category}</TableCell>
                        <TableCell className="text-right">PKR {e.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
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
  );
}
