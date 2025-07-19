
'use client';

import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { PiggyBank, PlusCircle, List, TrendingUp, TrendingDown, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useInvestments } from '@/hooks/use-investments';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';


const investmentSchema = z.object({
  partnerName: z.string().min(1, 'Partner name is required'),
  type: z.enum(['Investment', 'Withdrawal'], { required_error: 'Please select a transaction type.'}),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  notes: z.string().optional(),
  date: z.date({ required_error: "A date is required."}),
});

type InvestmentFormValues = z.infer<typeof investmentSchema>;

export default function InvestmentsPage() {
  const { investments, addInvestment, isLoaded } = useInvestments();
  const { toast } = useToast();
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<InvestmentFormValues>({
    resolver: zodResolver(investmentSchema),
    defaultValues: {
      date: new Date(),
      type: 'Investment',
    }
  });
  
  const onSubmit: SubmitHandler<InvestmentFormValues> = (data) => {
    addInvestment({ ...data, timestamp: data.date.toISOString() });
    toast({
      title: 'Transaction Recorded',
      description: `${data.type} of PKR ${data.amount} by ${data.partnerName} has been logged.`,
    });
    reset({ partnerName: '', amount: 0, notes: '', date: new Date(), type: 'Investment' });
  };
  
  const partnerSummary = useMemo(() => {
    if (!isLoaded) return [];
    
    const summary = investments.reduce((acc, curr) => {
        const amount = curr.type === 'Investment' ? curr.amount : -curr.amount;
        if (!acc[curr.partnerName]) {
            acc[curr.partnerName] = 0;
        }
        acc[curr.partnerName] += amount;
        return acc;
    }, {} as Record<string, number>);

    return Object.entries(summary)
        .map(([name, netInvestment]) => ({ name, netInvestment }))
        .sort((a,b) => b.netInvestment - a.netInvestment);

  }, [investments, isLoaded]);

  const totalNetInvestment = useMemo(() => partnerSummary.reduce((sum, p) => sum + p.netInvestment, 0), [partnerSummary]);

  return (
    <div className="p-4 md:p-8 grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-1 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlusCircle /> New Investment/Withdrawal
            </CardTitle>
            <CardDescription>Record a new capital transaction.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="partnerName">Partner Name</Label>
                <Input id="partnerName" {...register('partnerName')} placeholder="e.g., John Doe" />
                {errors.partnerName && <p className="text-sm text-destructive">{errors.partnerName.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Type</Label>
                 <Controller
                  name="type"
                  control={control}
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
                {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount (PKR)</Label>
                <Input id="amount" type="number" {...register('amount')} placeholder="e.g., 100000" step="0.01" />
                {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea id="notes" {...register('notes')} placeholder="e.g., Initial capital" />
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


              <Button type="submit" className="w-full">Record Transaction</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Partner Summary</CardTitle>
                <CardDescription>Net investment for each partner.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoaded && partnerSummary.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Partner</TableHead>
                                <TableHead className="text-right">Net Investment</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {partnerSummary.map(p => (
                                <TableRow key={p.name}>
                                    <TableCell className="font-medium">{p.name}</TableCell>
                                    <TableCell className={`text-right font-semibold ${p.netInvestment >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                                        PKR {p.netInvestment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No investment data available.</p>
                )}
            </CardContent>
             <CardFooter>
                <div className="w-full flex justify-between items-center font-bold">
                    <span>Total Net Capital</span>
                    <span className={totalNetInvestment >= 0 ? 'text-primary' : 'text-destructive'}>
                        PKR {totalNetInvestment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                </div>
            </CardFooter>
        </Card>

      </div>

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
  );
}
