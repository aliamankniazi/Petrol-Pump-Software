

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
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar';
import { FileText, Settings, LayoutDashboard, ShoppingCart, Receipt, Undo2, Users, Landmark, Briefcase, Package, BookOpen, HandCoins, ArrowRightLeft, Fuel, DollarSign, Beaker, Handshake, PiggyBank, Archive, BarChartHorizontal, UserCheck, ArrowRightLeftIcon, Truck } from 'lucide-react';


const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transactions', icon: ArrowRightLeftIcon },
  { 
    label: 'Ledgers & Recovery',
    icon: HandCoins,
    subItems: [
        { href: '/all-transactions', label: 'All Transactions', icon: Archive },
        { href: '/sale-invoices', label: 'Sale Invoices', icon: Receipt },
        { href: '/partner-ledger', label: 'Unified Ledger', icon: BookOpen },
        { href: '/credit-recovery', label: 'Credit Recovery', icon: BarChartHorizontal },
    ]
  },
  {
    label: 'Purchases & Suppliers',
    icon: ShoppingCart,
    subItems: [
        { href: '/purchases', label: 'Purchases', icon: ShoppingCart },
        { href: '/purchase-returns', label: 'Purchase Returns', icon: Undo2 },
        { href: '/suppliers', label: 'Suppliers', icon: Truck },
    ]
  },
  {
    label: 'People & Partners',
    icon: Users,
    subItems: [
        { href: '/customers', label: 'Customers & Partners', icon: Users },
        { href: '/employees', label: 'Employees', icon: Briefcase },
        { href: '/attendance', label: 'Attendance', icon: UserCheck },
        { href: '/investments', label: 'Partner Investments', icon: PiggyBank },
    ]
  },
  { 
    label: 'Inventory',
    icon: Package,
    subItems: [
        { href: '/inventory', label: 'Stock Levels', icon: Package },
        { href: '/tanks', label: 'Machine Reading', icon: Beaker },
        { href: '/settings', label: 'Manage Products', icon: Settings },
    ]
  },
  {
    label: 'Financials',
    icon: DollarSign,
    subItems: [
      { href: '/expenses', label: 'Expenses', icon: Receipt },
      { href: '/other-incomes', label: 'Other Incomes', icon: DollarSign },
      { href: '/bank-management', label: 'Bank Management', icon: Landmark },
      { href: '/ledger', label: 'General Journal', icon: BookOpen },
    ]
  },
  { href: '/reports', label: 'Reports', icon: FileText },
  { href: '/settings', label: 'Settings', icon: Settings },
];

const AppLogo = () => (
    <div className="flex items-center gap-2.5">
       <div className="flex items-center justify-center w-10 h-10 bg-primary text-primary-foreground rounded-md">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 13.1a2.5 2.5 0 0 0-2-3.1h-1a2.5 2.5 0 0 0-2 3.1"/>
                <path d="M12 3a8.8 8.8 0 0 0-8.8 8.8c0 4.9 3.9 11.2 8.8 11.2s8.8-6.3 8.8-11.2A8.8 8.8 0 0 0 12 3Z"/>
            </svg>
        </div>
      <div className="flex flex-col">
        <h2 className="text-sm font-bold tracking-tight text-foreground">Mianwali Petroleum Service Mianwali</h2>
      </div>
    </div>
);


export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const getPageTitle = () => {
    for (const item of navItems) {
      if ('href' in item && item.href === pathname) return item.label;
      if ('subItems' in item) {
        const subItem = item.subItems.find(sub => sub.href === pathname);
        if (subItem) return subItem.label;
      }
    }
    const specialTitles: Record<string, string> = {
        '/dashboard': 'Dashboard',
    };
    return specialTitles[pathname] || 'Page';
  }
  const pageTitle = getPageTitle();

  return (
    <SidebarProvider>
      <Sidebar collapsible="none">
        <SidebarHeader className='p-4 border-b border-sidebar-border'>
            <AppLogo />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item, index) => (
              'href' in item ? (
                <SidebarMenuItem key={index}>
                  <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.label}>
                    <Link href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : (
                <SidebarGroup key={index}>
                  <SidebarGroupLabel className="flex items-center gap-2">
                    <item.icon />
                    {item.label}
                  </SidebarGroupLabel>
                  <SidebarMenuSub>
                    {item.subItems.map((sub, subIndex) => (
                      <SidebarMenuSubItem key={subIndex}>
                          <SidebarMenuSubButton asChild isActive={pathname === sub.href}>
                              <Link href={sub.href}>
                                  <sub.icon />
                                  <span>{sub.label}</span>
                              </Link>
                          </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </SidebarGroup>
              )
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
