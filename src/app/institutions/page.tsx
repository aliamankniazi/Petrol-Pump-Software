

'use client';

import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Building, PlusCircle, List, Edit, Trash2, AlertTriangle, Image as ImageIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useState, useCallback, useEffect } from 'react';
import type { Institution } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useInstitutions } from '@/hooks/use-institution';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


const institutionSchema = z.object({
  name: z.string().min(1, 'Institution name is required'),
  logoUrl: z.string().url().optional().or(z.literal('')),
});

type InstitutionFormValues = z.infer<typeof institutionSchema>;


export default function InstitutionsPage() {
  const { institutions, addInstitution, updateInstitution, deleteInstitution, isLoaded } = useInstitutions();
  const { toast } = useToast();
  
  const [institutionToEdit, setInstitutionToEdit] = useState<Partial<Institution> | null>(null);
  const [institutionToDelete, setInstitutionToDelete] = useState<Institution | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<InstitutionFormValues>({
    resolver: zodResolver(institutionSchema),
  });

  const onFormSubmit: SubmitHandler<InstitutionFormValues> = useCallback(async (data) => {
    try {
        if (institutionToEdit && institutionToEdit.id) {
            await updateInstitution(institutionToEdit.id, data);
            toast({ title: 'Institution Updated', description: `The details for ${data.name} have been updated.` });
        } else {
            const newInstitution = await addInstitution(data);
            toast({ title: 'Institution Added', description: `${newInstitution.name} has been created successfully.` });
        }
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
        setInstitutionToEdit(null);
        reset();
    }
  }, [institutionToEdit, addInstitution, updateInstitution, toast, reset]);
  
  const handleDeleteInstitution = useCallback(async () => {
    if (!institutionToDelete) return;
    try {
      await deleteInstitution(institutionToDelete.id);
      toast({
          title: 'Institution Deleted',
          description: `${institutionToDelete.name} has been removed.`,
      });
      setInstitutionToDelete(null);
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  }, [institutionToDelete, deleteInstitution, toast]);

  useEffect(() => {
    if (institutionToEdit) {
      setValue('name', institutionToEdit.name || '');
      setValue('logoUrl', institutionToEdit.logoUrl || '');
    } else {
      reset({ name: '', logoUrl: '' });
    }
  }, [institutionToEdit, setValue, reset]);

  return (
    <>
    <div className="p-4 md:p-8 space-y-8">
      <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <List /> Institution List
            </CardTitle>
            <CardDescription>
              A record of all your managed institutions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isLoaded ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : institutions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Institution</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {institutions.map(inst => (
                      <TableRow key={inst.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={inst.logoUrl} alt={inst.name} />
                                <AvatarFallback><Building/></AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{inst.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center space-x-0">
                           <Button variant="ghost" size="icon" title="Edit Institution" onClick={() => setInstitutionToEdit(inst)}>
                                <Edit className="w-4 h-4" />
                           </Button>
                           <Button variant="ghost" size="icon" title="Delete Institution" className="text-destructive hover:text-destructive" onClick={() => setInstitutionToDelete(inst)}>
                                <Trash2 className="w-4 h-4" />
                           </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                <Building className="w-16 h-16" />
                <h3 className="text-xl font-semibold">No Institutions Found</h3>
                <p>Use the button below to create your first institution.</p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={() => setInstitutionToEdit({})}><PlusCircle className="mr-2 h-4 w-4"/>Create New Institution</Button>
          </CardFooter>
        </Card>
      </div>
    
    <Dialog open={!!institutionToEdit} onOpenChange={(isOpen) => !isOpen && setInstitutionToEdit(null)}>
        <DialogContent>
            <form onSubmit={handleSubmit(onFormSubmit)}>
                <DialogHeader>
                    <DialogTitle>{institutionToEdit?.id ? 'Edit Institution' : 'Create New Institution'}</DialogTitle>
                    <DialogDescription>
                        {institutionToEdit?.id ? 'Update the details for this institution.' : 'Create a new institution to manage its data separately.'}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Institution Name</Label>
                        <Input id="name" {...register('name')} placeholder="e.g., Mianwali Petroleum" />
                        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="logoUrl" className="flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Logo URL (Optional)</Label>
                        <Input id="logoUrl" {...register('logoUrl')} placeholder="https://example.com/logo.png" />
                        {errors.logoUrl && <p className="text-sm text-destructive">{errors.logoUrl.message}</p>}
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setInstitutionToEdit(null)}>Cancel</Button>
                    <Button type="submit">{institutionToEdit?.id ? 'Save Changes' : 'Create Institution'}</Button>
                </DialogFooter>
            </form>
        </DialogContent>
    </Dialog>

    <AlertDialog open={!!institutionToDelete} onOpenChange={(isOpen) => !isOpen && setInstitutionToDelete(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle/>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the institution: <br />
            <strong className="font-medium text-foreground">{institutionToDelete?.name}</strong>. All of its associated data (sales, customers, roles etc.) will also be deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDeleteInstitution} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Yes, delete institution
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
