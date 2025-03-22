<script lang="ts">
  import { 
    paginatedTimesheets,
    timesheetsByWeek,
    selectedWeek, 
    updateTimesheetStatus, 
    getEmployeeName, 
    getClientForEmployee, 
    currentUser,
    sortField,
    sortDirection,
    statusFilter,
    employeeFilter,
    clientFilter,
    clientOptions,
    employeeList,
    currentPage,
    totalPages,
    itemsPerPage
  } from '$lib/stores/timesheetStore';
  import type { Timesheet } from '$lib/types';
  
  let commentInput = $state<Record<string, string>>({});
  
  // Function to handle approval
  function handleApprove(timesheet: Timesheet) {
    updateTimesheetStatus(timesheet.id, 'approved', commentInput[timesheet.id]);
    commentInput[timesheet.id] = '';
  }
  
  // Function to handle rejection
  function handleReject(timesheet: Timesheet) {
    if (!commentInput[timesheet.id]) {
      alert('Please provide a reason for rejection');
      return;
    }
    updateTimesheetStatus(timesheet.id, 'rejected', commentInput[timesheet.id]);
    commentInput[timesheet.id] = '';
  }
  
  // Function to format date
  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }
  
  // Function to determine if user can approve/reject
  function canApprove(timesheet: Timesheet): boolean {
    // Admin can approve all
    if ($currentUser.role === 'admin') return true;
    
    // Client can only approve their own employees' timesheets
    if ($currentUser.role === 'client' && $currentUser.clientId) {
      const client = getClientForEmployee(timesheet.employeeId);
      return client?.id === $currentUser.clientId;
    }
    
    return false;
  }
  
  // Function to handle column sorting
  function handleSort(field: 'employee' | 'hours' | 'weekEnding' | 'status') {
    if ($sortField === field) {
      // Toggle direction if same field
      $sortDirection = $sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // Set new field and default to ascending
      $sortField = field;
      $sortDirection = 'asc';
    }
    
    // Reset to first page when sorting changes
    $currentPage = 1;
  }
  
  // Function to get sort icon
  function getSortIcon(field: 'employee' | 'hours' | 'weekEnding' | 'status'): string {
    if ($sortField !== field) return '↕️';
    return $sortDirection === 'asc' ? '↑' : '↓';
  }
  
  // Pagination functions
  function nextPage() {
    if ($currentPage < $totalPages) {
      $currentPage++;
    }
  }
  
  function prevPage() {
    if ($currentPage > 1) {
      $currentPage--;
    }
  }
  
  function goToPage(page: number) {
    if (page >= 1 && page <= $totalPages) {
      $currentPage = page;
    }
  }
  
  // Handle per page change
  function handlePerPageChange(e: Event) {
    const select = e.target as HTMLSelectElement;
    $itemsPerPage = parseInt(select.value);
    $currentPage = 1; // Reset to first page
  }
  
  // Reset all filters
  function resetFilters() {
    $statusFilter = 'all';
    $employeeFilter = '';
    $clientFilter = '';
    $currentPage = 1;
  }
</script>

<div class="mb-6">
  <div class="flex justify-between items-center mb-4">
    <h2 class="text-xl font-semibold">Timesheets</h2>
    <div class="flex items-center gap-4">
      <a 
        href="/timesheet/create"
        class="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded text-sm"
      >
        Create Timesheet
      </a>
      <div>
        <label for="week-select" class="mr-2">Week Ending:</label>
        <input 
          type="date" 
          id="week-select" 
          bind:value={$selectedWeek} 
          class="p-2 border border-gray-300 rounded"
        />
      </div>
    </div>
  </div>
  
  <!-- Filters -->
  <div class="bg-gray-50 p-4 rounded mb-4">
    <div class="flex flex-wrap gap-4 items-end">
      <div>
        <label for="status-filter" class="block text-sm font-medium text-gray-700 mb-1">Status</label>
        <select 
          id="status-filter" 
          bind:value={$statusFilter}
          class="p-2 border border-gray-300 rounded"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
      
      {#if $currentUser.role === 'admin'}
        <div>
          <label for="client-filter" class="block text-sm font-medium text-gray-700 mb-1">Client</label>
          <select 
            id="client-filter" 
            bind:value={$clientFilter}
            class="p-2 border border-gray-300 rounded"
          >
            <option value="">All Clients</option>
            {#each $clientOptions as client}
              <option value={client.id}>{client.name}</option>
            {/each}
          </select>
        </div>
        
        <div>
          <label for="employee-filter" class="block text-sm font-medium text-gray-700 mb-1">Employee</label>
          <select 
            id="employee-filter" 
            bind:value={$employeeFilter}
            class="p-2 border border-gray-300 rounded"
          >
            <option value="">All Employees</option>
            {#each $employeeList as employee}
              <option value={employee.id}>{employee.name}</option>
            {/each}
          </select>
        </div>
      {/if}
      
      <button 
        onclick={resetFilters}
        class="bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-2 rounded text-sm"
      >
        Reset Filters
      </button>
    </div>
  </div>
  
  {#if $timesheetsByWeek.length === 0}
    <div class="bg-white p-6 rounded shadow text-center">
      <p class="text-gray-500">No timesheets found for the selected week.</p>
    </div>
  {:else}
    <div class="bg-white rounded shadow overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th 
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onclick={() => handleSort('employee')}
            >
              Employee {getSortIcon('employee')}
            </th>
            <th 
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onclick={() => handleSort('hours')}
            >
              Hours {getSortIcon('hours')}
            </th>
            <th 
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onclick={() => handleSort('weekEnding')}
            >
              Week Ending {getSortIcon('weekEnding')}
            </th>
            <th 
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onclick={() => handleSort('status')}
            >
              Status {getSortIcon('status')}
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          {#each $paginatedTimesheets as timesheet}
            <tr>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">
                  {getEmployeeName(timesheet.employeeId)}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{timesheet.hours}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{formatDate(timesheet.weekEnding)}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                  ${timesheet.status === 'approved' ? 'bg-green-100 text-green-800' : 
                    timesheet.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                    'bg-yellow-100 text-yellow-800'}`}>
                  {timesheet.status.charAt(0).toUpperCase() + timesheet.status.slice(1)}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                {#if timesheet.status === 'pending' && canApprove(timesheet)}
                  <div class="flex flex-col gap-2">
                    <div class="flex gap-2">
                      <button 
                        onclick={() => handleApprove(timesheet)}
                        class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                      >
                        Approve
                      </button>
                      <button 
                        onclick={() => handleReject(timesheet)}
                        class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                      >
                        Reject
                      </button>
                    </div>
                    <input 
                      type="text" 
                      placeholder="Comments (required for rejection)"
                      bind:value={commentInput[timesheet.id]} 
                      class="p-1 border border-gray-300 rounded text-sm w-full"
                    />
                  </div>
                {:else if timesheet.comments}
                  <div class="text-sm text-gray-500">
                    <strong>Comments:</strong> {timesheet.comments}
                  </div>
                {:else}
                  <a href={`/timesheet/${timesheet.id}`} class="text-blue-500 hover:text-blue-700">
                    View Details
                  </a>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
      
      <!-- Pagination -->
      <div class="px-6 py-3 flex items-center justify-between border-t border-gray-200">
        <div class="flex items-center">
          <span class="text-sm text-gray-700 mr-2">
            Rows per page:
          </span>
          <select 
            value={$itemsPerPage} 
            onchange={handlePerPageChange}
            class="mr-4 border border-gray-300 rounded p-1 text-sm"
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
          </select>
          <span class="text-sm text-gray-700">
            Showing {$paginatedTimesheets.length} of {$timesheetsByWeek.length} timesheets
          </span>
        </div>
        
        <div class="flex gap-1">
          <button 
            onclick={() => prevPage()}
            disabled={$currentPage === 1}
            class="px-3 py-1 border border-gray-300 rounded-l-md text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          {#each Array.from({ length: $totalPages }, (_, i) => i + 1) as page}
            <button 
              onclick={() => goToPage(page)}
              class={`px-3 py-1 border border-gray-300 text-sm font-medium 
                ${$currentPage === page ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              {page}
            </button>
          {/each}
          
          <button 
            onclick={() => nextPage()}
            disabled={$currentPage === $totalPages || $totalPages === 0}
            class="px-3 py-1 border border-gray-300 rounded-r-md text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  {/if}
</div> 