
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { MailCheck, LogOut, AlertTriangle } from 'lucide-react';
import { sendEmailVerification } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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
                description: "Failed to send verification email. Please check your Firebase project's configuration.",
            });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                        <MailCheck /> Verify Your Email
                    </CardTitle>
                    <CardDescription>
                        A verification link has been sent to <strong>{user?.email}</strong>. Please check your inbox and click the link to activate your account.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Not Receiving Emails?</AlertTitle>
                      <AlertDescription>
                        <ol className="list-decimal list-inside space-y-2 text-sm">
                            <li>
                                Go to your <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="underline">Firebase Console</a>, select your project, go to **Authentication** &rarr; **Settings**, and set a **Public-facing name** and **Support email**.
                            </li>
                            <li>
                                Go to the <a href="https://console.cloud.google.com/apis/library/identitytoolkit.googleapis.com" target="_blank" rel="noopener noreferrer" className="underline">Google Cloud Console API Library</a>, ensure you have the correct project selected, and click **Enable** for the **Identity Toolkit API**.
                            </li>
                             <li>Check your spam/junk folder.</li>
                        </ol>
                      </AlertDescription>
                    </Alert>
                    
                    <p className="text-sm text-muted-foreground">
                        Once you've verified your email, you can log in.
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
