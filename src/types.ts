export type User = {
  id: string; // from firebase auth
  email: string;
  name: string;
  role: 'user' | 'admin';
  createdAt: number;
  onboardingComplete?: boolean;
  industry?: string;
  degree?: string;
  interestLevel?: string;
  ageGroup?: string;
  primaryGoal?: string;
  avatarUrl?: string;
  bio?: string;
  links?: string;
  lastProfileUpdate?: number;
};

export type Event = {
  id: string; // from firestore doc
  title: string;
  description: string;
  date: number;
  location: string;
  imageUrl: string;
  price: number;
  totalTickets: number;
  availableTickets: number;
  createdAt: number;
  updatedAt: number;
};

export type Ticket = {
  id: string; // from firestore
  eventId: string;
  userId: string;
  purchaseDate: number;
  status: 'active' | 'used' | 'cancelled';
  qrCodeData: string;
};
