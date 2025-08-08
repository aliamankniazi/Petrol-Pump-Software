
'use client';

import { useCallback } from 'react';
import type { Employee } from '@/lib/types';
import { useDatabaseCollection } from './use-database-collection';
import { useCustomerPayments } from './use-customer-payments';

const COLLECTION_NAME = 'employees';

export function useEmployees() {
  const { data: employees, addDoc, updateDoc, deleteDoc, loading } = useDatabaseCollection<Employee>(COLLECTION_NAME);
  const { addCustomerPayment } = useCustomerPayments();

  const addEmployee = useCallback(async (employee: Omit<Employee, 'id' | 'timestamp'>): Promise<Employee> => {
    const dataWithTimestamp = { ...employee, timestamp: new Date().toISOString() };
    const newDoc = await addDoc(dataWithTimestamp);
    return newDoc;
  }, [addDoc]);

  const updateEmployee = useCallback((id: string, updatedDetails: Partial<Omit<Employee, 'id' | 'timestamp'>>) => {
    updateDoc(id, updatedDetails);
  }, [updateDoc]);

  const deleteEmployee = useCallback((id: string) => {
    deleteDoc(id);
  }, [deleteDoc]);
  
  const paySalary = useCallback((employeeId: string, employeeName: string, amount: number) => {
    addCustomerPayment({
        customerId: employeeId,
        customerName: employeeName,
        amount: amount,
        paymentMethod: 'Cash', // Assuming salary is cash
        timestamp: new Date().toISOString(),
    });
  }, [addCustomerPayment]);


  return { 
    employees: employees || [], 
    addEmployee, 
    updateEmployee, 
    deleteEmployee,
    paySalary,
    isLoaded: !loading 
  };
}
