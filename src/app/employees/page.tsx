
'use client';

import { useState } from 'react';
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Briefcase, UserPlus, List, Calendar as CalendarIcon } from 'lucide-react';
import { format, getMonth, setMonth } from 'date-fns';
import { useEmployees } from '@/hooks/use-employees';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useExpenses } from '@/hooks/use-expenses';
import type { Employee } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCustomers } from '@/hooks/use-customers';
import { useCustomerPayments } from '@/hooks/use-customer-payments';

const employeeSchema = z.object({
  name: z.string().min(1, 'Employee name is required'),
  mobileNumber: z.string().optional(),
  position: z.string().min(1, 'Position is required'),
  salary: z.coerce.number().min(0, 'Salary cannot be negative'),
  hireDate: z.date({ required_error: "A hire date is required."}),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

const months = Array.from({ length: 12 }, (_, i) => ({
  value: i.toString(),
  label: format(setMonth(new Date(), i), 'MMMM'),
}));

export default function EmployeesPage() {
  const { employees, addEmployee } = useEmployees();
  const { addExpense } = useExpenses();
  const { customers, addCustomer } = useCustomers();
  const { addCustomerPayment } = useCustomerPayments();

  const { toast } = useToast();
  
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(getMonth(new Date()).toString());

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
  
  const handlePaySalary = () => {
    if (!selectedEmployee) return;

    const monthName = months.find(m => m.value === selectedMonth)?.label;
    const expenseDescription = `Salary for ${selectedEmployee.name} for ${monthName}`;
    const paymentDescription = `Salary for ${monthName}`;

    // 1. Log the salary as an expense
    addExpense({
      description: expenseDescription,
      category: 'Salaries',
      amount: selectedEmployee.salary,
      timestamp: new Date().toISOString(),
    });

    // 2. Find or create a customer record for the employee
    let employeeAsCustomer = customers.find(c => c.name.toLowerCase() === selectedEmployee.name.toLowerCase() && c.area === 'Employee');
    
    if (!employeeAsCustomer) {
        employeeAsCustomer = addCustomer({
            name: selectedEmployee.name,
            contact: selectedEmployee.mobileNumber || '',
            area: 'Employee',
        });
    }
    
    // 3. Log a payment against the employee's customer record, which acts as a CREDIT
    addCustomerPayment({
        customerId: employeeAsCustomer.id,
        customerName: employeeAsCustomer.name,
        amount: selectedEmployee.salary,
        paymentMethod: 'Salary', // Use a special method to identify this as a salary
    });


    toast({
      title: 'Salary Paid and Recorded',
      description: `Salary for ${selectedEmployee.name} has been logged as an expense and a credit in their ledger.`,
    });

    setSelectedEmployee(null); // Close the dialog
  };

  return (
    <>
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
                      <TableHead>Position</TableHead>
                      <TableHead className="text-right">Salary</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map(e => (
                        <TableRow key={e.id}>
                          <TableCell className="font-medium">{format(new Date(e.hireDate), 'PP')}</TableCell>
                          <TableCell>
                            <div>{e.name}</div>
                            <div className="text-xs text-muted-foreground">{e.mobileNumber || 'No mobile'}</div>
                          </TableCell>
                          <TableCell>{e.position}</TableCell>
                          <TableCell className="text-right">{e.salary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                          <TableCell className="text-center">
                            <Button size="sm" onClick={() => setSelectedEmployee(e)}>Pay Salary</Button>
                          </TableCell>
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

      <Dialog open={!!selectedEmployee} onOpenChange={(isOpen) => !isOpen && setSelectedEmployee(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pay Salary for {selectedEmployee?.name}</DialogTitle>
            <DialogDescription>
              Select the month for this salary payment. The amount is fixed at PKR {selectedEmployee?.salary.toLocaleString()}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="salaryMonth">Salary Month</Label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger id="salaryMonth">
                <SelectValue placeholder="Select a month" />
              </SelectTrigger>
              <SelectContent>
                {months.map(month => (
                  <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedEmployee(null)}>Cancel</Button>
            <Button onClick={handlePaySalary}>Confirm Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
