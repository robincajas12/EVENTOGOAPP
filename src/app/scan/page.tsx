'use client';

import { useEffect, useRef, useState, useActionState } from 'react';
import { useSession } from '@/hooks/use-session';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import TicketValidationForm from '@/components/ticket-validation-form';
import { Camera, ScanLine } from 'lucide-react';
import jsQR from 'jsqr';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { validateTicket } from '@/lib/actions';

export default function ScanPage() {
  const { user, loading } = useSession();
  const { toast } = useToast();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [state, formAction] = useActionState(validateTicket, null);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'Admin')) {
      redirect('/');
    }
  }, [user, loading]);

  const startScan = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setHasCameraPermission(true);
      setIsScanning(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        requestAnimationFrame(tick);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasCameraPermission(false);
      toast({
        variant: 'destructive',
        title: 'Camera Access Denied',
        description: 'Please enable camera permissions in your browser settings.',
      });
    }
  };

  const stopScan = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };
  
  const tick = () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.height = video.videoHeight;
          canvas.width = video.videoWidth;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });

          if (code) {
            stopScan();
            if (formRef.current) {
                const qrDataInput = formRef.current.elements.namedItem('qrData') as HTMLInputElement;
                if (qrDataInput) {
                    qrDataInput.value = code.data;
                    formRef.current.requestSubmit();
                }
            }
            return;
          }
        }
      }
    }
    if (isScanning) {
        requestAnimationFrame(tick);
    }
  };
  
  useEffect(() => {
      // Cleanup function
      return () => {
          stopScan();
      }
  }, []);

  if (loading || !user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 flex justify-center">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit mb-4">
            <ScanLine className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl font-headline">Ticket Scanner</CardTitle>
          <CardDescription>
            Scan a QR code or enter the data manually.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {hasCameraPermission === false && (
              <Alert variant="destructive">
                <AlertTitle>Camera Access Required</AlertTitle>
                <AlertDescription>
                  Please allow camera access to use the scanner. You can still enter ticket data manually.
                </AlertDescription>
              </Alert>
            )}

            {isScanning ? (
                 <div className="relative w-full aspect-video bg-black rounded-md overflow-hidden">
                    <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
                     <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-3/4 h-1/2 border-4 border-white/50 rounded-lg animate-pulse"></div>
                    </div>
                    <canvas ref={canvasRef} className="hidden" />
                 </div>
            ) : (
                <Button onClick={startScan} className="w-full" variant="outline">
                    <Camera className="mr-2 h-4 w-4" />
                    Start Camera Scan
                </Button>
            )}
           
            <TicketValidationForm
              formRef={formRef}
              action={formAction}
              state={state}
              onFormSubmission={() => setIsScanning(false)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}