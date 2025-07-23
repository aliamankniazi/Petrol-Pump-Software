
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
import { FileText, Settings, LayoutDashboard, ShoppingCart, Receipt, Undo2, Users, Landmark, Briefcase, Package, BookOpen, HandCoins, ArrowRightLeft, LogOut, Fuel, DollarSign, Beaker, Handshake, PiggyBank, Archive, BarChartHorizontal, Shield, AreaChart, UserCog, Building } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from './ui/button';
import type { Permission } from '@/hooks/use-roles';
import { useInstitution } from '@/hooks/use-institution.tsx';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'view_dashboard' as Permission },
  { href: '/', label: 'Sale', icon: Fuel, permission: 'view_dashboard' as Permission },
  { href: '/all-transactions', label: 'All Transactions', icon: Archive, permission: 'view_all_transactions' as Permission },
  { href: '/customers', label: 'Customers', icon: Users, permission: 'view_customers' as Permission },
  { href: '/partner-ledger', label: 'Unified Ledger', icon: HandCoins, permission: 'view_partner_ledger' as Permission },
  { href: '/credit-recovery', label: 'Credit Recovery', icon: BarChartHorizontal, permission: 'view_credit_recovery' as Permission },
  { href: '/cash-advances', label: 'Cash Advances', icon: ArrowRightLeft, permission: 'view_cash_advances' as Permission },
  { href: '/inventory', label: 'Inventory', icon: Package, permission: 'view_inventory' as Permission },
  { href: '/tanks', label: 'Tank Readings', icon: Beaker, permission: 'view_tank_readings' as Permission },
  { href: '/purchases', label: 'Purchases', icon: ShoppingCart, permission: 'view_purchases' as Permission },
  { href: '/supplier-payments', label: 'Supplier Payments', icon: Handshake, permission: 'view_supplier_payments' as Permission },
  { href: '/purchase-returns', label: 'Purchase Returns', icon: Undo2, permission: 'view_purchase_returns' as Permission },
  { href: '/investments', label: 'Partner Investments', icon: PiggyBank, permission: 'view_investments' as Permission },
  { href: '/expenses', label: 'Expenses', icon: Receipt, permission: 'view_expenses' as Permission },
  { href: '/other-incomes', label: 'Other Incomes', icon: DollarSign, permission: 'view_other_incomes' as Permission },
  { href: '/employees', label: 'Employees', icon: Briefcase, permission: 'manage_employees' as Permission },
  { href: '/bank-management', label: 'Bank Management', icon: Landmark, permission: 'manage_banks' as Permission },
  { href: '/ledger', label: 'Ledger', icon: BookOpen, permission: 'view_ledger' as Permission },
  { href: '/summary', label: 'Summary', icon: FileText, permission: 'view_summary' as Permission },
  { href: '/reports', label: 'Reports', icon: AreaChart, permission: 'view_reports' as Permission },
  { href: '/users', label: 'Manage Users', icon: UserCog, permission: 'manage_users' as Permission },
  { href: '/roles', label: 'Roles', icon: Shield, permission: 'manage_roles' as Permission },
  { href: '/institutions', label: 'Institutions', icon: Building, permission: 'manage_institutions' as Permission },
  { href: '/settings', label: 'Settings', icon: Settings, permission: 'view_settings' as Permission },
];

const AppLogo = () => {
  const { currentInstitution } = useInstitution();

  return (
    <div className="flex items-center gap-2.5">
      <Avatar>
          <AvatarImage src={currentInstitution?.logoUrl} alt={currentInstitution?.name} />
          <AvatarFallback><Fuel /></AvatarFallback>
      </Avatar>
      <div className="flex flex-col">
        <h2 className="text-lg font-bold tracking-tighter text-primary">{currentInstitution?.name || 'Petrol Pump'}</h2>
        <p className="text-xs text-muted-foreground -mt-1">Management Software</p>
      </div>
    </div>
  )
};


export function AppLayout({ children, hasPermission }: { children: React.ReactNode, hasPermission: (permission: Permission) => boolean }) {
  const { signOut } = useAuth();
  const { clearCurrentInstitution } = useInstitution();
  const pathname = usePathname();
  
  const visibleNavItems = navItems.filter(item => hasPermission(item.permission));
  const pageTitle = visibleNavItems.find(item => pathname.startsWith(item.href))?.label ?? 'Dashboard';

  const handleSignOut = () => {
    signOut();
    clearCurrentInstitution();
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className='p-4 border-b border-sidebar-border'>
            <AppLogo />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {visibleNavItems.map(item => (
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
              <Button variant="ghost" className="w-full justify-start gap-2" onClick={handleSignOut}>
                <LogOut />
                Sign Out
              </Button>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="fixed inset-0 flex items-center justify-center -z-10 pointer-events-none">
          <div className="flex flex-col items-center text-center -rotate-12 opacity-5 dark:opacity-[0.02]">
            <h1 className="text-8xl font-black text-foreground/50 tracking-widest leading-none">
              Mianwali
            </h1>
            <h2 className="text-6xl font-bold text-foreground/50 tracking-wider">
              Petroleum Service
            </h2>
          </div>
        </div>
        <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/80 p-4 backdrop-blur-sm md:justify-end">
          <SidebarTrigger className="md:hidden" />
          <h2 className="text-xl font-semibold md:hidden">{pageTitle}</h2>
        </header>
        <main className="flex-1">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
