
'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Wallet, TrendingUp, TrendingDown, ChevronsUpDown, Check } from 'lucide-react';
import { format, getMonth, setMonth, getDaysInMonth } from 'date-fns';
import { useEmployees } from '@/hooks/use-employees';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { Employee } from '@/lib/types';
import { useAttendance } from '@/hooks/use-attendance';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Textarea } from '@/components/ui/textarea';
import { DatePickerDropdowns } from '@/components/ui/date-picker-dropdowns';

const salaryPaymentSchema = z.object({
  employeeId: z.string().min(1, 'Please select an employee.'),
  month: z.string().min(1, 'Please select a month.'),
  year: z.coerce.number(),
  postingDate: z.date({ required_error: "A posting date is required."}),
  notes: z.string().optional(),
});

type SalaryPaymentFormValues = z.infer<typeof salaryPaymentSchema>;

const months = Array.from({ length: 12 }, (_, i) => ({
  value: i.toString(),
  label: format(setMonth(new Date(), i), 'MMMM'),
}));
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

export function SalaryPaymentForm() {
  const { employees, paySalary, isLoaded: employeesLoaded } = useEmployees();
  const { attendance, isLoaded: attendanceLoaded } = useAttendance();
  const { toast } = useToast();
  
  const [isClient, setIsClient] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState('');
  useEffect(() => { setIsClient(true); }, []);
  
  const filteredEmployees = useMemo(() => {
    if (!employeeSearch) return employees;
    return employees.filter(e => e.name.toLowerCase().includes(employeeSearch.toLowerCase()));
  }, [employees, employeeSearch]);

  const { control, handleSubmit, watch, reset, setValue } = useForm<SalaryPaymentFormValues>({
    resolver: zodResolver(salaryPaymentSchema),
    defaultValues: {
      month: getMonth(new Date()).toString(),
      year: currentYear,
      postingDate: new Date(),
      notes: '',
    }
  });

  const selectedEmployeeId = watch('employeeId');
  const selectedMonth = watch('month');
  const selectedYear = watch('year');
  
  const selectedEmployee = useMemo(() => {
    return employees.find(e => e.id === selectedEmployeeId);
  }, [selectedEmployeeId, employees]);

  const salaryCalculation = useMemo(() => {
    if (!selectedEmployee || !attendanceLoaded) return null;

    const salaryMonth = setMonth(new Date(selectedYear, 0, 1), parseInt(selectedMonth));
    const daysInMonth = getDaysInMonth(salaryMonth);
    
    const employeeAttendance = attendance.filter(a => 
      a.employeeId === selectedEmployee.id && 
      new Date(a.date).getMonth() === parseInt(selectedMonth) &&
      new Date(a.date).getFullYear() === selectedYear
    );
    
    const presentDays = employeeAttendance.filter(a => a.status === 'Present' || a.status === 'Paid Leave').length;
    const halfDays = employeeAttendance.filter(a => a.status === 'Half Day').length;
    const absentDays = employeeAttendance.filter(a => a.status === 'Absent').length;

    const perDaySalary = selectedEmployee.salary / daysInMonth;
    const payableSalary = (presentDays * perDaySalary) + (halfDays * perDaySalary * 0.5);
    const totalPresentDays = presentDays + (halfDays * 0.5);

    return {
      presentDays: totalPresentDays,
      absentDays: absentDays + (halfDays * 0.5),
      payableSalary,
      daysInMonth: daysInMonth,
    };

  }, [selectedEmployee, selectedMonth, selectedYear, attendance, attendanceLoaded]);

  const onSubmit: SubmitHandler<SalaryPaymentFormValues> = useCallback(async (data) => {
    if (!selectedEmployee || !salaryCalculation) return;

    const monthName = months.find(m => m.value === data.month)?.label;

    await paySalary({
      employee: selectedEmployee,
      amount: salaryCalculation.payableSalary,
      postingDate: data.postingDate,
      period: `${monthName} ${data.year}`,
      notes: data.notes,
    });

    toast({
      title: 'Salary Paid',
      description: `Salary for ${selectedEmployee.name} has been logged as an expense and credited to their ledger.`,
    });
    
    reset({
        employeeId: '',
        month: getMonth(new Date()).toString(),
        year: currentYear,
        postingDate: new Date(),
        notes: '',
    });

  }, [selectedEmployee, salaryCalculation, paySalary, toast, reset]);
  
  if (!isClient) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-xl mx-auto">
        <div className="space-y-2">
            <Label>Employee</Label>
            <Controller
                name="employeeId"
                control={control}
                render={({ field }) => (
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" className="w-full justify-between">
                                {field.value ? employees.find(e => e.id === field.value)?.name : "Select an employee"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                                <CommandInput placeholder="Search employee..." onValueChange={setEmployeeSearch} />
                                <CommandList>
                                    <CommandEmpty>No employee found.</CommandEmpty>
                                    <CommandGroup>
                                        {filteredEmployees.map(e => (
                                            <CommandItem key={e.id} value={e.id!} onSelect={currentValue => field.onChange(currentValue === field.value ? "" : currentValue)}>
                                                <Check className={cn("mr-2 h-4 w-4", field.value === e.id ? "opacity-100" : "opacity-0")} />
                                                {e.name}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                )}
            />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <Label htmlFor="salaryMonth">Salary Month</Label>
                 <Controller
                    name="month"
                    control={control}
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
                    control={control}
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
                control={control}
                render={({ field }) => (
                  <DatePickerDropdowns date={field.value} onDateChange={field.onChange} />
                )}
             />
        </div>

         <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                    <Textarea
                        id="notes"
                        placeholder="e.g., Including overtime payment"
                        {...field}
                    />
                )}
            />
        </div>
        
        {salaryCalculation && selectedEmployee && (
            <div className='space-y-4 rounded-lg bg-muted p-4'>
                <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Base Salary</span>
                    <span className="font-medium">PKR {selectedEmployee.salary.toLocaleString()}</span>
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

        <Button type="submit" className="w-full" disabled={!salaryCalculation}>Confirm Payment</Button>
    </form>
  );
}
