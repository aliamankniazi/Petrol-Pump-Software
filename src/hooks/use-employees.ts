
'use client';

import { useCallback } from 'react';
import type { Employee } from '@/lib/types';
import { useDatabaseCollection } from './use-database-collection';
import { useCustomers } from './use-customers';
import { useExpenses } from './use-expenses';
import { useCustomerPayments } from './use-customer-payments';

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
  const { addCustomerPayment } = useCustomerPayments();

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

    // 1. Log the salary as a business expense (debit)
    await addExpense({
      description: expenseDescription,
      category: 'Salaries',
      amount: amount,
      timestamp: paymentTimestamp,
    });

    // 2. Log the payment as a credit against the employee's ledger
    await addCustomerPayment({
        customerId: employee.id!,
        customerName: employee.name,
        amount: amount,
        paymentMethod: 'Cash', // Assuming salary is paid in cash
        timestamp: paymentTimestamp,
    });

  }, [addExpense, addCustomerPayment]);


  return { 
    employees: employees || [], 
    addEmployee, 
    updateEmployee, 
    deleteEmployee,
    paySalary,
    isLoaded: !loading 
  };
}
