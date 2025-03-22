<script lang="ts">
  import RoleSelector from '$lib/components/RoleSelector.svelte';
  import TimesheetTable from '$lib/components/TimesheetTable.svelte';
  import MissingTimesheets from '$lib/components/MissingTimesheets.svelte';
  import InvoiceGenerator from '$lib/components/InvoiceGenerator.svelte';
  import { currentUser } from '$lib/stores/timesheetStore';
</script>

<div>
  <RoleSelector />
  
  <div class="bg-white p-4 rounded shadow mb-6">
    <h1 class="text-2xl font-bold mb-2">
      {$currentUser.role === 'admin' 
        ? 'Timesheet Administration' 
        : 'Client Timesheet Portal'}
    </h1>
    <p class="text-gray-600 mb-4">
      {$currentUser.role === 'admin'
        ? 'Manage employee timesheets and generate invoices.'
        : 'Review and approve employee timesheets for your company.'}
    </p>
  </div>
  
  <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
    <div class="xl:col-span-2">
      <TimesheetTable />
      <MissingTimesheets />
    </div>
    <div>
      <InvoiceGenerator />
    </div>
  </div>
</div>
