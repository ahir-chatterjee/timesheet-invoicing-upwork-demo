export interface Employee {
  id: string;
  name: string;
  rate: number;
  clientId: string;
}

export interface Timesheet {
  id: string;
  employeeId: string;
  weekEnding: string; // ISO date string format (YYYY-MM-DD)
  hours: number;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  submittedAt: string; // ISO date string
}

export interface Client {
  id: string;
  name: string;
  email?: string;
}

export interface Invoice {
  id: string;
  clientId: string;
  timesheets: string[]; // Array of timesheet IDs
  totalAmount: number;
  status: 'draft' | 'sent' | 'paid';
  createdAt: string; // ISO date string
  periodStart: string; // ISO date string
  periodEnd: string; // ISO date string
}

export type UserRole = 'admin' | 'client';

export interface AppUser {
  role: UserRole;
  clientId?: string; // Only for client users
} 