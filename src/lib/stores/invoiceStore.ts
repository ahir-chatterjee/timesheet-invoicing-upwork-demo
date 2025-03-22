import { writable, derived } from 'svelte/store';
import type { Invoice, Client } from '$lib/types';
import { invoices as initialInvoices, clients } from '$lib/data/mockData';
import { timesheets, employeeList } from './timesheetStore';
import type { InvoiceData } from '$lib/utils/pdfGenerator';

// Invoices store with initial data
export const invoices = writable<Invoice[]>(initialInvoices);

// Create a new invoice
export function createInvoice(clientId: string, timesheetIds: string[], startDate: string, endDate: string): string {
  const id = `inv-${Date.now().toString().slice(-6)}`;
  const createdAt = new Date().toISOString();
  
  // Calculate total amount
  let totalAmount = 0;
  
  // Get all timesheets
  const allTimesheets = get(timesheets);
  const allEmployees = get(employeeList);
  
  // Calculate total amount
  timesheetIds.forEach(tsId => {
    const ts = allTimesheets.find(t => t.id === tsId);
    if (ts) {
      const employee = allEmployees.find(e => e.id === ts.employeeId);
      if (employee) {
        totalAmount += ts.hours * employee.rate;
      }
    }
  });
  
  const newInvoice: Invoice = {
    id,
    clientId,
    timesheets: timesheetIds,
    totalAmount,
    status: 'draft',
    createdAt,
    periodStart: startDate,
    periodEnd: endDate
  };
  
  invoices.update(items => [...items, newInvoice]);
  
  return id;
}

// Update invoice status
export function updateInvoiceStatus(id: string, status: 'draft' | 'sent' | 'paid'): void {
  invoices.update(items => 
    items.map(item => item.id === id ? { ...item, status } : item)
  );
}

// Get invoice by ID
export function getInvoiceById(id: string): Invoice | undefined {
  return get(invoices).find(inv => inv.id === id);
}

// Helper function to get store value without subscription
function get<T>(store: { subscribe: (run: (value: T) => void) => any }): T {
  let value: T;
  const unsubscribe = store.subscribe(val => value = val);
  unsubscribe();
  return value!;
}

// Format invoice data for the PDF generator
export function formatInvoiceDataForPDF(invoice: Invoice, notes?: string): InvoiceData {
  const allTimesheets = get(timesheets);
  const allEmployees = get(employeeList);
  
  // Find the client name
  const client = clients.find((c: Client) => c.id === invoice.clientId);
  
  // Generate items array
  const items = invoice.timesheets.map(tsId => {
    const ts = allTimesheets.find(t => t.id === tsId);
    if (!ts) {
      return null;
    }
    
    const employee = allEmployees.find(e => e.id === ts.employeeId);
    
    return {
      employee: employee ? employee.name : 'Unknown Employee',
      weekEnding: ts.weekEnding,
      hours: ts.hours,
      rate: employee ? employee.rate : 0,
      amount: ts.hours * (employee ? employee.rate : 0)
    };
  }).filter(Boolean);
  
  return {
    invoiceNumber: invoice.id.replace('inv-', ''),
    clientName: client ? client.name : 'Unknown Client',
    clientEmail: client ? client.email : undefined,
    periodStart: invoice.periodStart,
    periodEnd: invoice.periodEnd,
    items: items as any[],
    totalAmount: invoice.totalAmount,
    generatedAt: invoice.createdAt,
    notes
  };
} 