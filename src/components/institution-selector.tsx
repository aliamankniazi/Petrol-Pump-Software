
'use client';

import { useRoles } from "@/hooks/use-roles.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Building, LogOut, PlusCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

export function InstitutionSelector() {
    const { userInstitutions, isReady, setCurrentInstitution } = useRoles();
    const { signOut } = useAuth();
    const router = useRouter();

    const handleCreateInstitution = () => {
        router.push('/institutions');
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Select an Institution</CardTitle>
                    <CardDescription>Choose which institution you want to manage.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isReady ? (
                        userInstitutions && userInstitutions.length > 0 ? (
                            <ul className="space-y-2">
                                {userInstitutions.map(inst => (
                                    <li key={inst.id}>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start h-auto p-4 gap-4"
                                            onClick={() => setCurrentInstitution(inst.id)}
                                        >
                                            <Avatar>
                                                <AvatarImage src={inst.logoUrl} alt={inst.name} />
                                                <AvatarFallback><Building /></AvatarFallback>
                                            </Avatar>
                                            <span className="font-semibold">{inst.name}</span>
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-center text-muted-foreground p-4 border rounded-md">
                                <Building className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium">No institutions found</h3>
                                <p className="mt-1 text-sm">You are not assigned to any institution yet. Please create one to begin.</p>
                                <div className="mt-6">
                                    <Button onClick={handleCreateInstitution}>
                                        <PlusCircle className="-ml-1 mr-2 h-5 w-5" />
                                        Create Institution
                                    </Button>
                                </div>
                            </div>
                        )
                    ) : (
                        <div className="space-y-2">
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-16 w-full" />
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex justify-end">
                     <Button variant="ghost" onClick={signOut}>
                        <LogOut className="mr-2 h-4 w-4" /> Sign Out
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
