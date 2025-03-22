import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { Invoice } from '$lib/types';

interface InvoiceData {
  invoiceNumber: string;
  clientName: string;
  clientEmail?: string;
  periodStart: string;
  periodEnd: string;
  items: Array<{
    employee: string;
    weekEnding: string;
    hours: number;
    rate: number;
    amount: number;
  }>;
  totalAmount: number;
  generatedAt: string;
  notes?: string;
}

/**
 * Formats a date string as MM/DD/YYYY
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

/**
 * Formats a number as currency (USD)
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD' 
  }).format(amount);
}

/**
 * Generates a PDF invoice from the provided invoice data
 */
export async function generateInvoicePDF(invoiceData: InvoiceData): Promise<Uint8Array> {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  
  // Add a blank page to the document
  let page = pdfDoc.addPage([612, 792]); // US Letter size
  
  // Get the standard font
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // Set page margins
  const margin = 50;
  const width = page.getWidth() - 2 * margin;
  
  // Draw company header (placeholder for logo in real implementation)
  page.drawText('STAFFING COMPANY', {
    x: margin,
    y: 730,
    size: 24,
    font: boldFont,
    color: rgb(0.1, 0.1, 0.4)
  });
  
  page.drawText('123 Business Street, Suite 100', {
    x: margin,
    y: 710,
    size: 10,
    font: font
  });
  
  page.drawText('Business City, State 12345', {
    x: margin,
    y: 695,
    size: 10,
    font: font
  });
  
  // Draw invoice title and number
  page.drawText('INVOICE', {
    x: margin + 400,
    y: 730,
    size: 18,
    font: boldFont
  });
  
  page.drawText(`#${invoiceData.invoiceNumber}`, {
    x: margin + 400,
    y: 710,
    size: 12,
    font: font
  });
  
  page.drawText(`Date: ${formatDate(invoiceData.generatedAt)}`, {
    x: margin + 400,
    y: 695,
    size: 10,
    font: font
  });
  
  // Draw horizontal divider
  page.drawLine({
    start: { x: margin, y: 680 },
    end: { x: margin + width, y: 680 },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8)
  });
  
  // Draw client information
  page.drawText('BILL TO:', {
    x: margin,
    y: 660,
    size: 12,
    font: boldFont
  });
  
  page.drawText(invoiceData.clientName, {
    x: margin,
    y: 645,
    size: 11,
    font: font
  });
  
  if (invoiceData.clientEmail) {
    page.drawText(invoiceData.clientEmail, {
      x: margin,
      y: 630,
      size: 10,
      font: font
    });
  }
  
  // Draw period information
  page.drawText('PERIOD:', {
    x: margin + 300,
    y: 660,
    size: 12,
    font: boldFont
  });
  
  page.drawText(`${formatDate(invoiceData.periodStart)} to ${formatDate(invoiceData.periodEnd)}`, {
    x: margin + 300,
    y: 645,
    size: 11,
    font: font
  });
  
  // Draw table header
  const tableTop = 600;
  const tableHeaders = ['Employee', 'Week Ending', 'Hours', 'Rate', 'Amount'];
  const columnWidths = [200, 100, 70, 70, 80];
  let currentX = margin;
  
  for (let i = 0; i < tableHeaders.length; i++) {
    page.drawText(tableHeaders[i], {
      x: currentX,
      y: tableTop,
      size: 10,
      font: boldFont
    });
    currentX += columnWidths[i];
  }
  
  // Draw horizontal line below headers
  page.drawLine({
    start: { x: margin, y: tableTop - 5 },
    end: { x: margin + width, y: tableTop - 5 },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8)
  });
  
  // Draw invoice items
  let currentY = tableTop - 25;
  for (const item of invoiceData.items) {
    currentX = margin;
    
    // Employee
    page.drawText(item.employee, {
      x: currentX,
      y: currentY,
      size: 10,
      font: font
    });
    currentX += columnWidths[0];
    
    // Week ending
    page.drawText(formatDate(item.weekEnding), {
      x: currentX,
      y: currentY,
      size: 10,
      font: font
    });
    currentX += columnWidths[1];
    
    // Hours
    page.drawText(item.hours.toString(), {
      x: currentX + 35, // Right align
      y: currentY,
      size: 10,
      font: font
    });
    currentX += columnWidths[2];
    
    // Rate
    page.drawText(formatCurrency(item.rate), {
      x: currentX,
      y: currentY,
      size: 10,
      font: font
    });
    currentX += columnWidths[3];
    
    // Amount
    page.drawText(formatCurrency(item.amount), {
      x: currentX,
      y: currentY,
      size: 10,
      font: font
    });
    
    currentY -= 20;
    
    // If we're reaching the bottom of the page, start a new page
    if (currentY < 100) {
      page.drawText('(Continued on next page)', {
        x: margin,
        y: 80,
        size: 10,
        font: font,
        color: rgb(0.5, 0.5, 0.5)
      });
      
      // Add a new page
      const newPage = pdfDoc.addPage([612, 792]);
      page = newPage;
      
      // Reset for new page
      currentY = 730;
      
      // Add continued header
      page.drawText('INVOICE (Continued)', {
        x: margin,
        y: 750,
        size: 14,
        font: boldFont
      });
      
      // Draw table header again
      currentX = margin;
      for (let i = 0; i < tableHeaders.length; i++) {
        page.drawText(tableHeaders[i], {
          x: currentX,
          y: currentY,
          size: 10,
          font: boldFont
        });
        currentX += columnWidths[i];
      }
      
      // Draw horizontal line below headers
      page.drawLine({
        start: { x: margin, y: currentY - 5 },
        end: { x: margin + width, y: currentY - 5 },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8)
      });
      
      currentY -= 25;
    }
  }
  
  // Draw total horizontal line
  page.drawLine({
    start: { x: margin, y: currentY - 5 },
    end: { x: margin + width, y: currentY - 5 },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8)
  });
  
  // Draw total
  currentY -= 25;
  page.drawText('Total:', {
    x: margin + 370,
    y: currentY,
    size: 12,
    font: boldFont
  });
  
  page.drawText(formatCurrency(invoiceData.totalAmount), {
    x: margin + 460,
    y: currentY,
    size: 12,
    font: boldFont
  });
  
  // Draw notes if present
  if (invoiceData.notes) {
    currentY -= 40;
    page.drawText('Notes:', {
      x: margin,
      y: currentY,
      size: 11,
      font: boldFont
    });
    
    currentY -= 20;
    page.drawText(invoiceData.notes, {
      x: margin,
      y: currentY,
      size: 10,
      font: font,
      maxWidth: width
    });
  }
  
  // Draw footer
  page.drawText('Thank you for your business!', {
    x: margin + width / 2 - 70,
    y: 60,
    size: 10,
    font: font
  });
  
  page.drawText('Payment due within 30 days', {
    x: margin + width / 2 - 70,
    y: 45,
    size: 10,
    font: font
  });
  
  // Serialize the PDFDocument to bytes
  return await pdfDoc.save();
}

/**
 * Creates a downloadable PDF from invoice data
 */
export async function downloadInvoicePDF(invoiceData: InvoiceData): Promise<void> {
  const pdfBytes = await generateInvoicePDF(invoiceData);
  
  // Create a blob from the PDF bytes
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  
  // Create a URL for the blob
  const url = URL.createObjectURL(blob);
  
  // Create a temporary anchor element and trigger the download
  const link = document.createElement('a');
  link.href = url;
  link.download = `invoice-${invoiceData.clientName.toLowerCase().replace(/\s+/g, '-')}-${invoiceData.invoiceNumber}.pdf`;
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Export the InvoiceData interface
export type { InvoiceData }; 