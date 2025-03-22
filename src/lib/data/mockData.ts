import type { Client, Employee, Timesheet, Invoice } from '$lib/types';

// Mock Clients
export const clients: Client[] = [
  {
    id: 'client-1',
    name: 'Acme Corporation',
    email: 'billing@acme.com'
  },
  {
    id: 'client-2',
    name: 'Globex Industries',
    email: 'accounts@globex.com'
  },
  {
    id: 'client-3',
    name: 'Stark Enterprises',
    email: 'finance@stark.com'
  }
];

// Mock Employees
export const employees: Employee[] = [
  {
    id: 'emp-1',
    name: 'John Doe',
    rate: 50,
    clientId: 'client-1'
  },
  {
    id: 'emp-2',
    name: 'Jane Smith',
    rate: 65,
    clientId: 'client-1'
  },
  {
    id: 'emp-3',
    name: 'Bob Johnson',
    rate: 45,
    clientId: 'client-2'
  },
  {
    id: 'emp-4',
    name: 'Alice Williams',
    rate: 55,
    clientId: 'client-2'
  },
  {
    id: 'emp-5',
    name: 'Michael Brown',
    rate: 70,
    clientId: 'client-3'
  }
];

// Helper function to get last week's date
const getLastWeekDate = (): string => {
  const today = new Date();
  const lastWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
  return lastWeek.toISOString().split('T')[0]; // Format as YYYY-MM-DD
};

// Helper function to get current week's date
const getCurrentWeekDate = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0]; // Format as YYYY-MM-DD
};

// Mock Timesheets
export const timesheets: Timesheet[] = [
  // Acme Corporation Timesheets
  {
    id: 'ts-1',
    employeeId: 'emp-1',
    weekEnding: getLastWeekDate(),
    hours: 40,
    status: 'approved',
    comments: 'Approved on time',
    submittedAt: '2023-03-15T14:30:00Z'
  },
  {
    id: 'ts-2',
    employeeId: 'emp-2',
    weekEnding: getLastWeekDate(),
    hours: 38,
    status: 'approved',
    submittedAt: '2023-03-15T16:45:00Z'
  },
  {
    id: 'ts-3',
    employeeId: 'emp-1',
    weekEnding: getCurrentWeekDate(),
    hours: 42,
    status: 'pending',
    submittedAt: '2023-03-22T09:15:00Z'
  },
  // Globex Industries Timesheets
  {
    id: 'ts-4',
    employeeId: 'emp-3',
    weekEnding: getLastWeekDate(),
    hours: 35,
    status: 'approved',
    submittedAt: '2023-03-14T11:20:00Z'
  },
  {
    id: 'ts-5',
    employeeId: 'emp-4',
    weekEnding: getLastWeekDate(),
    hours: 42,
    status: 'rejected',
    comments: 'Hours exceed contract limit',
    submittedAt: '2023-03-15T10:10:00Z'
  },
  {
    id: 'ts-6',
    employeeId: 'emp-3',
    weekEnding: getCurrentWeekDate(),
    hours: 38,
    status: 'pending',
    submittedAt: '2023-03-22T08:30:00Z'
  },
  // Stark Enterprises Timesheets
  {
    id: 'ts-7',
    employeeId: 'emp-5',
    weekEnding: getLastWeekDate(),
    hours: 45,
    status: 'approved',
    submittedAt: '2023-03-15T15:00:00Z'
  },
  {
    id: 'ts-8',
    employeeId: 'emp-5',
    weekEnding: getCurrentWeekDate(),
    hours: 40,
    status: 'pending',
    submittedAt: '2023-03-22T14:25:00Z'
  }
];

// Mock Invoices
export const invoices: Invoice[] = [
  {
    id: 'inv-1',
    clientId: 'client-1',
    timesheets: ['ts-1', 'ts-2'],
    totalAmount: 3970, // (40 * 50) + (38 * 65)
    status: 'sent',
    createdAt: '2023-03-16T10:00:00Z',
    periodStart: '2023-03-08',
    periodEnd: getLastWeekDate()
  },
  {
    id: 'inv-2',
    clientId: 'client-2',
    timesheets: ['ts-4'],
    totalAmount: 1575, // 35 * 45
    status: 'paid',
    createdAt: '2023-03-16T11:30:00Z',
    periodStart: '2023-03-08',
    periodEnd: getLastWeekDate()
  },
  {
    id: 'inv-3',
    clientId: 'client-3',
    timesheets: ['ts-7'],
    totalAmount: 3150, // 45 * 70
    status: 'draft',
    createdAt: '2023-03-16T14:15:00Z',
    periodStart: '2023-03-08',
    periodEnd: getLastWeekDate()
  }
];

// Helper function to identify missing timesheets
export function getMissingTimesheets(weekEnding: string): Employee[] {
  const submittedEmployeeIds = timesheets
    .filter(ts => ts.weekEnding === weekEnding)
    .map(ts => ts.employeeId);
  
  return employees.filter(emp => !submittedEmployeeIds.includes(emp.id));
} 