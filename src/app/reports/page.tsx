
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users,
  Calendar,
  Box,
  CreditCard,
  Banknote,
  Package,
  ShoppingCart,
  Undo,
  AreaChart,
  UserCheck,
  UserX,
  ArrowRight,
  TrendingUp,
  FileText as ReportsIcon,
  LayoutDashboard,
  Percent,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const reportLinks = [
  {
    title: 'Customer Defaulter Report',
    description: 'View customers with outstanding balances.',
    href: '/reports/customer-defaulters',
    icon: UserX,
  },
  {
    title: 'Date Wise Business Report',
    description: 'Overall summary of business activity.',
    href: '/summary',
    icon: Calendar,
  },
  {
    title: 'Product Wise Sale Report',
    description: 'Analyze sales performance by fuel type.',
    href: '/reports/product-sales',
    icon: Box,
  },
   {
    title: 'Product Profit Margin Report',
    description: 'Analyze profit margins for each product.',
    href: '/reports/product-profit-margin',
    icon: Percent,
  },
  {
    title: 'Date wise Credit Recovery',
    description: 'Track customer payments and balances.',
    href: '/credit-recovery',
    icon: CreditCard,
  },
  {
    title: 'Stock Sale & Purchase Report',
    description: 'Detailed report of stock ins and outs.',
    href: '/reports/stock-movement',
    icon: Package,
  },
  {
    title: 'Sale & Return Report',
    description: 'Unified view of all sales and returns.',
    href: '/all-transactions',
    icon: ShoppingCart,
  },
  {
    title: 'Product Stock Report',
    description: 'Current inventory levels for all products.',
    href: '/inventory',
    icon: Package,
  },
  {
    title: 'Customer Recovery & Sale',
    description: 'Individual customer transaction history.',
    href: '/partner-ledger',
    icon: UserCheck,
  },
];

export default function ReportsPage() {
  return (
    <div className="p-4 md:p-8">
      <Card>
        <CardHeader className="flex flex-row justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2"><ReportsIcon /> Reports Hub</CardTitle>
            <CardDescription>
              Select a report to view detailed analytics about your business operations.
            </CardDescription>
          </div>
           <Button asChild variant="outline">
              <Link href="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" /> Go to Dashboard</Link>
          </Button>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {reportLinks.map((report) => (
            <Link href={report.href} key={report.title} className="group">
                <Card className="hover:bg-muted/50 transition-colors h-full flex flex-col">
                    <CardHeader className="flex-row items-center gap-4 space-y-0">
                        <div className="p-3 bg-primary/10 rounded-full text-primary">
                            <report.icon className="h-6 w-6" />
                        </div>
                        <CardTitle className="text-lg">{report.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <p className="text-sm text-muted-foreground">{report.description}</p>
                    </CardContent>
                    <CardContent>
                        <div className="text-sm font-medium text-primary flex items-center gap-2 group-hover:gap-3 transition-all">
                            View Report <ArrowRight className="h-4 w-4" />
                        </div>
                    </CardContent>
                </Card>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
