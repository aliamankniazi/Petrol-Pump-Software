
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { HandCoins, Fuel, Handshake, Wallet } from "lucide-react"
import { SaleForm } from "./_components/sale-form";
import { CustomerPaymentForm } from "./_components/customer-payment-form";
import { SupplierPaymentForm } from "./_components/supplier-payment-form";
import { CashAdvanceForm } from "./_components/cash-advance-form";

export default function TransactionsPage() {
  return (
    <div className="p-4 md:p-8">
      <Tabs defaultValue="sale" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sale"><Fuel className="mr-2 h-4 w-4" />Sale</TabsTrigger>
          <TabsTrigger value="customer-payment"><HandCoins className="mr-2 h-4 w-4" />Customer Payment</TabsTrigger>
          <TabsTrigger value="supplier-payment"><Handshake className="mr-2 h-4 w-4" />Supplier Payment</TabsTrigger>
          <TabsTrigger value="cash-advance"><Wallet className="mr-2 h-4 w-4" />Cash Advance</TabsTrigger>
        </TabsList>
        <TabsContent value="sale">
          <Card>
            <CardHeader>
              <CardTitle>New Sale</CardTitle>
              <CardDescription>Create a new sales invoice for a customer or a walk-in transaction.</CardDescription>
            </CardHeader>
            <CardContent>
              <SaleForm />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="customer-payment">
          <Card>
             <CardHeader>
              <CardTitle>New Customer Payment</CardTitle>
              <CardDescription>Record a payment received from a customer.</CardDescription>
            </CardHeader>
            <CardContent>
              <CustomerPaymentForm />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="supplier-payment">
          <Card>
             <CardHeader>
              <CardTitle>New Supplier Payment</CardTitle>
              <CardDescription>Record a payment made to a supplier.</CardDescription>
            </CardHeader>
            <CardContent>
             <SupplierPaymentForm />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="cash-advance">
          <Card>
             <CardHeader>
                <CardTitle>New Cash Advance</CardTitle>
                <CardDescription>Record a cash payment made to a customer or employee.</CardDescription>
             </CardHeader>
            <CardContent>
                <CashAdvanceForm />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
