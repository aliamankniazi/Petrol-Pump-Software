
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { MailCheck, LogOut } from 'lucide-react';
import { sendEmailVerification } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

export default function VerifyEmailPage() {
    const { user, signOut } = useAuth();
    const { toast } = useToast();
    const [isSending, setIsSending] = useState(false);

    const handleResendVerification = async () => {
        if (!user) return;
        setIsSending(true);
        try {
            await sendEmailVerification(user);
            toast({
                title: 'Verification Email Sent',
                description: 'A new verification link has been sent to your email address.',
            });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error Sending Email',
                description: error.message || 'An unexpected error occurred.',
            });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                        <MailCheck /> Verify Your Email
                    </CardTitle>
                    <CardDescription>
                        A verification link has been sent to <strong>{user?.email}</strong>. Please check your inbox and click the link to activate your account.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Once you've verified your email, you can log in. If you don't see the email, please check your spam folder.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Button onClick={handleResendVerification} disabled={isSending} className="w-full">
                            {isSending ? 'Sending...' : 'Resend Verification Email'}
                        </Button>
                        <Button onClick={signOut} variant="outline" className="w-full">
                           <LogOut className="mr-2 h-4 w-4" /> Go to Login
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
