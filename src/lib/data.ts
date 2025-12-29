import type { Event, User, Ticket, Order, TicketType } from './types';

let users: User[] = [
  { id: '1', name: 'Admin User', email: 'admin@eventgo.com', password: 'password123', role: 'Admin' },
  { id: '2', name: 'Regular User', email: 'user@eventgo.com', password: 'password123', role: 'User' },
];

let events: Event[] = [
  {
    id: '1',
    name: 'Quito Tech Summit 2024',
    description: 'The largest tech conference in the region. Join us for 3 days of talks, workshops, and networking with industry leaders.',
    date: new Date('2024-10-26T09:00:00'),
    location: { name: 'Quito Convention Center', lat: -0.1762, lng: -78.4844 },
    capacity: 2000,
    image: 'event-conference',
    ticketTypes: [
      { id: 't1-1', name: 'General Access', price: 50 },
      { id: 't1-2', name: 'VIP Pass', price: 150 },
    ],
  },
  {
    id: '2',
    name: 'Andean Beats Music Fest',
    description: 'An outdoor music festival featuring top national and international artists. Experience the sound of the Andes!',
    date: new Date('2024-11-15T14:00:00'),
    location: { name: 'Parque Bicentenario, Quito', lat: -0.1287, lng: -78.4908 },
    capacity: 10000,
    image: 'event-concert',
    ticketTypes: [
      { id: 't2-1', name: 'Early Bird', price: 35 },
      { id: 't2-2', name: 'General Admission', price: 45 },
    ],
  },
  {
    id: '3',
    name: 'Modern Art Expo Quito',
    description: 'Discover the work of contemporary Ecuadorian artists in this stunning exhibition. Includes interactive installations.',
    date: new Date('2024-12-05T10:00:00'),
    location: { name: 'Centro de Arte Contemporáneo, Quito', lat: -0.2111, lng: -78.5097 },
    capacity: 500,
    image: 'event-exhibition',
    ticketTypes: [{ id: 't3-1', name: 'Standard Entry', price: 15 }],
  },
  {
    id: '4',
    name: 'Quito Gastronomy Fair',
    description: 'A celebration of Ecuadorian cuisine. Taste traditional and modern dishes from the best chefs in the country.',
    date: new Date('2024-09-30T11:00:00'),
    location: { name: 'Parque La Carolina, Quito', lat: -0.1807, lng: -78.4842 },
    capacity: 3000,
    image: 'event-food-festival',
    ticketTypes: [{ id: 't4-1', name: 'All-You-Can-Taste', price: 25 }],
  },
];

let orders: Order[] = [];
let tickets: Ticket[] = [];

// --- Event Functions ---
export const getEvents = async (): Promise<Event[]> => {
  return events.filter(event => event.date >= new Date());
};

export const getEventById = async (id: string): Promise<Event | undefined> => {
  return events.find((event) => event.id === id);
};

// --- User Functions ---
export const findUserByEmail = async (email: string): Promise<User | undefined> => {
  return users.find((user) => user.email === email);
};

export const findUserById = async (id: string): Promise<User | undefined> => {
  return users.find((user) => user.id === id);
};

export const createUser = async (name: string, email: string, password: string): Promise<User> => {
  const newUser: User = {
    id: (users.length + 1).toString(),
    name,
    email,
    password, // In a real app, this would be hashed
    role: 'User',
  };
  users.push(newUser);
  return newUser;
};

// --- Ticket/Order Functions ---
export const createOrder = async (
  userId: string,
  eventId: string,
  ticketSelections: { ticketTypeId: string; quantity: number }[]
): Promise<Order> => {
  const event = await getEventById(eventId);
  if (!event) throw new Error('Event not found');

  const newTickets: Ticket[] = [];
  let totalAmount = 0;
  
  const orderId = `o-${orders.length + 1}`;

  for (const selection of ticketSelections) {
    const ticketType = event.ticketTypes.find(tt => tt.id === selection.ticketTypeId);
    if (!ticketType) throw new Error(`Ticket type ${selection.ticketTypeId} not found`);

    totalAmount += ticketType.price * selection.quantity;

    for (let i = 0; i < selection.quantity; i++) {
        const ticketId = `t-${tickets.length + newTickets.length + 1}`;
        const newTicket: Ticket = {
            id: ticketId,
            orderId: orderId,
            eventId,
            userId,
            ticketTypeId: selection.ticketTypeId,
            qrData: JSON.stringify({ ticketId, eventId, userId }), // Simple JWT-like data
            status: 'valid'
        };
        newTickets.push(newTicket);
    }
  }

  const newOrder: Order = {
    id: orderId,
    userId,
    eventId,
    tickets: newTickets,
    totalAmount,
    createdAt: new Date(),
  };

  orders.push(newOrder);
  tickets.push(...newTickets);
  
  return newOrder;
};

export const getTicketsByUserId = async (userId: string): Promise<Ticket[]> => {
    return tickets.filter(ticket => ticket.userId === userId);
}

export const getTicketById = async (ticketId: string): Promise<Ticket | undefined> => {
    return tickets.find(ticket => ticket.id === ticketId);
}

export const validateAndUseTicket = async (ticketId: string): Promise<{ success: boolean; message: string; ticket?: Ticket, event?: Event }> => {
    const ticketIndex = tickets.findIndex(t => t.id === ticketId);
    if(ticketIndex === -1) {
        return { success: false, message: "Invalid Ticket: Not found." };
    }

    const ticket = tickets[ticketIndex];
    const event = await getEventById(ticket.eventId);

    if (ticket.status === 'used') {
        return { success: false, message: "Ticket Already Used.", ticket, event };
    }

    tickets[ticketIndex] = { ...ticket, status: 'used' };
    
    return { success: true, message: "Ticket Validated Successfully.", ticket, event };
}
