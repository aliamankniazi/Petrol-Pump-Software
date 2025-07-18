'use client';

import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Briefcase, UserPlus, List } from 'lucide-react';
import { format } from 'date-fns';
import { useEmployees } from '@/hooks/use-employees';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

const employeeSchema = z.object({
  name: z.string().min(1, 'Employee name is required'),
  mobileNumber: z.string().optional(),
  position: z.string().min(1, 'Position is required'),
  salary: z.coerce.number().min(0, 'Salary cannot be negative'),
  hireDate: z.date({ required_error: "A hire date is required."}),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

export default function HumanResourcesPage() {
  const { employees, addEmployee } = useEmployees();
  const { toast } = useToast();
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
  });

  const onSubmit: SubmitHandler<EmployeeFormValues> = (data) => {
    addEmployee(data);
    toast({
      title: 'Employee Added',
      description: `${data.name} has been added to your employee records.`,
    });
    reset();
  };

  return (
    <div className="p-4 md:p-8 grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus /> New Employee
            </CardTitle>
            <CardDescription>Add a new employee to your records.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Employee Name</Label>
                <Input id="name" {...register('name')} placeholder="e.g., Ali Khan" />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="mobileNumber">Mobile Number (Optional)</Label>
                <Input id="mobileNumber" {...register('mobileNumber')} placeholder="e.g., 03001234567" />
                {errors.mobileNumber && <p className="text-sm text-destructive">{errors.mobileNumber.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Input id="position" {...register('position')} placeholder="e.g., Pump Attendant, Manager" />
                {errors.position && <p className="text-sm text-destructive">{errors.position.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="salary">Salary (PKR)</Label>
                <Input id="salary" type="number" {...register('salary')} placeholder="e.g., 25000" step="100" />
                {errors.salary && <p className="text-sm text-destructive">{errors.salary.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Hire Date</Label>
                <Controller
                  name="hireDate"
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
                {errors.hireDate && <p className="text-sm text-destructive">{errors.hireDate.message}</p>}
              </div>

              <Button type="submit" className="w-full">Add Employee</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <List /> Employee List
            </CardTitle>
            <CardDescription>
              A record of all your current employees.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {employees.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hire Date</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Mobile Number</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead className="text-right">Salary (PKR)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map(e => (
                      <TableRow key={e.id}>
                        <TableCell className="font-medium">{format(new Date(e.hireDate), 'PP')}</TableCell>
                        <TableCell>{e.name}</TableCell>
                        <TableCell>{e.mobileNumber || 'N/A'}</TableCell>
                        <TableCell>{e.position}</TableCell>
                        <TableCell className="text-right">{e.salary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                <Briefcase className="w-16 h-16" />
                <h3 className="text-xl font-semibold">No Employees Found</h3>
                <p>Use the form to add your first employee.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
