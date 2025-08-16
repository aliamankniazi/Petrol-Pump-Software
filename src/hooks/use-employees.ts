

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
    notes?: string;
}

export function useEmployees() {
  const { data: employees, addDoc, updateDoc, deleteDoc, loading } = useDatabaseCollection<Employee>(COLLECTION_NAME);
  const { addCustomerWithId } = useCustomers();
  const { addExpense } = useExpenses();

  /**
   * Adds a new employee and automatically creates a corresponding 'customer' record
   * for ledger tracking purposes. The new customer record will have `isEmployee: true`.
   * @param employee The employee data to add.
   * @returns The newly created employee object.
   */
  const addEmployee = useCallback(async (employee: Omit<Employee, 'id' | 'timestamp'>): Promise<Employee> => {
    const dataWithTimestamp = { ...employee, timestamp: new Date().toISOString() };
    const newDoc = await addDoc(dataWithTimestamp);

    // Create a corresponding customer record for ledger purposes, using the same ID
    await addCustomerWithId(newDoc.id, {
        name: newDoc.name,
        contact: newDoc.mobileNumber || '',
        area: 'Employee',
        isPartner: false,
        isEmployee: true,
    });

    return newDoc;
  }, [addDoc, addCustomerWithId]);

  const updateEmployee = useCallback((id: string, updatedDetails: Partial<Omit<Employee, 'id' | 'timestamp'>>) => {
    updateDoc(id, updatedDetails);
  }, [updateDoc]);

  const deleteEmployee = useCallback((id: string) => {
    deleteDoc(id);
  }, [deleteDoc]);
  
  /**
   * Pays an employee's salary. This action creates an 'Expense' record of category 'Salaries'
   * and links it to the employee. This expense will appear as a credit in the employee's ledger.
   * @param {PaySalaryProps} props The salary payment details.
   */
  const paySalary = useCallback(async ({ employee, amount, postingDate, period, notes }: PaySalaryProps) => {
    const expenseDescription = `Salary for ${employee.name} for ${period}`;

    // Log the salary as a business expense, and tag it with the employee's ID
    const expense: Omit<Expense, 'id' | 'timestamp'> & { date: Date } = {
      description: expenseDescription,
      category: 'Salaries',
      amount: amount,
      employeeId: employee.id!, // Explicitly link the expense to the employee
      date: postingDate,
      notes: notes,
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
