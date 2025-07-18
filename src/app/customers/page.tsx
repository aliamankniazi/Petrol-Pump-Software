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
import { Users, UserPlus, List } from 'lucide-react';
import { format } from 'date-fns';
import { useCustomers } from '@/hooks/use-customers';

const customerSchema = z.object({
  name: z.string().min(1, 'Customer name is required'),
  contact: z.string().min(1, 'Contact information is required'),
  vehicleNumber: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

export default function CustomersPage() {
  const { customers, addCustomer } = useCustomers();
  const { toast } = useToast();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
  });

  const onSubmit: SubmitHandler<CustomerFormValues> = (data) => {
    addCustomer(data);
    toast({
      title: 'Customer Added',
      description: `${data.name} has been added to your customer list.`,
    });
    reset();
  };

  return (
    <div className="p-4 md:p-8 grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus /> New Customer
            </CardTitle>
            <CardDescription>Add a new customer to your records.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Customer Name</Label>
                <Input id="name" {...register('name')} placeholder="e.g., John Doe" />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contact">Contact Info (Phone/Email)</Label>
                <Input id="contact" {...register('contact')} placeholder="e.g., 0300-1234567" />
                {errors.contact && <p className="text-sm text-destructive">{errors.contact.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="vehicleNumber">Vehicle Number (Optional)</Label>
                <Input id="vehicleNumber" {...register('vehicleNumber')} placeholder="e.g., ABC-123" />
                {errors.vehicleNumber && <p className="text-sm text-destructive">{errors.vehicleNumber.message}</p>}
              </div>

              <Button type="submit" className="w-full">Add Customer</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <List /> Customer List
            </CardTitle>
            <CardDescription>
              A record of all your customers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {customers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date Added</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Vehicle No.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map(c => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{format(new Date(c.timestamp), 'PP')}</TableCell>
                        <TableCell>{c.name}</TableCell>
                        <TableCell>{c.contact}</TableCell>
                        <TableCell>{c.vehicleNumber || 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                <Users className="w-16 h-16" />
                <h3 className="text-xl font-semibold">No Customers Recorded</h3>
                <p>Use the form to add your first customer.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
