export type User = {
  id: string;
  name: string;
  email: string;
  password?: string; // Will be hashed, not sent to client
  role: 'Admin' | 'User';
};

export type TicketType = {
  id: string;
  name: string;
  price: number;
};

export type Event = {
  id: string;
  name: string;
  description: string;
  date: Date;
  location: {
    name: string;
    lat: number;
    lng: number;
  };
  capacity: number;
  image: string; // Placeholder image ID
  ticketTypes: TicketType[];
};

export type Ticket = {
  id: string;
  orderId: string;
  eventId: string;
  userId: string;
  ticketTypeId: string;
  qrData: string; // Will contain a JWT or unique identifier
  status: 'valid' | 'used';
};

export type Order = {
  id:string;
  userId: string;
  eventId: string;
  tickets: Ticket[];
  totalAmount: number;
  createdAt: Date;
};
