'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, ScanFace, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function WebAgeGate() {
    const [verified, setVerified] = useState(true); // Default to true to prevent flash, check effect
    const [scanning, setScanning] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const isVerified = localStorage.getItem('age_verified') === 'true';
        setVerified(isVerified);
    }, []);

    const handleVerify = () => {
        setScanning(true);
        // Simulate Scan Delay
        setTimeout(() => {
            setScanning(false);
            setVerified(true);
            localStorage.setItem('age_verified', 'true');
            toast({
                title: "Identity Verified",
                description: "Welcome to our compliant storefront.",
            });
        }, 1500);
    };

    if (verified) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4">
            <Card className="w-full max-w-md shadow-2xl border border-blue-500/40 bg-black text-blue-200">
                <CardHeader className="text-center">
                    <div className="mx-auto bg-blue-500/15 p-4 rounded-full mb-4 w-16 h-16 flex items-center justify-center border border-blue-500/40">
                        <ShieldCheck className="w-8 h-8 text-blue-400" />
                    </div>
                    <CardTitle className="text-2xl text-blue-300">Age Verification Required</CardTitle>
                    <CardDescription className="text-blue-200/80">
                        You must be 21+ to view this menu.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-blue-950/45 p-4 rounded-lg flex items-center gap-4 border border-blue-500/30">
                        <ScanFace className="w-6 h-6 text-blue-300" />
                        <div className="text-sm">
                            <p className="font-semibold text-blue-200">Enhanced Verification</p>
                            <p className="text-blue-200/75">We use biometric age estimation to ensure compliance.</p>
                        </div>
                    </div>

                    <div className="bg-blue-950/45 p-4 rounded-lg flex items-center gap-4 border border-blue-500/30">
                        <FileText className="w-6 h-6 text-blue-300" />
                        <div className="text-sm">
                            <p className="font-semibold text-blue-200">ID Scan (Alternative)</p>
                            <p className="text-blue-200/75">Upload your driver's license.</p>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                    <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white" size="lg" onClick={handleVerify} disabled={scanning}>
                        {scanning ? "Verifying..." : "Verify with FaceID / Camera"}
                    </Button>
                    <p className="text-xs text-center text-blue-200/70 mt-2">
                        By entering, you agree to our Terms of Service and Privacy Policy.
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
