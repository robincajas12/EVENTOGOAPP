'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from '@/hooks/use-session';
import { redirect } from 'next/navigation';
import jsQR from 'jsqr';
import { useToast } from '@/hooks/use-toast';
import TicketValidationForm from '@/components/ticket-validation-form';
import { Button } from '@/components/ui/button';
import { useFormState } from 'react-dom';
import { validateTicket } from '@/lib/actions';

export default function FullScreenScanner() {
  const { user, loading } = useSession();
  const { toast } = useToast();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [animationFrameId, setAnimationFrameId] = useState<number | null>(null);
  const [state, dispatch] = useFormState(validateTicket, null);


  useEffect(() => {
    if (state?.message) {
      stopCamera();
      toast({
        variant: state.success ? 'default' : 'destructive',
        title: state.success ? 'Validation Successful' : 'Validation Failed',
        description: state.message,
      });
    }
  }, [state]);


  useEffect(() => {
    if (!loading && (!user || user.role !== 'Admin')) {
      redirect('/');
    }
  }, [user, loading]);

  const requestCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      setHasCameraPermission(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;
        await videoRef.current.play();
        setStreaming(true);
        requestAnimationFrame(tick);
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setHasCameraPermission(false);
      toast({
        variant: 'destructive',
        title: 'Camera Access Denied',
        description: 'Please enable camera permissions in your browser settings.',
      });
    }
  };

  const tick = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });

    if (code && formRef.current) {
      const qrDataInput = formRef.current.elements.namedItem('qrData') as HTMLInputElement;
      if (qrDataInput) {
        qrDataInput.value = code.data;
        formRef.current.requestSubmit();
      }
      return; // Detener escaneo al encontrar QR
    }

    const id = requestAnimationFrame(tick);
    setAnimationFrameId(id);
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    setStreaming(false);
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  if (loading || !user) return <div>Loading...</div>;

  return (
    <div className="fixed inset-0 bg-black flex flex-col justify-center items-center">
      {/* Video fullscreen */}
      <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" />

      {/* Overlay de scanner */}
      <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
        <div className="relative w-11/12 max-w-md aspect-square border-4 border-white/60 rounded-lg overflow-hidden">
          {/* Línea animada */}
          <div className="absolute top-0 left-0 w-full h-1 bg-green-400 animate-scan"></div>
        </div>
      </div>

      {/* Canvas oculto para procesar QR */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Botones flotantes */}
      <div className="absolute bottom-8 flex gap-4">
        {!streaming && (
          <Button onClick={requestCamera} variant="outline">
            Allow Camera
          </Button>
        )}
        {streaming && (
          <Button onClick={stopCamera} variant="destructive">
            Stop
          </Button>
        )}
      </div>

      {/* Formulario QR */}
      <TicketValidationForm
        formRef={formRef}
        action={dispatch}
        state={state}
        onFormSubmission={() => {
          // No es necesario parar la cámara aquí, el useEffect se encarga
        }}
      />

      {/* Animación scan */}
      <style jsx>{`
        @keyframes scan {
          0% { top: 0; }
          50% { top: 100%; }
          100% { top: 0; }
        }
        .animate-scan {
          animation: scan 2s linear infinite;
        }
      `}</style>
    </div>
  );
}
