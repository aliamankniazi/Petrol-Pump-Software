
'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Briefcase, UserPlus, List, Calendar as CalendarIcon, Trash2, AlertTriangle, Edit, LayoutDashboard, Wallet, TrendingUp, TrendingDown, BookText, ArrowRightLeft } from 'lucide-react';
import { format, getMonth, setMonth, getDaysInMonth } from 'date-fns';
import { useEmployees } from '@/hooks/use-employees';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import type { Employee } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useCustomers } from '@/hooks/use-customers';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import Link from 'next/link';
import { useAttendance } from '@/hooks/use-attendance';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';


const employeeSchema = z.object({
  name: z.string().min(1, 'Employee name is required'),
  mobileNumber: z.string().optional(),
  position: z.string().min(1, 'Position is required'),
  salary: z.coerce.number().min(0, 'Salary cannot be negative'),
  hireDate: z.date({ required_error: "A hire date is required."}),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

const salaryPaymentSchema = z.object({
  month: z.string().min(1, 'Please select a month.'),
  year: z.coerce.number(),
  postingDate: z.date({ required_error: "A posting date is required."}),
});

type SalaryPaymentFormValues = z.infer<typeof salaryPaymentSchema>;

const months = Array.from({ length: 12 }, (_, i) => ({
  value: i.toString(),
  label: format(setMonth(new Date(), i), 'MMMM'),
}));
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);


export default function EmployeesPage() {
  const { employees, addEmployee, updateEmployee, deleteEmployee, paySalary, isLoaded } = useEmployees();
  const { attendance, isLoaded: attendanceLoaded } = useAttendance();
  const { updateCustomer } = useCustomers();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const { toast } = useToast();
  
  const [employeeToEdit, setEmployeeToEdit] = useState<Employee | null>(null);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [employeeToPay, setEmployeeToPay] = useState<Employee | null>(null);


  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: { hireDate: new Date() }
  });
  
  const { register: registerEdit, handleSubmit: handleSubmitEdit, reset: resetEdit, setValue: setEditValue, control: controlEdit, formState: { errors: editErrors } } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
  });

  const { control: controlSalary, handleSubmit: handleSubmitSalary, watch: watchSalary, reset: resetSalary } = useForm<SalaryPaymentFormValues>({
    resolver: zodResolver(salaryPaymentSchema),
    defaultValues: {
      month: getMonth(new Date()).toString(),
      year: currentYear,
      postingDate: new Date(),
    }
  });
  
  const selectedSalaryMonth = watchSalary('month');
  const selectedSalaryYear = watchSalary('year');

  const salaryCalculation = useMemo(() => {
    if (!employeeToPay || !attendanceLoaded) return null;

    const salaryMonth = setMonth(new Date(selectedSalaryYear, 0, 1), parseInt(selectedSalaryMonth));
    const daysInMonth = getDaysInMonth(salaryMonth);
    
    const employeeAttendance = attendance.filter(a => 
      a.employeeId === employeeToPay.id && 
      new Date(a.date).getMonth() === parseInt(selectedSalaryMonth) &&
      new Date(a.date).getFullYear() === selectedSalaryYear
    );
    
    const presentDays = employeeAttendance.filter(a => a.status === 'Present' || a.status === 'Paid Leave').length;
    const halfDays = employeeAttendance.filter(a => a.status === 'Half Day').length;
    const absentDays = employeeAttendance.filter(a => a.status === 'Absent').length;

    const perDaySalary = employeeToPay.salary / daysInMonth;
    const payableSalary = (presentDays * perDaySalary) + (halfDays * perDaySalary * 0.5);
    const totalPresentDays = presentDays + (halfDays * 0.5);

    return {
      presentDays: totalPresentDays,
      absentDays: absentDays + (halfDays * 0.5),
      payableSalary,
      daysInMonth: daysInMonth,
    };

  }, [employeeToPay, selectedSalaryMonth, selectedSalaryYear, attendance, attendanceLoaded]);


  const onAddSubmit: SubmitHandler<EmployeeFormValues> = useCallback(async (data) => {
    await addEmployee({ ...data, hireDate: data.hireDate.toISOString() });
    
    toast({
      title: 'Employee Added',
      description: `${data.name} has been added and a ledger has been created.`,
    });
    reset({ name: '', mobileNumber: '', position: '', salary: 0, hireDate: new Date() });
  }, [addEmployee, toast, reset]);

  const onEditSubmit: SubmitHandler<EmployeeFormValues> = useCallback((data) => {
    if (!employeeToEdit) return;
    updateEmployee(employeeToEdit.id, { ...data, hireDate: data.hireDate.toISOString() });
    // Also update the associated customer record for name/contact changes
    updateCustomer(employeeToEdit.id, { name: data.name, contact: data.mobileNumber || '' });
    toast({ title: 'Employee Updated', description: "The employee's details have been saved." });
    setEmployeeToEdit(null);
  }, [employeeToEdit, updateEmployee, updateCustomer, toast]);

  const handleDeleteEmployee = useCallback(() => {
    if (!employeeToDelete) return;
    // Note: Deleting employee doesn't delete the customer record to preserve ledger history.
    deleteEmployee(employeeToDelete.id);
    toast({ title: 'Employee Deleted', description: `${employeeToDelete.name} has been removed.` });
    setEmployeeToDelete(null);
  }, [employeeToDelete, deleteEmployee, toast]);

  const onPaySalarySubmit: SubmitHandler<SalaryPaymentFormValues> = useCallback(async (data) => {
    if (!employeeToPay || !salaryCalculation) return;

    const monthName = months.find(m => m.value === data.month)?.label;

    await paySalary({
      employee: employeeToPay,
      amount: salaryCalculation.payableSalary,
      postingDate: data.postingDate,
      period: `${monthName} ${data.year}`
    });

    toast({
      title: 'Salary Paid',
      description: `Salary for ${employeeToPay.name} has been logged as an expense and credited to their ledger.`,
    });
    
    setEmployeeToPay(null);

  }, [employeeToPay, salaryCalculation, paySalary, toast]);

  
  useEffect(() => {
    if (employeeToEdit) {
      setEditValue('name', employeeToEdit.name);
      setEditValue('mobileNumber', employeeToEdit.mobileNumber || '');
      setEditValue('position', employeeToEdit.position);
      setEditValue('salary', employeeToEdit.salary);
      setEditValue('hireDate', new Date(employeeToEdit.hireDate));
    }
  }, [employeeToEdit, setEditValue]);
  
  if (!isClient) {
    return null;
  }

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
              <form onSubmit={handleSubmit(onAddSubmit)} className="space-y-4">
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
                  <Input id="salary" type="number" {...register('salary')} placeholder="e.g., 25000" step="0.01" />
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
            <CardHeader className="flex flex-row justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <List /> Employee List
                </CardTitle>
                <CardDescription>
                  A record of all your current employees.
                </CardDescription>
              </div>
               <div className="flex gap-2">
                 <Button asChild variant="secondary">
                    <Link href="/transactions"><ArrowRightLeft className="mr-2 h-4 w-4" />Go to Transactions</Link>
                </Button>
                 <Button asChild variant="outline">
                    <Link href="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" /> Go to Dashboard</Link>
                </Button>
               </div>
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
                          <TableCell className="text-center space-x-0">
                            <Button asChild variant="ghost" size="icon" title="View Ledger">
                              <Link href={`/customers/${e.id}/ledger`}>
                                <BookText className="w-4 h-4" />
                              </Link>
                           </Button>
                            <Button variant="ghost" size="icon" title="Pay Salary" onClick={() => setEmployeeToPay(e)}>
                              <Wallet className="w-4 h-4 text-green-600" />
                            </Button>
                            <Button variant="ghost" size="icon" title="Edit" onClick={() => setEmployeeToEdit(e)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" title="Delete" className="text-destructive hover:text-destructive" onClick={() => setEmployeeToDelete(e)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
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

      <Dialog open={!!employeeToEdit} onOpenChange={(isOpen) => !isOpen && setEmployeeToEdit(null)}>
        <DialogContent>
          <form onSubmit={handleSubmitEdit(onEditSubmit)}>
            <DialogHeader>
              <DialogTitle>Edit Employee</DialogTitle>
              <DialogDescription>Update the details for this employee.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
               <div className="space-y-2">
                  <Label htmlFor="edit-name">Employee Name</Label>
                  <Input id="edit-name" {...registerEdit('name')} />
                  {editErrors.name && <p className="text-sm text-destructive">{editErrors.name.message}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-mobileNumber">Mobile Number (Optional)</Label>
                  <Input id="edit-mobileNumber" {...registerEdit('mobileNumber')} />
                  {editErrors.mobileNumber && <p className="text-sm text-destructive">{editErrors.mobileNumber.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-position">Position</Label>
                  <Input id="edit-position" {...registerEdit('position')} />
                  {editErrors.position && <p className="text-sm text-destructive">{editErrors.position.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-salary">Salary (PKR)</Label>
                  <Input id="edit-salary" type="number" {...registerEdit('salary')} step="0.01" />
                  {editErrors.salary && <p className="text-sm text-destructive">{editErrors.salary.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Hire Date</Label>
                  <Controller
                    name="hireDate"
                    control={controlEdit}
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
                  {editErrors.hireDate && <p className="text-sm text-destructive">{editErrors.hireDate.message}</p>}
                </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEmployeeToEdit(null)}>Cancel</Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={!!employeeToDelete} onOpenChange={(isOpen) => !isOpen && setEmployeeToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle/>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the employee: <br/>
              <strong className="font-medium text-foreground">{employeeToDelete?.name}</strong>.
              Their associated ledger will remain for historical record but they will be removed from the active employee list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEmployee} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Yes, delete employee
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!employeeToPay} onOpenChange={(isOpen) => !isOpen && setEmployeeToPay(null)}>
        <DialogContent>
            <form onSubmit={handleSubmitSalary(onPaySalarySubmit)}>
                <DialogHeader>
                    <DialogTitle>Pay Salary: {employeeToPay?.name}</DialogTitle>
                    <DialogDescription>Calculate and post salary for the selected period.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="salaryMonth">Salary Month</Label>
                            <Controller
                                name="month"
                                control={controlSalary}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger id="salaryMonth"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {months.map(month => <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="salaryYear">Year</Label>
                            <Controller
                                name="year"
                                control={controlSalary}
                                render={({ field }) => (
                                    <Select onValueChange={(val) => field.onChange(parseInt(val))} value={field.value.toString()}>
                                        <SelectTrigger id="salaryYear"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {years.map(year => <SelectItem key={year} value={year.toString()}>{year}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label>Posting Date</Label>
                        <Controller
                            name="postingDate"
                            control={controlSalary}
                            render={({ field }) => (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal",!field.value && "text-muted-foreground")}>
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
                                </Popover>
                            )}
                        />
                    </div>
                     {salaryCalculation && employeeToPay && (
                        <div className='space-y-4 rounded-lg bg-muted p-4'>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Base Salary</span>
                                <span className="font-medium">PKR {employeeToPay.salary.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Days In Month</span>
                                <span className="font-medium">{salaryCalculation.daysInMonth}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground flex items-center gap-1"><TrendingUp className="text-green-500"/> Present Days</span>
                                <span className="font-medium">{salaryCalculation.presentDays}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground flex items-center gap-1"><TrendingDown className="text-destructive"/> Absent Days</span>
                                <span className="font-medium">{salaryCalculation.absentDays}</span>
                            </div>
                            <div className="flex justify-between items-center text-lg font-bold border-t pt-2 mt-2">
                                <span className="flex items-center gap-2"><Wallet/> Payable Salary</span>
                                <span>PKR {salaryCalculation.payableSalary.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                            </div>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setEmployeeToPay(null)}>Cancel</Button>
                    <Button type="submit" disabled={!salaryCalculation}>Confirm Payment</Button>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

    