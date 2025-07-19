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
  SidebarFooter,
} from '@/components/ui/sidebar';
import { History, FileText, Settings, LayoutDashboard, ShoppingCart, Receipt, Undo2, Users, Landmark, Briefcase, Package, BookOpen, HandCoins, ArrowRightLeft, LogOut, Fuel, DollarSign } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from './ui/button';

const navItems = [
  { href: '/', label: 'Sale', icon: LayoutDashboard },
  { href: '/history', label: 'History', icon: History },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/customer-payments', label: 'Customer Payments', icon: HandCoins },
  { href: '/cash-advances', label: 'Cash Advances', icon: ArrowRightLeft },
  { href: '/inventory', label: 'Inventory', icon: Package },
  { href: '/purchases', label: 'Purchases', icon: ShoppingCart },
  { href: '/purchase-returns', label: 'Purchase Returns', icon: Undo2 },
  { href: '/expenses', label: 'Expenses', icon: Receipt },
  { href: '/other-incomes', label: 'Other Incomes', icon: DollarSign },
  { href: '/employees', label: 'Employees', icon: Briefcase },
  { href: '/bank-management', label: 'Bank Management', icon: Landmark },
  { href: '/ledger', label: 'Ledger', icon: BookOpen },
  { href: '/summary', label: 'Summary', icon: FileText },
  { href: '/settings', label: 'Settings', icon: Settings },
];

const AppLogo = () => (
    <div className="flex items-center gap-2.5">
      <div className="bg-primary rounded-lg p-2 text-primary-foreground">
        <Fuel className="w-6 h-6" />
      </div>
      <div className="flex flex-col">
        <h2 className="text-lg font-bold tracking-tighter text-primary">Mianwali</h2>
        <p className="text-xs text-muted-foreground -mt-1">Petroleum Service</p>
      </div>
    </div>
);


export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const pageTitle = navItems.find(item => item.href === pathname)?.label ?? 'Dashboard';

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
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <Button variant="ghost" className="w-full justify-start gap-2" onClick={signOut}>
                <LogOut />
                Sign Out
              </Button>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
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
