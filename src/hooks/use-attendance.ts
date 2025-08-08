
'use client';

import { useCallback, useMemo } from 'react';
import type { Attendance } from '@/lib/types';
import { useDatabaseCollection } from './use-database-collection';
import { format, startOfMonth, endOfMonth } from 'date-fns';

const COLLECTION_NAME = 'attendance';

export function useAttendance() {
  const { data: attendance, addDoc, updateDoc, deleteDoc, loading } = useDatabaseCollection<Attendance>(COLLECTION_NAME);

  const addOrUpdateAttendance = useCallback(async (record: Omit<Attendance, 'id' | 'timestamp'>) => {
    
    // An attendance record ID is unique by employee and date
    const recordId = `${record.employeeId}_${record.date}`;
    
    // Check if a record already exists for this employee on this date
    const existingRecord = attendance.find(a => a.id === recordId);

    const dataWithTimestamp = { ...record, timestamp: new Date().toISOString() };

    if (existingRecord) {
        // Update existing record
        await updateDoc(recordId, dataWithTimestamp);
    } else {
        // Add new record with specific ID
        await addDoc(dataWithTimestamp, recordId);
    }

  }, [addDoc, updateDoc, attendance]);

  const deleteAttendance = useCallback(async (employeeId: string, date: string) => {
    const recordId = `${employeeId}_${date}`;
    const existingRecord = attendance.find(a => a.id === recordId);
    if (existingRecord) {
      await deleteDoc(recordId);
    }
  }, [deleteDoc, attendance]);

  const getAttendanceForMonth = useCallback((employeeId: string, month: Date) => {
      const startDate = startOfMonth(month);
      const endDate = endOfMonth(month);
      
      return attendance.filter(a => 
          a.employeeId === employeeId &&
          new Date(a.date) >= startDate &&
          new Date(a.date) <= endDate
      );
  }, [attendance]);
  
  const attendanceByDate = useMemo(() => {
    const map = new Map<string, Attendance>();
    attendance.forEach(a => map.set(a.id, a));
    return map;
  }, [attendance]);

  return { 
    attendance, 
    attendanceByDate,
    addOrUpdateAttendance, 
    deleteAttendance,
    getAttendanceForMonth,
    isLoaded: !loading 
  };
}
