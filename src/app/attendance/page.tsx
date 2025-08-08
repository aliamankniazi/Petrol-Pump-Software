
'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Check, X, Minus, Calendar as CalendarIcon, UserCheck, LayoutDashboard, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDaysInMonth, addMonths, subMonths } from 'date-fns';
import { useEmployees } from '@/hooks/use-employees';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from '@/components/ui/label';
import type { AttendanceStatus, Employee } from '@/lib/types';
import { useAttendance } from '@/hooks/use-attendance';
import Link from 'next/link';

export default function AttendancePage() {
  const { employees, isLoaded: employeesLoaded } = useEmployees();
  const { attendanceByDate, addOrUpdateAttendance, isLoaded: attendanceLoaded } = useAttendance();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const { toast } = useToast();

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setIsCalendarOpen(false);
    }
  };

  const handleAttendanceChange = useCallback((employee: Employee, status: AttendanceStatus) => {
    addOrUpdateAttendance({
      employeeId: employee.id!,
      employeeName: employee.name,
      date: format(selectedDate, 'yyyy-MM-dd'),
      status: status,
    });
    toast({
      title: 'Attendance Updated',
      description: `${employee.name}'s attendance for ${format(selectedDate, 'PPP')} marked as ${status}.`,
    });
  }, [selectedDate, addOrUpdateAttendance, toast]);
  
  const currentMonthDays = useMemo(() => {
    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);
    return eachDayOfInterval({ start, end });
  }, [selectedDate]);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <Card>
        <CardHeader>
            <div className='flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4'>
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <UserCheck /> Employee Attendance
                    </CardTitle>
                    <CardDescription>Mark daily attendance for all employees.</CardDescription>
                </div>
                 <div className='print:hidden flex gap-2'>
                    <Button asChild variant="outline">
                        <Link href="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" /> Go to Dashboard</Link>
                    </Button>
                </div>
            </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-4">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => setSelectedDate(subMonths(selectedDate, 1))}><ChevronLeft/></Button>
                <span className="font-semibold text-lg w-32 text-center">{format(selectedDate, 'MMMM yyyy')}</span>
                <Button variant="outline" size="icon" onClick={() => setSelectedDate(addMonths(selectedDate, 1))}><ChevronRight/></Button>
              </div>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn("w-full sm:w-[240px] justify-start text-left font-normal")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(selectedDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
          </div>
        </CardHeader>
        <CardContent>
            {!employeesLoaded ? <p>Loading employees...</p> : (
            <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Attendance Status for {format(selectedDate, 'PPP')}</TableHead>
                        <TableHead className="text-right">Monthly Summary</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {employees.map(employee => {
                        const attendanceId = `${employee.id}_${format(selectedDate, 'yyyy-MM-dd')}`;
                        const currentStatus = attendanceByDate.get(attendanceId)?.status;

                        const monthAttendance = currentMonthDays.map(day => {
                            const id = `${employee.id}_${format(day, 'yyyy-MM-dd')}`;
                            return attendanceByDate.get(id)?.status;
                        });

                        const presentDays = monthAttendance.filter(s => s === 'Present').length;
                        const absentDays = monthAttendance.filter(s => s === 'Absent').length;
                        const halfDays = monthAttendance.filter(s => s === 'Half Day').length;
                        const paidLeaves = monthAttendance.filter(s => s === 'Paid Leave').length;


                        return (
                        <TableRow key={employee.id}>
                            <TableCell className="font-medium">{employee.name}</TableCell>
                            <TableCell>
                                <RadioGroup 
                                    defaultValue={currentStatus} 
                                    className="flex gap-4"
                                    onValueChange={(status: AttendanceStatus) => handleAttendanceChange(employee, status)}
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="Present" id={`present-${employee.id}`} />
                                        <Label htmlFor={`present-${employee.id}`}>Present</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="Absent" id={`absent-${employee.id}`} />
                                        <Label htmlFor={`absent-${employee.id}`}>Absent</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="Half Day" id={`half-${employee.id}`} />
                                        <Label htmlFor={`half-${employee.id}`}>Half Day</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="Paid Leave" id={`leave-${employee.id}`} />
                                        <Label htmlFor={`leave-${employee.id}`}>Paid Leave</Label>
                                    </div>
                                </RadioGroup>
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2 text-xs">
                                    <span className="text-green-600 font-semibold">P: {presentDays + paidLeaves}</span>
                                    <span className="text-destructive font-semibold">A: {absentDays}</span>
                                    <span className="text-yellow-600 font-semibold">H: {halfDays}</span>
                                </div>
                            </TableCell>
                        </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
            </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
