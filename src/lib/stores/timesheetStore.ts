import { writable, derived } from 'svelte/store';
import type { Timesheet, Client, Employee, AppUser } from '$lib/types';
import { clients, employees, timesheets as initialTimesheets } from '$lib/data/mockData';

// User state store
export const currentUser = writable<AppUser>({
  role: 'admin'
});

// Set up the client dropdown options store
export const clientOptions = writable(clients);

// Timesheets store with initial data
export const timesheets = writable(initialTimesheets);

// Employees store with initial data
export const employeeList = writable(employees);

// Sorting and filtering parameters
export const sortField = writable<'employee' | 'hours' | 'weekEnding' | 'status'>('weekEnding');
export const sortDirection = writable<'asc' | 'desc'>('desc');
export const statusFilter = writable<'all' | 'pending' | 'approved' | 'rejected'>('all');
export const employeeFilter = writable<string>('');
export const clientFilter = writable<string>('');

// Store to track which week we're viewing
export const selectedWeek = writable<string>(
  new Date().toISOString().split('T')[0] // Default to current date
);

// Filter timesheets based on current user's role and clientId
export const filteredTimesheets = derived(
  [timesheets, currentUser, employeeList, statusFilter, employeeFilter, clientFilter],
  ([$timesheets, $currentUser, $employeeList, $statusFilter, $employeeFilter, $clientFilter]) => {
    let filtered = [...$timesheets];
    
    // Role-based filtering
    if ($currentUser.role === 'client' && $currentUser.clientId) {
      // Get all employee IDs for this client
      const clientEmployeeIds = $employeeList
        .filter(emp => emp.clientId === $currentUser.clientId)
        .map(emp => emp.id);
      
      // Return timesheets for only this client's employees
      filtered = filtered.filter(ts => clientEmployeeIds.includes(ts.employeeId));
    }
    
    // Status filtering
    if ($statusFilter !== 'all') {
      filtered = filtered.filter(ts => ts.status === $statusFilter);
    }
    
    // Employee filtering
    if ($employeeFilter) {
      filtered = filtered.filter(ts => ts.employeeId === $employeeFilter);
    }
    
    // Client filtering (admin only)
    if ($currentUser.role === 'admin' && $clientFilter) {
      const clientEmployeeIds = $employeeList
        .filter(emp => emp.clientId === $clientFilter)
        .map(emp => emp.id);
      filtered = filtered.filter(ts => clientEmployeeIds.includes(ts.employeeId));
    }
    
    return filtered;
  }
);

// Filter timesheets by selected week
export const timesheetsByWeek = derived(
  [filteredTimesheets, selectedWeek, sortField, sortDirection],
  ([$filteredTimesheets, $selectedWeek, $sortField, $sortDirection]) => {
    // First filter by week
    let filtered = $filteredTimesheets.filter(ts => ts.weekEnding === $selectedWeek);
    
    // Then sort the results
    return sortTimesheets(filtered, $sortField, $sortDirection);
  }
);

// Function to sort timesheets
function sortTimesheets(timesheets: Timesheet[], field: string, direction: 'asc' | 'desc') {
  return [...timesheets].sort((a, b) => {
    let comparison = 0;
    
    switch (field) {
      case 'employee':
        const employeeA = getEmployeeName(a.employeeId).toLowerCase();
        const employeeB = getEmployeeName(b.employeeId).toLowerCase();
        comparison = employeeA.localeCompare(employeeB);
        break;
      case 'hours':
        comparison = a.hours - b.hours;
        break;
      case 'weekEnding':
        comparison = new Date(a.weekEnding).getTime() - new Date(b.weekEnding).getTime();
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      default:
        comparison = new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
    }
    
    return direction === 'asc' ? comparison : -comparison;
  });
}

// Missing timesheet detection
export const missingTimesheets = derived(
  [employeeList, timesheetsByWeek, selectedWeek],
  ([$employeeList, $timesheetsByWeek, $selectedWeek]) => {
    const submittedEmployeeIds = $timesheetsByWeek.map(ts => ts.employeeId);
    return $employeeList.filter(emp => !submittedEmployeeIds.includes(emp.id));
  }
);

// Pagination settings
export const itemsPerPage = writable(10);
export const currentPage = writable(1);

// Paginated timesheets
export const paginatedTimesheets = derived(
  [timesheetsByWeek, currentPage, itemsPerPage],
  ([$timesheetsByWeek, $currentPage, $itemsPerPage]) => {
    const startIndex = ($currentPage - 1) * $itemsPerPage;
    const endIndex = startIndex + $itemsPerPage;
    return $timesheetsByWeek.slice(startIndex, endIndex);
  }
);

// Total pages
export const totalPages = derived(
  [timesheetsByWeek, itemsPerPage],
  ([$timesheetsByWeek, $itemsPerPage]) => {
    return Math.ceil($timesheetsByWeek.length / $itemsPerPage);
  }
);

// Functions to update timesheets
export function updateTimesheetStatus(id: string, status: 'pending' | 'approved' | 'rejected', comments?: string) {
  timesheets.update(items => {
    return items.map(item => {
      if (item.id === id) {
        return { ...item, status, comments: comments || item.comments };
      }
      return item;
    });
  });
}

// Function to get employee name by ID
export function getEmployeeName(employeeId: string): string {
  const employee = employees.find(emp => emp.id === employeeId);
  return employee ? employee.name : 'Unknown Employee';
}

// Function to get client name by ID
export function getClientName(clientId: string): string {
  const client = clients.find(c => c.id === clientId);
  return client ? client.name : 'Unknown Client';
}

// Function to get client for an employee
export function getClientForEmployee(employeeId: string): Client | null {
  const employee = employees.find(emp => emp.id === employeeId);
  if (!employee) return null;
  
  const client = clients.find(c => c.id === employee.clientId);
  return client || null;
}

// Function to create a new timesheet
export function createTimesheet(newTimesheet: Omit<Timesheet, 'id' | 'submittedAt'>) {
  const id = `ts-${Date.now()}`;
  const submittedAt = new Date().toISOString();
  
  timesheets.update(items => {
    return [...items, { ...newTimesheet, id, submittedAt }];
  });
  
  return id;
}

// Function to update an existing timesheet
export function updateTimesheet(id: string, updates: Partial<Timesheet>) {
  timesheets.update(items => {
    return items.map(item => {
      if (item.id === id) {
        return { ...item, ...updates };
      }
      return item;
    });
  });
} 