
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
import { DollarSign, ListChecks, WalletCards, Calendar as CalendarIcon } from 'lucide-react';
import type { OtherIncomeCategory } from '@/lib/types';
import { format } from 'date-fns';
import { useOtherIncomes } from '@/hooks/use-other-incomes';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

const INCOME_CATEGORIES: OtherIncomeCategory[] = ['Service Station', 'Tire Shop', 'Tuck Shop', 'Other'];

const incomeSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  category: z.enum(INCOME_CATEGORIES, { required_error: 'Please select a category.' }),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  date: z.date({ required_error: "A date is required."}),
});

type IncomeFormValues = z.infer<typeof incomeSchema>;

export default function OtherIncomesPage() {
  const { otherIncomes, addOtherIncome } = useOtherIncomes();
  const { toast } = useToast();
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<IncomeFormValues>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      date: new Date(),
    }
  });

  const onSubmit: SubmitHandler<IncomeFormValues> = (data) => {
    addOtherIncome({
        ...data,
        timestamp: data.date.toISOString(),
    });
    toast({
      title: 'Income Recorded',
      description: `Income of PKR ${data.amount} for "${data.description}" has been logged.`,
    });
    reset({ description: '', amount: 0, date: new Date() });
  };

  return (
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
            <CardTitle className="flex items-center gap-2">
              <DollarSign /> Income History
            </CardTitle>
            <CardDescription>
              A record of all other business income.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {otherIncomes.length > 0 ? (
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
                  {otherIncomes.map(e => (
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
                <h3 className="text-xl font-semibold">No Income Recorded</h3>
                <p>Use the form to log your first business income.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
