'use client';

import { useEffect, RefObject } from 'react';
import { useFormStatus } from 'react-dom';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { CheckCircle2, XCircle, Loader } from 'lucide-react';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader className="mr-2 h-4 w-4 animate-spin" />
          Validating...
        </>
      ) : (
        'Validate Ticket'
      )}
    </Button>
  );
}

type TicketValidationFormProps = {
    formRef: RefObject<HTMLFormElement>;
    action: (payload: FormData) => void;
    state: any;
    onFormSubmission?: () => void;
}

export default function TicketValidationForm({ formRef, action, state, onFormSubmission }: TicketValidationFormProps) {
  
  useEffect(() => {
    if (state?.status && formRef.current) {
        // Reset form after a successful or failed validation to allow new scan
        setTimeout(() => {
            if (formRef.current) {
                formRef.current.reset();
            }
        }, 100); // Small delay to ensure state update is processed
    }
  }, [state, formRef])

  const handleAction = (payload: FormData) => {
    action(payload);
    if(onFormSubmission) {
      onFormSubmission();
    }
  };


  return (
    <div className="space-y-4">
      <form ref={formRef} action={handleAction} className="space-y-4">
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="qrData">Ticket Data</Label>
          <Input name="qrData" id="qrData" placeholder='Scan or paste ticket data...' />
        </div>
        <SubmitButton />
      </form>

      {state?.status === 'success' && (
        <Alert variant="default" className="bg-green-100 border-green-400 text-green-800 dark:bg-green-900/50 dark:border-green-700 dark:text-green-300">
          <CheckCircle2 className="h-4 w-4 !text-green-600 dark:!text-green-400" />
          <AlertTitle className="font-bold">Access Granted!</AlertTitle>
          <AlertDescription>
            {state.message} <br />
            Event: <strong>{state.eventName}</strong>
          </AlertDescription>
        </Alert>
      )}
      {state?.status === 'error' && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle className="font-bold">Access Denied!</AlertTitle>
          <AlertDescription>
            {state.message} <br />
            {state.eventName && <>Event: <strong>{state.eventName}</strong></>}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
