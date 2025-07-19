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
import { Fuel, History, FileText, Settings, LayoutDashboard, ShoppingCart, Receipt, Undo2, Users, Landmark, Briefcase, Package, BookOpen, HandCoins, ArrowRightLeft, LogOut } from 'lucide-react';
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
  { href: '/employees', label: 'Employees', icon: Briefcase },
  { href: '/bank-management', label: 'Bank Management', icon: Landmark },
  { href: '/ledger', label: 'Ledger', icon: BookOpen },
  { href: '/summary', label: 'Summary', icon: FileText },
  { href: '/settings', label: 'Settings', icon: Settings },
];

const FuelFlowLogo = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M33.6,83.3c-2.8-2.8-4.4-6.5-4.4-10.4V42.1c0-2.1-1.3-4.1-3.3-4.9l-5.6-2.2c-2-0.8-3.3-2.8-3.3-4.9V19.6c0-4,1.6-7.8,4.4-10.6c2.8-2.8,6.6-4.4,10.6-4.4h39.2c4,0,7.8,1.6,10.6,4.4c2.8,2.8,4.4,6.6,4.4,10.6v10.4c0,2.1-1.3,4.1-3.3,4.9l-5.6,2.2c-2,0.8-3.3,2.8-3.3,4.9v30.8c0,4-1.6,7.8-4.4,10.6c-2.8,2.8-6.6,4.4-10.6,4.4H44.2C40.2,87.7,36.4,86.1,33.6,83.3z" fill="#007bff"/>
        <path d="M33.8,19.8l-12.7,6.3c-1.3,0.7-2.2,2-2.2,3.4v1.8c0,1.5,0.9,2.8,2.2,3.4l12.7,6.3c1.3,0.7,2.9,0.7,4.2,0l12.7-6.3c1.3-0.7,2.2-2,2.2-3.4v-1.8c0-1.5-0.9-2.8-2.2-3.4L38,19.8C36.7,19.2,35.1,19.2,33.8,19.8z" fill="#ffc107"/>
        <text x="35" y="70" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="14" fill="white">FUEL</text>
        <text x="35" y="82" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="14" fill="white">FLOW</text>
    </svg>
);

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { signOut } = useAuth();
  const pathname = usePathname();
  const pageTitle = navItems.find(item => item.href === pathname)?.label ?? 'Dashboard';

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className='p-4'>
            <div className="flex items-center gap-2">
                <FuelFlowLogo className="w-10 h-10" />
                <h1 className="text-lg font-semibold text-primary">FuelFlow</h1>
            </div>
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
