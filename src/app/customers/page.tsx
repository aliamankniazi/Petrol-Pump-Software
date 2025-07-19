
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
import { Users, UserPlus, List, BookText } from 'lucide-react';
import { format } from 'date-fns';
import { useCustomers } from '@/hooks/use-customers';
import Link from 'next/link';
import Barcode from 'react-barcode';

const customerSchema = z.object({
  name: z.string().min(1, 'Customer name is required'),
  contact: z.string().min(1, 'Contact information is required'),
  vehicleNumber: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      aria-hidden="true"
      fill="currentColor"
      viewBox="0 0 448 512"
      {...props}
    >
      <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 .9c34.9 0 67.7 13.5 92.8 38.6 25.1 25.1 38.6 57.9 38.6 92.8 0 97.8-79.7 177.6-177.6 177.6-34.9 0-67.7-13.5-92.8-38.6s-38.6-57.9-38.6-92.8c0-97.8 79.7-177.6 177.6-177.6zm93.8 148.6c-3.3-1.5-19.8-9.8-23-11.5s-5.5-2.5-7.8 2.5c-2.3 5-8.7 11.5-10.7 13.8s-3.9 2.5-7.3 1c-3.3-1.5-14-5.2-26.6-16.5c-9.9-8.9-16.5-19.8-18.5-23s-2-5.5-.6-7.5c1.4-2 3-3.3 4.5-5.2s3-4.2 4.5-7.1c1.5-2.8.8-5.2-.4-6.8s-7.8-18.5-10.7-25.4c-2.8-6.8-5.6-5.8-7.8-5.8s-4.5-.4-6.8-.4-7.8 1.1-11.8 5.5c-4 4.4-15.2 14.8-15.2 36.1s15.5 41.9 17.5 44.8c2 2.8 30.4 46.4 73.8 65.4 10.8 4.8 19.3 7.6 25.9 9.8s11.1 1.5 15.2 1c4.8-.7 19.8-8.2 22.5-16.1s2.8-14.8 2-16.1c-.8-1.5-3.3-2.5-6.8-4z"></path>
    </svg>
);

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

  const formatPhoneNumberForWhatsApp = (phone: string) => {
    // This is a simple formatter, might need to be more robust for different formats
    return phone.replace(/[^0-9]/g, '');
  }

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
                <Label htmlFor="contact">Contact Info (Phone Number)</Label>
                <Input id="contact" {...register('contact')} placeholder="e.g., 923001234567" />
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
                    <TableHead>Customer Details</TableHead>
                    <TableHead>Barcode</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map(c => (
                      <TableRow key={c.id}>
                        <TableCell>
                          <div className="font-medium">{c.name}</div>
                          <div className="text-sm text-muted-foreground">{c.contact}</div>
                          <div className="text-xs text-muted-foreground">{c.vehicleNumber || 'N/A'}</div>
                          <div className="text-xs text-muted-foreground">Added: {format(new Date(c.timestamp), 'PP')}</div>
                        </TableCell>
                        <TableCell>
                          <Barcode value={c.id} height={40} width={1.5} fontSize={10} margin={2} />
                        </TableCell>
                        <TableCell className="text-center space-x-1">
                           <Button asChild variant="ghost" size="icon" title="View Ledger">
                              <Link href={`/customers/${c.id}/ledger`}>
                                <BookText className="w-5 h-5" />
                              </Link>
                           </Button>
                           <Button asChild variant="ghost" size="icon" className="text-green-500 hover:text-green-600" title={`Message ${c.name} on WhatsApp`}>
                             <a 
                              href={`https://wa.me/${formatPhoneNumberForWhatsApp(c.contact)}`}
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                               <WhatsAppIcon className="w-5 h-5" />
                            </a>
                          </Button>
                        </TableCell>
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
