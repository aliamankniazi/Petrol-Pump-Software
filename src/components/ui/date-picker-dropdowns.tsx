
'use client';

import * as React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getYear, getMonth, getDate, getDaysInMonth } from 'date-fns';

interface DatePickerDropdownsProps {
  date: Date;
  onDateChange: (newDate: Date) => void;
  disabled?: boolean;
}

const years = Array.from({ length: 10 }, (_, i) => getYear(new Date()) - i);
const months = Array.from({ length: 12 }, (_, i) => ({
  value: i,
  label: new Date(0, i).toLocaleString('default', { month: 'long' }),
}));

export function DatePickerDropdowns({ date, onDateChange, disabled }: DatePickerDropdownsProps) {
  const selectedYear = getYear(date);
  const selectedMonth = getMonth(date);
  const selectedDay = getDate(date);

  const daysInMonth = getDaysInMonth(date);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const handleYearChange = (yearStr: string) => {
    const year = parseInt(yearStr, 10);
    const newDate = new Date(date);
    newDate.setFullYear(year);
    onDateChange(newDate);
  };

  const handleMonthChange = (monthStr: string) => {
    const month = parseInt(monthStr, 10);
    const newDate = new Date(date);
    newDate.setMonth(month);
    // Adjust day if it's out of bounds for the new month
    if (newDate.getDate() !== selectedDay) {
        newDate.setDate(getDaysInMonth(newDate));
    }
    onDateChange(newDate);
  };

  const handleDayChange = (dayStr: string) => {
    const day = parseInt(dayStr, 10);
    const newDate = new Date(date);
    newDate.setDate(day);
    onDateChange(newDate);
  };

  return (
    <div className="flex gap-2">
      <Select value={selectedDay.toString()} onValueChange={handleDayChange} disabled={disabled}>
        <SelectTrigger><SelectValue placeholder="Day" /></SelectTrigger>
        <SelectContent>
          {days.map(day => <SelectItem key={day} value={day.toString()}>{day}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={selectedMonth.toString()} onValueChange={handleMonthChange} disabled={disabled}>
        <SelectTrigger><SelectValue placeholder="Month" /></SelectTrigger>
        <SelectContent>
          {months.map(month => <SelectItem key={month.value} value={month.value.toString()}>{month.label}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={selectedYear.toString()} onValueChange={handleYearChange} disabled={disabled}>
        <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
        <SelectContent>
          {years.map(year => <SelectItem key={year} value={year.toString()}>{year}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
