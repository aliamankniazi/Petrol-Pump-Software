'use client';

import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Landmark, List, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useBankAccounts } from '@/hooks/use-bank-accounts';

const bankAccountSchema = z.object({
  bankName: z.string().min(1, 'Bank name is required'),
  accountNumber: z.string().min(1, 'Account number is required'),
  balance: z.coerce.number().min(0, 'Initial balance cannot be negative'),
});

type BankAccountFormValues = z.infer<typeof bankAccountSchema>;

export default function BankManagementPage() {
  const { bankAccounts, addBankAccount } = useBankAccounts();
  const { toast } = useToast();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<BankAccountFormValues>({
    resolver: zodResolver(bankAccountSchema),
  });

  const onSubmit: SubmitHandler<BankAccountFormValues> = (data) => {
    addBankAccount(data);
    toast({
      title: 'Bank Account Added',
      description: `${data.bankName} account has been added successfully.`,
    });
    reset();
  };

  return (
    <div className="p-4 md:p-8 grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlusCircle /> New Bank Account
            </CardTitle>
            <CardDescription>Add a new bank account to your records.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bankName">Bank Name</Label>
                <Input id="bankName" {...register('bankName')} placeholder="e.g., HBL, MCB" />
                {errors.bankName && <p className="text-sm text-destructive">{errors.bankName.message}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input id="accountNumber" {...register('accountNumber')} placeholder="e.g., 1234567890" />
                {errors.accountNumber && <p className="text-sm text-destructive">{errors.accountNumber.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="balance">Initial Balance (PKR)</Label>
                <Input id="balance" type="number" {...register('balance')} placeholder="e.g., 50000" step="0.01" />
                {errors.balance && <p className="text-sm text-destructive">{errors.balance.message}</p>}
              </div>

              <Button type="submit" className="w-full">Add Account</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <List /> Bank Accounts
            </CardTitle>
            <CardDescription>
              A record of all your registered bank accounts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {bankAccounts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date Added</TableHead>
                    <TableHead>Bank Name</TableHead>
                    <TableHead>Account No.</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bankAccounts.map(account => (
                      <TableRow key={account.id}>
                        <TableCell className="font-medium">{format(new Date(account.timestamp), 'PP')}</TableCell>
                        <TableCell>{account.bankName}</TableCell>
                        <TableCell>{account.accountNumber}</TableCell>
                        <TableCell className="text-right">PKR {account.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                <Landmark className="w-16 h-16" />
                <h3 className="text-xl font-semibold">No Bank Accounts Found</h3>
                <p>Use the form to add your first bank account.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}