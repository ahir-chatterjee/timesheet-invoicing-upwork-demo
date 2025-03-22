<script lang="ts">
  import { 
    timesheets, 
    updateTimesheet, 
    updateTimesheetStatus, 
    getEmployeeName, 
    getClientForEmployee, 
    currentUser,
    employeeList
  } from '$lib/stores/timesheetStore';
  import type { Timesheet } from '$lib/types';
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher<{
    close: void;
  }>();
  
  const { timesheetId } = $props<{timesheetId: string}>();
  
  // Local state
  let isEditing = $state(false);
  let timesheet = $state<Timesheet | undefined>(undefined);
  let editedHours = $state('');
  let editedWeekEnding = $state('');
  let commentText = $state('');
  
  // Fetch timesheet data
  $effect(() => {
    const ts = $timesheets.find(t => t.id === timesheetId);
    if (ts) {
      timesheet = ts;
      editedHours = ts.hours.toString();
      editedWeekEnding = ts.weekEnding;
      commentText = ts.comments || '';
    }
  });
  
  // Function to format date
  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }
  
  // Function to format datetime
  function formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  // Function to determine if user can edit
  function canEdit(): boolean {
    if (!timesheet) return false;
    
    // Admin can edit all timesheets
    if ($currentUser.role === 'admin') return true;
    
    // Clients cannot edit timesheets
    return false;
  }
  
  // Function to determine if user can approve/reject
  function canApprove(): boolean {
    if (!timesheet) return false;
    
    // Admin can approve all
    if ($currentUser.role === 'admin') return true;
    
    // Client can only approve their own employees' timesheets
    if ($currentUser.role === 'client' && $currentUser.clientId) {
      const client = getClientForEmployee(timesheet.employeeId);
      return client?.id === $currentUser.clientId;
    }
    
    return false;
  }
  
  // Function to save edited timesheet
  function saveTimesheet() {
    if (!timesheet) return;
    
    const hours = parseFloat(editedHours);
    if (isNaN(hours) || hours <= 0) {
      alert('Please enter a valid number of hours.');
      return;
    }
    
    if (!editedWeekEnding) {
      alert('Please select a week ending date.');
      return;
    }
    
    updateTimesheet(timesheet.id, {
      hours,
      weekEnding: editedWeekEnding,
      comments: commentText || undefined
    });
    
    isEditing = false;
  }
  
  // Function to handle approval
  function handleApprove() {
    if (!timesheet) return;
    
    updateTimesheetStatus(timesheet.id, 'approved', commentText);
    commentText = '';
  }
  
  // Function to handle rejection
  function handleReject() {
    if (!timesheet) return;
    
    if (!commentText) {
      alert('Please provide a reason for rejection');
      return;
    }
    updateTimesheetStatus(timesheet.id, 'rejected', commentText);
    commentText = '';
  }
  
  // Function to get status class
  function getStatusClass(status: string): string {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  }
</script>

<div class="bg-white rounded shadow p-6">
  <div class="flex justify-between items-center mb-6">
    <h2 class="text-xl font-semibold">Timesheet Details</h2>
    <button 
      onclick={() => dispatch('close')}
      class="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
    >
      Back to List
    </button>
  </div>
  
  {#if !timesheet}
    <div class="text-center py-8">
      <p class="text-gray-500">Timesheet not found</p>
    </div>
  {:else}
    {#if isEditing}
      <!-- Edit Mode -->
      <div class="grid gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Employee
          </label>
          <p class="p-2 border border-gray-200 rounded bg-gray-50">
            {getEmployeeName(timesheet.employeeId)}
          </p>
        </div>
        
        <div>
          <label for="hours" class="block text-sm font-medium text-gray-700 mb-1">
            Hours
          </label>
          <input 
            type="number" 
            id="hours" 
            bind:value={editedHours} 
            min="0.5" 
            step="0.5"
            class="w-full p-2 border border-gray-300 rounded"
          />
        </div>
        
        <div>
          <label for="week-ending" class="block text-sm font-medium text-gray-700 mb-1">
            Week Ending
          </label>
          <input 
            type="date" 
            id="week-ending" 
            bind:value={editedWeekEnding}
            class="w-full p-2 border border-gray-300 rounded"
          />
        </div>
        
        <div>
          <label for="comments" class="block text-sm font-medium text-gray-700 mb-1">
            Comments
          </label>
          <textarea 
            id="comments" 
            bind:value={commentText}
            class="w-full p-2 border border-gray-300 rounded h-24"
            placeholder="Add comments or notes about this timesheet"
          ></textarea>
        </div>
        
        <div class="flex justify-end gap-2 mt-4">
          <button 
            onclick={() => isEditing = false}
            class="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
          >
            Cancel
          </button>
          <button 
            onclick={saveTimesheet}
            class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Save Changes
          </button>
        </div>
      </div>
    {:else}
      <!-- View Mode -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 class="text-lg font-medium mb-4">Timesheet Information</h3>
          <dl class="grid grid-cols-1 gap-2">
            <div class="bg-gray-50 px-4 py-3 rounded">
              <dt class="text-sm font-medium text-gray-500">Employee</dt>
              <dd class="mt-1 text-sm text-gray-900">{getEmployeeName(timesheet.employeeId)}</dd>
            </div>
            
            <div class="bg-gray-50 px-4 py-3 rounded">
              <dt class="text-sm font-medium text-gray-500">Hours</dt>
              <dd class="mt-1 text-sm text-gray-900">{timesheet.hours}</dd>
            </div>
            
            <div class="bg-gray-50 px-4 py-3 rounded">
              <dt class="text-sm font-medium text-gray-500">Week Ending</dt>
              <dd class="mt-1 text-sm text-gray-900">{formatDate(timesheet.weekEnding)}</dd>
            </div>
            
            <div class="bg-gray-50 px-4 py-3 rounded">
              <dt class="text-sm font-medium text-gray-500">Status</dt>
              <dd class="mt-1">
                <span class={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(timesheet.status)}`}>
                  {timesheet.status.charAt(0).toUpperCase() + timesheet.status.slice(1)}
                </span>
              </dd>
            </div>
            
            <div class="bg-gray-50 px-4 py-3 rounded">
              <dt class="text-sm font-medium text-gray-500">Submitted At</dt>
              <dd class="mt-1 text-sm text-gray-900">{formatDateTime(timesheet.submittedAt)}</dd>
            </div>
          </dl>
        </div>
        
        <div>
          <h3 class="text-lg font-medium mb-4">Actions</h3>
          
          {#if timesheet.status === 'pending' && canApprove()}
            <div class="bg-gray-50 p-4 rounded mb-4">
              <h4 class="font-medium mb-2">Approve or Reject</h4>
              <div class="mb-3">
                <textarea 
                  bind:value={commentText}
                  class="w-full p-2 border border-gray-300 rounded h-24 mb-2"
                  placeholder="Add comments (required for rejection)"
                ></textarea>
                
                <div class="flex gap-2">
                  <button 
                    onclick={handleApprove}
                    class="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded"
                  >
                    Approve Timesheet
                  </button>
                  <button 
                    onclick={handleReject}
                    class="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded"
                  >
                    Reject Timesheet
                  </button>
                </div>
              </div>
            </div>
          {/if}
          
          {#if canEdit()}
            <div class="bg-gray-50 p-4 rounded">
              <h4 class="font-medium mb-2">Edit</h4>
              <button 
                onclick={() => isEditing = true}
                class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded"
              >
                Edit Timesheet
              </button>
            </div>
          {/if}
          
          {#if timesheet.comments}
            <div class="bg-gray-50 p-4 rounded mt-4">
              <h4 class="font-medium mb-2">Comments</h4>
              <p class="text-sm">{timesheet.comments}</p>
            </div>
          {/if}
        </div>
      </div>
    {/if}
  {/if}
</div> 