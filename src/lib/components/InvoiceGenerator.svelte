<script lang="ts">
  import { 
    timesheets as allTimesheets, 
    currentUser, 
    getClientName, 
    getEmployeeName, 
    selectedWeek 
  } from '$lib/stores/timesheetStore';
  import { 
    invoices, 
    createInvoice, 
    updateInvoiceStatus, 
    formatInvoiceDataForPDF 
  } from '$lib/stores/invoiceStore';
  import { downloadInvoicePDF } from '$lib/utils/pdfGenerator';
  import { clients, employees } from '$lib/data/mockData';
  import type { Timesheet, Client, Invoice } from '$lib/types';
  
  // Get the selected client based on current user
  $effect(() => {
    if ($currentUser.role === 'client' && $currentUser.clientId) {
      selectedClientId = $currentUser.clientId;
    }
  });
  
  // State variables
  let selectedClientId = $state('');
  let startDate = $state('');
  let endDate = $state($selectedWeek); // Default to current week
  let invoiceItems = $state<any[]>([]);
  let totalAmount = $state(0);
  let showPreview = $state(false);
  let showHistory = $state(false);
  let invoiceNote = $state('');
  let selectedTimesheets = $state<string[]>([]);
  
  // Filtered invoices for the selected client
  $effect(() => {
    filteredInvoices = $invoices.filter(inv => 
      (selectedClientId && inv.clientId === selectedClientId) || 
      ($currentUser.role === 'client' && $currentUser.clientId && inv.clientId === $currentUser.clientId)
    );
  });
  let filteredInvoices = $state<Invoice[]>([]);
  
  function generateInvoice() {
    if (!selectedClientId) {
      alert('Please select a client');
      return;
    }
    
    if (!startDate || !endDate) {
      alert('Please select a date range');
      return;
    }
    
    // Get client employees
    const clientEmployeeIds = employees
      .filter(emp => emp.clientId === selectedClientId)
      .map(emp => emp.id);
    
    // Get approved timesheets for the client's employees in the date range
    const clientTimesheets = $allTimesheets.filter(ts => 
      clientEmployeeIds.includes(ts.employeeId) && 
      ts.status === 'approved' &&
      ts.weekEnding >= startDate &&
      ts.weekEnding <= endDate
    );
    
    if (clientTimesheets.length === 0) {
      alert('No approved timesheets found for the selected period');
      return;
    }
    
    // Generate invoice items and save timesheet IDs
    selectedTimesheets = clientTimesheets.map(ts => ts.id);
    
    // Generate invoice items for preview
    const items = clientTimesheets.map(ts => {
      const employee = employees.find(emp => emp.id === ts.employeeId);
      return {
        employee: getEmployeeName(ts.employeeId),
        weekEnding: ts.weekEnding,
        hours: ts.hours,
        rate: employee?.rate || 0,
        amount: ts.hours * (employee?.rate || 0)
      };
    });
    
    invoiceItems = items;
    totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
    showPreview = true;
  }
  
  function getClientById(id: string): Client | undefined {
    return clients.find(c => c.id === id);
  }
  
  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }
  
  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD' 
    }).format(amount);
  }
  
  function formatStatus(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }
  
  async function downloadInvoice() {
    // Create the invoice in the store
    const invoiceId = createInvoice(
      selectedClientId, 
      selectedTimesheets,
      startDate,
      endDate
    );
    
    // Get the newly created invoice
    const invoice = $invoices.find(inv => inv.id === invoiceId);
    
    if (invoice) {
      // Format the invoice data for PDF generation
      const invoiceData = formatInvoiceDataForPDF(invoice, invoiceNote);
      
      // Download the PDF
      await downloadInvoicePDF(invoiceData);
      
      // Update the invoice status to 'sent'
      updateInvoiceStatus(invoiceId, 'sent');
      
      // Reset the form
      showPreview = false;
      invoiceNote = '';
    }
  }
  
  async function regenerateInvoice(invoice: Invoice) {
    const invoiceData = formatInvoiceDataForPDF(invoice);
    await downloadInvoicePDF(invoiceData);
  }
  
  function toggleView() {
    showHistory = !showHistory;
    showPreview = false;
  }
</script>

<div class="mb-6">
  <div class="flex justify-between items-center mb-4">
    <h2 class="text-xl font-semibold">Invoice Generator</h2>
    <button 
      onclick={toggleView}
      class="text-blue-500 hover:text-blue-600 text-sm"
    >
      {showHistory ? 'Create New Invoice' : 'View Invoice History'}
    </button>
  </div>
  
  <div class="bg-white rounded shadow p-6">
    {#if showHistory}
      <!-- Invoice History View -->
      <h3 class="text-lg font-semibold mb-4">Invoice History</h3>
      
      {#if !filteredInvoices.length}
        <p class="text-gray-500">No invoices found for this client.</p>
      {:else}
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice #
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Period
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              {#each filteredInvoices as invoice}
                <tr>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">
                    {invoice.id}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">
                    {formatDate(invoice.createdAt)}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">
                    {formatDate(invoice.periodStart)} - {formatDate(invoice.periodEnd)}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">
                    {formatCurrency(invoice.totalAmount)}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <span class={`px-2 py-1 text-xs rounded-full ${
                      invoice.status === 'draft' ? 'bg-gray-200' : 
                      invoice.status === 'sent' ? 'bg-blue-100 text-blue-800' : 
                      'bg-green-100 text-green-800'
                    }`}>
                      {formatStatus(invoice.status)}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <button 
                      onclick={() => regenerateInvoice(invoice)}
                      class="text-blue-500 hover:text-blue-600"
                    >
                      Download
                    </button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    {:else if !showPreview}
      <!-- Invoice Generation Form -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {#if $currentUser.role === 'admin'}
          <div>
            <label for="client-select" class="block text-sm font-medium text-gray-700 mb-1">
              Select Client
            </label>
            <select
              id="client-select"
              bind:value={selectedClientId}
              class="w-full p-2 border border-gray-300 rounded"
            >
              <option value="" disabled>Select a client</option>
              {#each clients as client}
                <option value={client.id}>{client.name}</option>
              {/each}
            </select>
          </div>
        {/if}
        
        <div>
          <label for="date-start" class="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <input 
            type="date" 
            id="date-start" 
            bind:value={startDate} 
            class="w-full p-2 border border-gray-300 rounded"
          />
        </div>
        
        <div>
          <label for="date-end" class="block text-sm font-medium text-gray-700 mb-1">
            End Date
          </label>
          <input 
            type="date" 
            id="date-end" 
            bind:value={endDate} 
            class="w-full p-2 border border-gray-300 rounded"
          />
        </div>
      </div>
      
      <button 
        onclick={generateInvoice}
        class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
      >
        Generate Invoice
      </button>
    {:else}
      <!-- Invoice Preview -->
      <div class="mb-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold">Invoice Preview</h3>
          <div class="text-sm text-gray-500">
            <span>Invoice Date: {formatDate(new Date().toISOString())}</span>
          </div>
        </div>
        
        <div class="mb-4">
          <h4 class="font-medium">Client:</h4>
          <p>{getClientName(selectedClientId)}</p>
        </div>
        
        <div class="mb-4">
          <h4 class="font-medium">Period:</h4>
          <p>{formatDate(startDate)} to {formatDate(endDate)}</p>
        </div>
        
        <table class="min-w-full divide-y divide-gray-200 mb-4">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Employee
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Week Ending
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hours
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rate
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each invoiceItems as item}
              <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm">{item.employee}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">{formatDate(item.weekEnding)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">{item.hours}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">{formatCurrency(item.rate)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">{formatCurrency(item.amount)}</td>
              </tr>
            {/each}
          </tbody>
          <tfoot>
            <tr class="bg-gray-50">
              <td colspan="4" class="px-6 py-3 text-right font-medium">Total:</td>
              <td class="px-6 py-3 font-medium">{formatCurrency(totalAmount)}</td>
            </tr>
          </tfoot>
        </table>
        
        <div class="mb-4">
          <label for="invoice-note" class="block text-sm font-medium text-gray-700 mb-1">
            Invoice Note (Optional)
          </label>
          <textarea
            id="invoice-note"
            bind:value={invoiceNote}
            rows="3"
            class="w-full p-2 border border-gray-300 rounded"
            placeholder="Add any notes to appear on the invoice..."
          ></textarea>
        </div>
        
        <div class="flex justify-between">
          <button 
            onclick={() => showPreview = false}
            class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
          >
            Back
          </button>
          <button 
            onclick={downloadInvoice}
            class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
          >
            Download PDF Invoice
          </button>
        </div>
      </div>
    {/if}
  </div>
</div> 