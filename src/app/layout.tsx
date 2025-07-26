
'use client';

import * as React from 'react';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Inter } from 'next/font/google';
import { AppLayout } from '@/components/app-layout';
import { usePathname } from 'next/navigation';
import { ThemeScript } from '@/components/theme-script';
import { AuthProvider, useAuth } from '@/hooks/use-auth.tsx';
import { RolesProvider, useRoles } from '@/hooks/use-roles.tsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, AlertTriangle, LogOut } from 'lucide-react';
import type { Institution } from '@/lib/types';
import { DataProvider } from '@/hooks/use-database';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const institutionSchema = z.object({
  name: z.string().min(3, 'Institution name must be at least 3 characters long.'),
});
type InstitutionFormValues = z.infer<typeof institutionSchema>;


function PrintStyles() {
    const pathname = usePathname();
    if (pathname.startsWith('/invoice/')) {
        return <link rel="stylesheet" href="/print-globals.css" media="print" />;
    }
    return null;
}

function AppContainer({ children }: { children: React.ReactNode }) {
    const { isReady, currentInstitution, userInstitutions, setCurrentInstitution, addInstitution, clearCurrentInstitution, error } = useRoles();
    const { user, signOut } = useAuth();
    const { register, handleSubmit, formState: { errors } } = useForm<InstitutionFormValues>({
        resolver: zodResolver(institutionSchema),
    });

    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const handleCreateInstitution: React.SubmitHandler<InstitutionFormValues> = async (data) => {
        setIsSubmitting(true);
        try {
            await addInstitution({ name: data.name });
        } catch (error) {
            console.error("Failed to create institution:", error);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleSelectInstitution = (institutionId: string) => {
        setCurrentInstitution(institutionId);
    };

    if (!isReady) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
    if (error) {
         return (
            <div className="flex h-screen w-full items-center justify-center p-4">
                <Card className="max-w-md w-full">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-destructive"><AlertTriangle /> Application Error</CardTitle>
                        <CardDescription>We encountered an unexpected error.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">Please try refreshing the page. If the problem persists, contact support.</p>
                        <pre className="bg-muted p-2 rounded-md text-xs overflow-auto">{error.message}</pre>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (user && !currentInstitution) {
        if (userInstitutions.length > 0) {
            return (
                <div className="flex h-screen w-full items-center justify-center bg-muted">
                    <Card className="max-w-md w-full">
                        <CardHeader>
                            <CardTitle>Select an Institution</CardTitle>
                            <CardDescription>Choose which business you want to manage.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {userInstitutions.map((inst: Institution) => (
                                <Button key={inst.id} onClick={() => handleSelectInstitution(inst.id)} className="w-full justify-start" variant="outline">
                                    {inst.name}
                                </Button>
                            ))}
                        </CardContent>
                        <CardFooter>
                            <Button variant="ghost" onClick={signOut}><LogOut className="mr-2 h-4 w-4"/>Sign Out</Button>
                        </CardFooter>
                    </Card>
                </div>
            );
        } else {
             return (
                <div className="flex h-screen w-full items-center justify-center bg-muted">
                    <Card className="max-w-md w-full">
                        <CardHeader>
                            <CardTitle>Create Your First Institution</CardTitle>
                            <CardDescription>
                                Welcome! To get started, create an institution to manage your business.
                            </CardDescription>
                        </CardHeader>
                        <form onSubmit={handleSubmit(handleCreateInstitution)}>
                            <CardContent>
                                <div className="space-y-2">
                                    <Label htmlFor="name">Institution Name</Label>
                                    <Input id="name" {...register('name')} placeholder="e.g., My Petrol Pump" />
                                    {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-between">
                                <Button variant="ghost" onClick={signOut}><LogOut className="mr-2 h-4 w-4"/>Sign Out</Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Create Institution
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                </div>
            );
        }
    }

    return (
        <DataProvider institutionId={currentInstitution?.id || null}>
            <AppLayout>
                {children}
            </AppLayout>
        </DataProvider>
    );
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
          <ThemeScript />
          <PrintStyles />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
            {pathname === '/login' ? (
                children
            ) : (
                <RolesProvider>
                    <AppContainer>
                        {children}
                    </AppContainer>
                </RolesProvider>
            )}
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
