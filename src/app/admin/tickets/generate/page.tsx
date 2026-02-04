"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/select';
import { getEventsAction, getEventByIdAction, generatePhysicalTicketsAction } from '../../../../lib/actions'; // Import new action
import { Event, Ticket, TicketType } from '../../../../lib/types'; // Import types
import { useSession } from '../../../../hooks/use-session'; // Import useSession

import jsPDF from 'jspdf'; // Import jspdf
import qrcode from 'qrcode'; // Import qrcode

const GenerateTicketsPage = () => {
  const { token } = useSession(); // Get token from session
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedTicketTypeId, setSelectedTicketTypeId] = useState<string | null>(null); // New state
  const [quantity, setQuantity] = useState<number>(1); // New state
  const [qrCodeSizeInput, setQrCodeSizeInput] = useState<number>(70); // Default QR code size in mm
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [newlyGeneratedTickets, setNewlyGeneratedTickets] = useState<Ticket[]>([]); // To store tickets from generation
  const [loadingEvents, setLoadingEvents] = useState<boolean>(true);
  const [loadingPdf, setLoadingPdf] = useState<boolean>(false);
  const [generatingTickets, setGeneratingTickets] = useState<boolean>(false); // New state for generating tickets
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // Fetch events on component mount
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoadingEvents(true);
        setError(null);
        const fetchedEvents = await getEventsAction();
        setEvents(fetchedEvents);
      } catch (err) {
        setError("Error cargando eventos.");
        console.error("Error fetching events:", err);
      } finally {
        setLoadingEvents(false);
      }
    };
    fetchEvents();
  }, []);

  // Fetch selected event details when selectedEventId changes
  useEffect(() => {
    if (selectedEventId) {
      const fetchEventDetails = async () => {
        try {
          setError(null);
          const eventDetails = await getEventByIdAction(selectedEventId);
          if (eventDetails) {
            setSelectedEvent(eventDetails);
            // Pre-select first ticket type if available
            if (eventDetails.ticketTypes && eventDetails.ticketTypes.length > 0) {
              setSelectedTicketTypeId(eventDetails.ticketTypes[0].id);
            } else {
              setSelectedTicketTypeId(null);
            }
          } else {
            setError("Evento no encontrado.");
            setSelectedEvent(null);
          }
        } catch (err) {
          setError("Error cargando detalles del evento.");
          console.error("Error fetching event details:", err);
        }
      };
      fetchEventDetails();
    } else {
      setSelectedEvent(null);
      setSelectedTicketTypeId(null);
    }
  }, [selectedEventId]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBackgroundImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setBackgroundImage(null);
    }
  };

  const handleGeneratePdf = async () => {
    if (!selectedEventId || !backgroundImage || !selectedEvent || !selectedTicketTypeId || quantity < 1) {
      alert("Por favor selecciona un evento, un tipo de ticket, la cantidad y una imagen de fondo.");
      return;
    }

    setGeneratingTickets(true); // Indicate that new tickets are being generated
    setLoadingPdf(true); // Indicate that PDF is being generated
    setError(null);
    setNewlyGeneratedTickets([]); // Clear previously generated tickets

    try {
      // Step 1: Generate new tickets via server action
      const result = await generatePhysicalTicketsAction(selectedEventId, selectedTicketTypeId, quantity, token);

      if (!result.success) {
        setError(result.message || "Error al generar tickets físicos.");
        setLoadingPdf(false);
        setGeneratingTickets(false);
        return;
      }

      const ticketsToPrint = result.tickets;
      if (!ticketsToPrint || ticketsToPrint.length === 0) {
        alert("No se generaron tickets. Verifica la capacidad del evento o la configuración del tipo de ticket.");
        setLoadingPdf(false);
        setGeneratingTickets(false);
        return;
      }
      setNewlyGeneratedTickets(ticketsToPrint); // Store them

      // Step 2: Generate PDF with the newly created tickets
      const doc = new jsPDF('p', 'mm', 'a4'); // 'p' for portrait, 'mm' for millimeters, 'a4' for A4 size
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const img = new Image();
      img.src = backgroundImage;

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = (err) => reject(err);
      });

      // Layout variables for customization
      const qrCodeSize = qrCodeSizeInput; // Use input value
      const qrCodeX = (pageWidth - qrCodeSize) / 2; // Center horizontally
      const qrCodeY = (pageHeight - qrCodeSize) / 2; // Center vertically for dynamic size
      const eventNameY = pageHeight * 0.15;
      const ticketIdY = pageHeight * 0.85;
      const textColor = [0, 0, 0]; // RGB for black

      for (let i = 0; i < ticketsToPrint.length; i++) {
        if (i > 0) {
          doc.addPage();
        }

        // Add background image
        // The image type might need to be adjusted based on the actual image. 'JPEG' is a common default.
        const imgType = backgroundImage.startsWith('data:image/png') ? 'PNG' : 'JPEG';
        doc.addImage(img, imgType, 0, 0, pageWidth, pageHeight);

        // Generate QR code
        const qrCodeDataUrl = await qrcode.toDataURL(ticketsToPrint[i].qrData, { width: 256, margin: 1, errorCorrectionLevel: 'H' });
        doc.addImage(qrCodeDataUrl, 'PNG', qrCodeX, qrCodeY, qrCodeSize, qrCodeSize);

        // Add event name
        doc.setFontSize(24);
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.text(selectedEvent.name, pageWidth / 2, eventNameY, { align: 'center' });

        // Add ticket ID and type
        doc.setFontSize(14);
        const ticketInfo = JSON.parse(ticketsToPrint[i].qrData);
        const currentTicketType = selectedEvent.ticketTypes.find(tt => tt.id === selectedTicketTypeId);
        doc.text(`${currentTicketType?.name || 'Ticket'} ID: ${ticketInfo.ticketId}`, pageWidth / 2, ticketIdY, { align: 'center' });
      }

      doc.save(`${selectedEvent.name}_${selectedEvent.ticketTypes.find(tt => tt.id === selectedTicketTypeId)?.name || 'Tickets'}_${quantity}.pdf`);
      alert("PDF de tickets generado exitosamente!");

    } catch (err) {
      setError("Error al generar el PDF. Asegúrate de que la imagen de fondo sea válida y que tienes permiso para generar tickets.");
      console.error("Error generating PDF:", err);
    } finally {
      setLoadingPdf(false);
      setGeneratingTickets(false);
    }
  };

  const currentSelectedTicketType = selectedEvent?.ticketTypes.find(tt => tt.id === selectedTicketTypeId);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Generador de Tickets PDF</h1>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Event Selection */}
        <div>
          <Label htmlFor="event-select" className="mb-2 block">Seleccionar Evento</Label>
          <Select
            onValueChange={(value) => {
              setSelectedEventId(value);
              setNewlyGeneratedTickets([]); // Clear when event changes
            }}
            value={selectedEventId || ''}
            disabled={loadingEvents || generatingTickets}
          >
            <SelectTrigger id="event-select" className="w-full">
              <SelectValue placeholder="Selecciona un evento" />
            </SelectTrigger>
            <SelectContent>
              {loadingEvents ? (
                <SelectItem value="loading" disabled>Cargando eventos...</SelectItem>
              ) : events.length === 0 ? (
                <SelectItem value="no-events" disabled>No hay eventos disponibles</SelectItem>
              ) : (
                events.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Ticket Type Selection */}
        <div>
          <Label htmlFor="ticket-type-select" className="mb-2 block">Tipo de Ticket</Label>
          <Select
            onValueChange={setSelectedTicketTypeId}
            value={selectedTicketTypeId || ''}
            disabled={!selectedEventId || !selectedEvent?.ticketTypes || selectedEvent.ticketTypes.length === 0 || generatingTickets}
          >
            <SelectTrigger id="ticket-type-select" className="w-full">
              <SelectValue placeholder="Selecciona un tipo de ticket" />
            </SelectTrigger>
            <SelectContent>
              {selectedEvent?.ticketTypes.map((type: TicketType) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name} (Bs. {type.price.toFixed(2)})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Quantity Input */}
        <div>
          <Label htmlFor="quantity-input" className="mb-2 block">Cantidad a Generar</Label>
          <Input
            id="quantity-input"
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            disabled={!selectedTicketTypeId || generatingTickets}
            className="w-full"
          />
        </div>

        {/* QR Code Size Input */}
        <div>
          <Label htmlFor="qr-code-size-input" className="mb-2 block">Tamaño del QR (mm)</Label>
          <Input
            id="qr-code-size-input"
            type="number"
            min="10"
            max="150"
            value={qrCodeSizeInput}
            onChange={(e) => setQrCodeSizeInput(Math.max(10, Math.min(150, parseInt(e.target.value) || 10)))}
            disabled={generatingTickets || loadingPdf}
            className="w-full"
          />
        </div>

        {/* Background Image Upload */}
        <div className="lg:col-span-3">
          <Label htmlFor="background-image" className="mb-2 block">Imagen de Fondo del Ticket</Label>
          <Input
            id="background-image"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            disabled={generatingTickets}
            className="file:text-sm file:font-semibold"
          />
          {backgroundImage && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Previsualización de la Imagen:</h3>
              <img src={backgroundImage} alt="Background Preview" className="max-w-full h-auto rounded-md shadow-md" />
            </div>
          )}
        </div>
      </div>

      <div className="mt-8">
        <Button
          onClick={handleGeneratePdf}
          disabled={!selectedEventId || !selectedTicketTypeId || quantity < 1 || !backgroundImage || generatingTickets || loadingPdf}
          className="w-full"
        >
          {generatingTickets || loadingPdf ? "Generando Tickets y PDF..." : "Generar Tickets y PDF"}
        </Button>
      </div>

       {newlyGeneratedTickets.length > 0 && (
        <div className="mt-8 p-4 bg-green-100 border border-green-400 text-green-700 rounded-md">
          <h3 className="font-bold">Tickets Generados Recientemente:</h3>
          <p>{newlyGeneratedTickets.length} tickets han sido generados exitosamente y su PDF está listo para descargar.</p>
        </div>
      )}
    </div>
  );
};

export default GenerateTicketsPage;
