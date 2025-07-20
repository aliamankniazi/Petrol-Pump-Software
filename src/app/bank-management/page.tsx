
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
import { Landmark, List, PlusCircle, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { useBankAccounts } from '@/hooks/use-bank-accounts';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useState, useEffect, useCallback } from 'react';
import type { BankAccount } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

const bankAccountSchema = z.object({
  bankName: z.string().min(1, 'Bank name is required'),
  accountNumber: z.string().min(1, 'Account number is required'),
  balance: z.coerce.number().min(0, 'Initial balance cannot be negative'),
});

type BankAccountFormValues = z.infer<typeof bankAccountSchema>;

export default function BankManagementPage() {
  const { bankAccounts, addBankAccount, updateBankAccount, deleteBankAccount, isLoaded } = useBankAccounts();
  const { toast } = useToast();
  
  const [accountToEdit, setAccountToEdit] = useState<BankAccount | null>(null);
  const [accountToDelete, setAccountToDelete] = useState<BankAccount | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<BankAccountFormValues>({
    resolver: zodResolver(bankAccountSchema),
  });

  const { register: registerEdit, handleSubmit: handleSubmitEdit, reset: resetEdit, setValue: setEditValue, formState: { errors: editErrors } } = useForm<BankAccountFormValues>({
    resolver: zodResolver(bankAccountSchema),
  });

  const onAddSubmit: SubmitHandler<BankAccountFormValues> = useCallback((data) => {
    addBankAccount(data);
    toast({
      title: 'Bank Account Added',
      description: `${data.bankName} account has been added successfully.`,
    });
    reset({ bankName: '', accountNumber: '', balance: 0 });
  }, [addBankAccount, toast, reset]);
  
  const onEditSubmit: SubmitHandler<BankAccountFormValues> = useCallback((data) => {
    if (!accountToEdit) return;
    updateBankAccount(accountToEdit.id, data);
    toast({
        title: 'Account Updated',
        description: "The bank account details have been saved."
    });
    setAccountToEdit(null);
  }, [accountToEdit, updateBankAccount, toast]);

  const handleDeleteAccount = useCallback(() => {
    if (!accountToDelete) return;
    deleteBankAccount(accountToDelete.id);
    toast({
        title: 'Account Deleted',
        description: `${accountToDelete.bankName} account has been removed.`,
    });
    setAccountToDelete(null);
  }, [accountToDelete, deleteBankAccount, toast]);

  useEffect(() => {
    if (accountToEdit) {
      setEditValue('bankName', accountToEdit.bankName);
      setEditValue('accountNumber', accountToEdit.accountNumber);
      setEditValue('balance', accountToEdit.balance);
    } else {
      resetEdit();
    }
  }, [accountToEdit, setEditValue, resetEdit]);

  return (
    <>
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
            <form onSubmit={handleSubmit(onAddSubmit)} className="space-y-4">
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
            {!isLoaded ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : bankAccounts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date Added</TableHead>
                    <TableHead>Bank Name</TableHead>
                    <TableHead>Account No.</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bankAccounts.map(account => (
                      <TableRow key={account.id}>
                        <TableCell className="font-medium">{format(new Date(account.timestamp), 'PP')}</TableCell>
                        <TableCell>{account.bankName}</TableCell>
                        <TableCell>{account.accountNumber}</TableCell>
                        <TableCell className="text-right">PKR {account.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        <TableCell className="text-center space-x-0">
                           <Button variant="ghost" size="icon" title="Edit Account" onClick={() => setAccountToEdit(account)}>
                                <Edit className="w-4 h-4" />
                           </Button>
                           <Button variant="ghost" size="icon" title="Delete Account" className="text-destructive hover:text-destructive" onClick={() => setAccountToDelete(account)}>
                                <Trash2 className="w-4 h-4" />
                           </Button>
                        </TableCell>
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
    
    <Dialog open={!!accountToEdit} onOpenChange={(isOpen) => !isOpen && setAccountToEdit(null)}>
        <DialogContent>
            <form onSubmit={handleSubmitEdit(onEditSubmit)}>
                <DialogHeader>
                    <DialogTitle>Edit Bank Account</DialogTitle>
                    <DialogDescription>
                        Update the details for this account.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-bankName">Bank Name</Label>
                        <Input id="edit-bankName" {...registerEdit('bankName')} />
                        {editErrors.bankName && <p className="text-sm text-destructive">{editErrors.bankName.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-accountNumber">Account Number</Label>
                        <Input id="edit-accountNumber" {...registerEdit('accountNumber')} />
                        {editErrors.accountNumber && <p className="text-sm text-destructive">{editErrors.accountNumber.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-balance">Balance</Label>
                        <Input id="edit-balance" type="number" {...registerEdit('balance')} step="0.01" />
                        {editErrors.balance && <p className="text-sm text-destructive">{editErrors.balance.message}</p>}
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setAccountToEdit(null)}>Cancel</Button>
                    <Button type="submit">Save Changes</Button>
                </DialogFooter>
            </form>
        </DialogContent>
    </Dialog>

    <AlertDialog open={!!accountToDelete} onOpenChange={(isOpen) => !isOpen && setAccountToDelete(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle/>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the account: <br />
            <strong className="font-medium text-foreground">{accountToDelete?.bankName} ({accountToDelete?.accountNumber})</strong>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Yes, delete account
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
