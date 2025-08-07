
'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { FileText, Settings, LayoutDashboard, ShoppingCart, Receipt, Undo2, Users, Landmark, Briefcase, Package, BookOpen, HandCoins, ArrowRightLeft, Fuel, DollarSign, Beaker, Handshake, PiggyBank, Archive, BarChartHorizontal } from 'lucide-react';
import { Avatar, AvatarFallback } from './ui/avatar';


const navItems = [
  { href: '/dashboard/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/', label: 'Sale', icon: Fuel },
  { href: '/all-transactions/', label: 'All Transactions', icon: Archive },
  { href: '/customers/', label: 'Customers', icon: Users },
  { href: '/partner-ledger/', label: 'Unified Ledger', icon: HandCoins },
  { href: '/credit-recovery/', label: 'Credit Recovery', icon: BarChartHorizontal },
  { href: '/cash-advances/', label: 'Cash Advances', icon: ArrowRightLeft },
  { href: '/inventory/', label: 'Inventory', icon: Package },
  { href: '/tanks/', label: 'Tank Readings', icon: Beaker },
  { href: '/purchases/', label: 'Purchases', icon: ShoppingCart },
  { href: '/supplier-payments/', label: 'Supplier Payments', icon: Handshake },
  { href: '/purchase-returns/', label: 'Purchase Returns', icon: Undo2 },
  { href: '/investments/', label: 'Partner Investments', icon: PiggyBank },
  { href: '/expenses/', label: 'Expenses', icon: Receipt },
  { href: '/other-incomes/', label: 'Other Incomes', icon: DollarSign },
  { href: '/employees/', label: 'Employees', icon: Briefcase },
  { href: '/bank-management/', label: 'Bank Management', icon: Landmark },
  { href: '/ledger/', label: 'Ledger', icon: BookOpen },
  { href: '/reports/', label: 'Reports', icon: FileText },
  { href: '/settings/', label: 'Settings', icon: Settings },
];

const AppLogo = () => (
    <div className="flex items-center gap-2.5">
      <Avatar>
          <AvatarFallback><Fuel /></AvatarFallback>
      </Avatar>
      <div className="flex flex-col">
        <h2 className="text-lg font-bold tracking-tighter text-primary">PumpPal</h2>
        <p className="text-xs text-muted-foreground -mt-1">Management Software</p>
      </div>
    </div>
);


export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const pageTitle = navItems.find(item => pathname === item.href)?.label ?? 'Dashboard';

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className='p-4 border-b border-sidebar-border'>
            <AppLogo />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map(item => (
              <SidebarMenuItem key={item.href}>
                 <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.label}>
                   <Link href={item.href} legacyBehavior={false}>
                      <item.icon />
                      <span>{item.label}</span>
                   </Link>
                 </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/80 p-4 backdrop-blur-sm md:justify-end">
          <SidebarTrigger className="md:hidden" />
          <h2 className="text-xl font-semibold md:hidden">{pageTitle}</h2>
        </header>
        <main className="flex-1">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
