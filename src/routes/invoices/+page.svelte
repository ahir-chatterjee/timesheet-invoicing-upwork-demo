<script lang="ts">
  import { 
    currentUser, 
    getClientName
  } from '$lib/stores/timesheetStore';
  import { 
    invoices, 
    updateInvoiceStatus,
    formatInvoiceDataForPDF 
  } from '$lib/stores/invoiceStore';
  import { downloadInvoicePDF } from '$lib/utils/pdfGenerator';
  import type { Invoice } from '$lib/types';
  
  // Filtered invoices based on user role
  $effect(() => {
    if ($currentUser.role === 'client' && $currentUser.clientId) {
      filteredInvoices = $invoices.filter(inv => inv.clientId === $currentUser.clientId);
    } else {
      filteredInvoices = [...$invoices];
    }
  });
  
  // State variables
  let filteredInvoices = $state<Invoice[]>([]);
  let selectedStatus = $state<'all' | 'draft' | 'sent' | 'paid'>('all');
  let showExportOptions = $state(false);
  let exportFormat = $state<'json' | 'csv'>('json');
  
  // Apply status filter
  $effect(() => {
    const baseInvoices = $currentUser.role === 'client' && $currentUser.clientId
      ? $invoices.filter(inv => inv.clientId === $currentUser.clientId)
      : [...$invoices];
      
    filteredInvoices = selectedStatus === 'all'
      ? baseInvoices
      : baseInvoices.filter(inv => inv.status === selectedStatus);
  });
  
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
  
  function getStatusClass(status: string): string {
    switch (status) {
      case 'draft':
        return 'bg-gray-200 text-gray-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-200';
    }
  }
  
  async function downloadInvoice(invoice: Invoice) {
    const invoiceData = formatInvoiceDataForPDF(invoice);
    await downloadInvoicePDF(invoiceData);
  }
  
  function changeStatus(invoice: Invoice, status: 'draft' | 'sent' | 'paid') {
    updateInvoiceStatus(invoice.id, status);
  }
  
  function exportInvoices() {
    // Prepare data for export
    const exportData = filteredInvoices.map(inv => {
      const { id, clientId, totalAmount, status, createdAt, periodStart, periodEnd } = inv;
      return {
        id,
        clientName: getClientName(clientId),
        clientId,
        totalAmount,
        status,
        createdAt,
        periodStart,
        periodEnd,
        // Additional fields for accounting integration
        accountingReference: `INV-${id.replace('inv-', '')}`,
        paymentDueDate: new Date(new Date(createdAt).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      };
    });
    
    let dataStr: string;
    let filename: string;
    
    if (exportFormat === 'json') {
      // JSON export
      dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
      filename = `invoices-export-${new Date().toISOString().split('T')[0]}.json`;
    } else {
      // CSV export
      const headers = Object.keys(exportData[0]).join(',');
      const csvRows = exportData.map(obj => 
        Object.values(obj).map(value => 
          typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value
        ).join(',')
      );
      const csvContent = [headers, ...csvRows].join('\n');
      
      dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent);
      filename = `invoices-export-${new Date().toISOString().split('T')[0]}.csv`;
    }
    
    // Trigger download
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    
    showExportOptions = false;
  }
</script>

<div>
  <div class="bg-white p-4 rounded shadow mb-6">
    <h1 class="text-2xl font-bold mb-2">Invoice Management</h1>
    <p class="text-gray-600">
      {$currentUser.role === 'admin' 
        ? 'View, manage, and export all client invoices.' 
        : 'View and download your company invoices.'}
    </p>
  </div>
  
  <div class="bg-white rounded shadow p-6">
    <div class="flex justify-between items-center mb-6">
      <div class="flex space-x-2">
        <button 
          class={`px-3 py-1 text-sm rounded-full ${selectedStatus === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onclick={() => selectedStatus = 'all'}
        >
          All
        </button>
        <button 
          class={`px-3 py-1 text-sm rounded-full ${selectedStatus === 'draft' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onclick={() => selectedStatus = 'draft'}
        >
          Draft
        </button>
        <button 
          class={`px-3 py-1 text-sm rounded-full ${selectedStatus === 'sent' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onclick={() => selectedStatus = 'sent'}
        >
          Sent
        </button>
        <button 
          class={`px-3 py-1 text-sm rounded-full ${selectedStatus === 'paid' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onclick={() => selectedStatus = 'paid'}
        >
          Paid
        </button>
      </div>
      
      {#if $currentUser.role === 'admin'}
        <div class="relative">
          <button 
            onclick={() => showExportOptions = !showExportOptions}
            class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Export Data
          </button>
          
          {#if showExportOptions}
            <div class="absolute right-0 mt-2 w-56 bg-white rounded shadow-lg p-3 z-10">
              <p class="text-sm font-medium mb-2">Export Format</p>
              <div class="flex flex-col space-y-2">
                <label class="flex items-center">
                  <input 
                    type="radio" 
                    name="format" 
                    value="json" 
                    bind:group={exportFormat}
                    class="mr-2" 
                  />
                  <span class="text-sm">JSON (QuickBooks)</span>
                </label>
                <label class="flex items-center">
                  <input 
                    type="radio" 
                    name="format" 
                    value="csv" 
                    bind:group={exportFormat}
                    class="mr-2" 
                  />
                  <span class="text-sm">CSV</span>
                </label>
                <button 
                  onclick={exportInvoices}
                  class="mt-2 bg-green-500 hover:bg-green-600 text-white text-sm px-3 py-1 rounded"
                >
                  Download
                </button>
              </div>
            </div>
          {/if}
        </div>
      {/if}
    </div>
    
    {#if !filteredInvoices.length}
      <div class="text-center py-6">
        <p class="text-gray-500">No invoices found matching the selected filter.</p>
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Invoice #
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Client
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
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each filteredInvoices as invoice}
              <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {invoice.id}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                  {getClientName(invoice.clientId)}
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
                  <span class={`px-2 py-1 text-xs rounded-full ${getStatusClass(invoice.status)}`}>
                    {formatStatus(invoice.status)}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-right space-x-2">
                  <button 
                    onclick={() => downloadInvoice(invoice)}
                    class="text-blue-500 hover:text-blue-600"
                  >
                    Download
                  </button>
                  
                  {#if $currentUser.role === 'admin'}
                    <div class="inline-block relative group">
                      <button class="text-gray-500 hover:text-gray-700">
                        Status ▼
                      </button>
                      <div class="absolute right-0 hidden group-hover:block bg-white shadow-lg rounded p-2 z-10 w-32">
                        <button 
                          onclick={() => changeStatus(invoice, 'draft')}
                          class="block w-full text-left px-2 py-1 text-sm hover:bg-gray-100 rounded"
                        >
                          Mark as Draft
                        </button>
                        <button 
                          onclick={() => changeStatus(invoice, 'sent')}
                          class="block w-full text-left px-2 py-1 text-sm hover:bg-gray-100 rounded"
                        >
                          Mark as Sent
                        </button>
                        <button 
                          onclick={() => changeStatus(invoice, 'paid')}
                          class="block w-full text-left px-2 py-1 text-sm hover:bg-gray-100 rounded"
                        >
                          Mark as Paid
                        </button>
                      </div>
                    </div>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div> 