
'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Check, X, Minus, UserCheck, LayoutDashboard, ChevronLeft, ChevronRight, CircleDot, RotateCcw } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDaysInMonth, addMonths, subMonths, addDays, getDay, isToday } from 'date-fns';
import { useEmployees } from '@/hooks/use-employees';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from '@/components/ui/label';
import type { AttendanceStatus, Employee } from '@/lib/types';
import { useAttendance } from '@/hooks/use-attendance';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DatePickerDropdowns } from '@/components/ui/date-picker-dropdowns';

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CalendarCell = ({ status, isSelectedDay }: { status?: AttendanceStatus, isSelectedDay?: boolean }) => {
    let styles = "w-4 h-4 rounded-full";
    let icon = null;
    let tooltipText = "No Record";

    if (isSelectedDay) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                       <CircleDot className="w-4 h-4 text-primary" />
                    </TooltipTrigger>
                    <TooltipContent><p>Selected Day</p></TooltipContent>
                </Tooltip>
            </TooltipProvider>
        )
    }

    switch(status) {
        case 'Present':
            styles += " bg-green-500";
            icon = <Check className="w-3 h-3 text-white"/>;
            tooltipText = "Present";
            break;
        case 'Absent':
            styles += " bg-red-500";
            icon = <X className="w-3 h-3 text-white"/>;
            tooltipText = "Absent";
            break;
        case 'Half Day':
            styles += " bg-yellow-500";
            icon = <Minus className="w-3 h-3 text-white"/>;
            tooltipText = "Half Day";
            break;
        case 'Paid Leave':
            styles += " bg-blue-500";
            icon = <Check className="w-3 h-3 text-white"/>;
            tooltipText = "Paid Leave";
            break;
        default:
            styles += " bg-gray-200 dark:bg-gray-700";
            break;
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className={cn("flex items-center justify-center", styles)}>
                        {icon}
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{tooltipText}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

export default function AttendancePage() {
  const { employees, isLoaded: employeesLoaded } = useEmployees();
  const { attendanceByDate, addOrUpdateAttendance, deleteAttendance, isLoaded: attendanceLoaded } = useAttendance();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setSelectedDate(new Date());
  }, []);

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleAttendanceChange = useCallback((employee: Employee, status: AttendanceStatus) => {
    if (!selectedDate) return;
    addOrUpdateAttendance({
      employeeId: employee.id!,
      employeeName: employee.name,
      date: format(selectedDate, 'yyyy-MM-dd'),
      status: status,
    });
    toast({
      title: 'Attendance Submitted',
      description: `${employee.name}'s attendance for ${format(selectedDate, 'PPP')} marked as ${status}.`,
    });
    setSelectedDate(addDays(selectedDate, 1));
  }, [selectedDate, addOrUpdateAttendance, toast]);

  const handleClearAttendance = useCallback((employeeId: string) => {
      if (!selectedDate) return;
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      deleteAttendance(employeeId, dateString);
      toast({
        title: 'Attendance Cleared',
        description: `Attendance for ${format(selectedDate, 'PPP')} has been cleared.`,
      });
  }, [selectedDate, deleteAttendance, toast]);

  const handleMarkAllPresent = useCallback(() => {
    if (!selectedDate) return;
    const dateString = format(selectedDate, 'yyyy-MM-dd');
    employees.forEach(employee => {
        addOrUpdateAttendance({
            employeeId: employee.id!,
            employeeName: employee.name,
            date: dateString,
            status: 'Present'
        });
    });
    toast({
        title: 'Attendance Marked',
        description: `All employees marked as Present for ${format(selectedDate, 'PPP')}.`,
    });
    setSelectedDate(addDays(selectedDate, 1));
  }, [selectedDate, employees, addOrUpdateAttendance, toast]);
  
  const currentMonthDays = useMemo(() => {
    if (!selectedDate) return [];
    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);
    return eachDayOfInterval({ start, end });
  }, [selectedDate]);

  if (!isClient || !selectedDate) {
    return null;
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <Card>
        <CardHeader>
            <div className='flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4'>
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <UserCheck /> Employee Attendance
                    </CardTitle>
                    <CardDescription>Mark daily attendance for all employees. You can mark all as present for faster entry.</CardDescription>
                </div>
                 <div className='print:hidden flex gap-2'>
                    <Button asChild variant="outline">
                        <Link href="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" /> Go to Dashboard</Link>
                    </Button>
                </div>
            </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => setSelectedDate(subMonths(selectedDate, 1))}><ChevronLeft/></Button>
                <span className="font-semibold text-lg w-32 text-center">{format(selectedDate, 'MMMM yyyy')}</span>
                <Button variant="outline" size="icon" onClick={() => setSelectedDate(addMonths(selectedDate, 1))}><ChevronRight/></Button>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <DatePickerDropdowns date={selectedDate} onDateChange={handleDateChange} />
                 <Button onClick={handleMarkAllPresent}>Mark All Present</Button>
              </div>
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
                        <TableHead className="text-right">Monthly Attendance</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {employees.map(employee => {
                        const attendanceId = `${employee.id}_${format(selectedDate, 'yyyy-MM-dd')}`;
                        const currentStatus = attendanceByDate.get(attendanceId)?.status;

                        const monthAttendance = new Map<number, AttendanceStatus>();
                        currentMonthDays.forEach(day => {
                            const id = `${employee.id}_${format(day, 'yyyy-MM-dd')}`;
                            const record = attendanceByDate.get(id);
                            if (record) {
                                monthAttendance.set(day.getDate(), record.status);
                            }
                        });

                        const firstDayOfMonth = getDay(startOfMonth(selectedDate));
                        const leadingNulls: (number | null)[] = Array.from({length: firstDayOfMonth}, () => null);
                        const calendarDays: (number | null)[] = leadingNulls.concat(currentMonthDays.map(d => d.getDate()));


                        return (
                        <TableRow key={employee.id}>
                            <TableCell className="font-medium">{employee.name}</TableCell>
                            <TableCell>
                                <div className="flex items-center gap-4">
                                <RadioGroup 
                                    defaultValue={currentStatus} 
                                    value={currentStatus}
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
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" onClick={() => handleClearAttendance(employee.id!)}>
                                                <RotateCcw className="w-4 h-4 text-muted-foreground" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Clear Attendance</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="p-2 bg-muted/50 rounded-md">
                                    <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-muted-foreground">
                                        {WEEK_DAYS.map(day => <div key={day}>{day}</div>)}
                                    </div>
                                    <div className="grid grid-cols-7 gap-1 mt-1">
                                        {calendarDays.map((day, index) => (
                                            <div key={index} className="flex justify-center items-center h-6">
                                                {day ? (
                                                    <CalendarCell 
                                                        status={monthAttendance.get(day)} 
                                                        isSelectedDay={day === selectedDate.getDate()}
                                                    />
                                                ) : <div />}
                                            </div>
                                        ))}
                                    </div>
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
