
'use client';

import { useCallback } from 'react';
import type { Employee, Expense } from '@/lib/types';
import { useDatabaseCollection } from './use-database-collection';
import { useCustomers } from './use-customers';
import { useExpenses } from './use-expenses';

const COLLECTION_NAME = 'employees';

interface PaySalaryProps {
    employee: Employee;
    amount: number;
    postingDate: Date;
    period: string;
}

export function useEmployees() {
  const { data: employees, addDoc, updateDoc, deleteDoc, loading } = useDatabaseCollection<Employee>(COLLECTION_NAME);
  const { addCustomer } = useCustomers();
  const { addExpense } = useExpenses();

  const addEmployee = useCallback(async (employee: Omit<Employee, 'id' | 'timestamp'>): Promise<Employee> => {
    const dataWithTimestamp = { ...employee, timestamp: new Date().toISOString() };
    const newDoc = await addDoc(dataWithTimestamp);

    // Create a corresponding customer record for ledger purposes, using the same ID
    await addCustomer({
        name: newDoc.name,
        contact: newDoc.mobileNumber || '',
        area: 'Employee',
        isPartner: false,
        isEmployee: true,
    }, newDoc.id);

    return newDoc;
  }, [addDoc, addCustomer]);

  const updateEmployee = useCallback((id: string, updatedDetails: Partial<Omit<Employee, 'id' | 'timestamp'>>) => {
    updateDoc(id, updatedDetails);
  }, [updateDoc]);

  const deleteEmployee = useCallback((id: string) => {
    deleteDoc(id);
  }, [deleteDoc]);
  
  const paySalary = useCallback(async ({ employee, amount, postingDate, period }: PaySalaryProps) => {
    const paymentTimestamp = postingDate.toISOString();
    const expenseDescription = `Salary for ${employee.name} for ${period}`;

    // Log the salary as a business expense, and tag it with the employee's ID
    const expense: Omit<Expense, 'id'> = {
      description: expenseDescription,
      category: 'Salaries',
      amount: amount,
      timestamp: paymentTimestamp,
      employeeId: employee.id, // Link the expense to the employee
    };
    
    await addExpense(expense);

  }, [addExpense]);


  return { 
    employees: employees || [], 
    addEmployee, 
    updateEmployee, 
    deleteEmployee,
    paySalary,
    isLoaded: !loading 
  };
}
