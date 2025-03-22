<script lang="ts">
  import { missingTimesheets, selectedWeek, getClientName } from '$lib/stores/timesheetStore';
  import TimesheetCreation from './TimesheetCreation.svelte';
  
  // State
  let showCreateForm = $state(false);
  let selectedEmployeeId = $state<string | null>(null);
  
  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }
  
  function handleCreateClick(employeeId: string) {
    selectedEmployeeId = employeeId;
    showCreateForm = true;
  }
  
  function handleCreateBulk() {
    selectedEmployeeId = null;
    showCreateForm = true;
  }
  
  function handleCloseForm() {
    showCreateForm = false;
    selectedEmployeeId = null;
  }
  
  function handleTimesheetCreated() {
    showCreateForm = false;
    selectedEmployeeId = null;
  }
  
  function exportMissingTimesheets() {
    // Create export data
    const exportData = $missingTimesheets.map(emp => ({
      id: emp.id,
      name: emp.name,
      client: getClientName(emp.clientId),
      weekEnding: $selectedWeek
    }));
    
    // Create a data URI for the JSON content
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    
    // Create a download anchor and click it
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `missing-timesheets-${$selectedWeek}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }
</script>

{#if showCreateForm}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
      <TimesheetCreation 
        on:close={handleCloseForm} 
        on:created={handleTimesheetCreated}
      />
    </div>
  </div>
{/if}

<div class="mb-6">
  <div class="flex justify-between items-center mb-4">
    <h2 class="text-xl font-semibold">Missing Timesheets</h2>
    {#if $missingTimesheets.length > 0}
      <div class="flex gap-2">
        <button 
          onclick={exportMissingTimesheets}
          class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
        >
          Export Report
        </button>
        <button 
          onclick={handleCreateBulk}
          class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
        >
          Create Missing Timesheets
        </button>
      </div>
    {/if}
  </div>
  
  {#if $missingTimesheets.length === 0}
    <div class="bg-white p-6 rounded shadow text-center">
      <p class="text-green-500">All timesheets have been submitted for the week ending {formatDate($selectedWeek)}.</p>
    </div>
  {:else}
    <div class="bg-white rounded shadow">
      <div class="p-4 bg-yellow-50 text-yellow-700 border-b border-yellow-100">
        <p class="font-medium">The following employees have not submitted timesheets for the week ending {formatDate($selectedWeek)}:</p>
      </div>
      <ul class="divide-y divide-gray-200">
        {#each $missingTimesheets as employee}
          <li class="p-4 flex justify-between items-center">
            <div>
              <p class="font-medium">{employee.name}</p>
              <p class="text-sm text-gray-500">Client: {getClientName(employee.clientId)}</p>
            </div>
            <div class="flex items-center gap-2">
              <span class="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
                Missing
              </span>
              <button 
                onclick={() => handleCreateClick(employee.id)}
                class="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs"
              >
                Create
              </button>
            </div>
          </li>
        {/each}
      </ul>
    </div>
  {/if}
</div> 