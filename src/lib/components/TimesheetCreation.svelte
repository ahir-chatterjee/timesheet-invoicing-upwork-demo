<script lang="ts">
  import { 
    createTimesheet,
    employeeList,
    currentUser,
    selectedWeek,
    getEmployeeName
  } from '$lib/stores/timesheetStore';
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher<{
    close: void;
    created: { id: string };
  }>();
  
  // Local state
  let selectedEmployeeId = $state('');
  let hours = $state('');
  let weekEnding = $state($selectedWeek);
  let comments = $state('');
  let isBulkMode = $state(false);
  let selectedEmployeeIds = $state<string[]>([]);
  
  // Reset form
  function resetForm() {
    selectedEmployeeId = '';
    hours = '';
    weekEnding = $selectedWeek;
    comments = '';
    selectedEmployeeIds = [];
  }
  
  // Function to handle submission
  function handleSubmit() {
    // Validate hours
    const parsedHours = parseFloat(hours);
    if (isNaN(parsedHours) || parsedHours <= 0) {
      alert('Please enter a valid number of hours.');
      return;
    }
    
    // Validate week ending
    if (!weekEnding) {
      alert('Please select a week ending date.');
      return;
    }
    
    if (isBulkMode) {
      // Handle bulk creation
      if (selectedEmployeeIds.length === 0) {
        alert('Please select at least one employee.');
        return;
      }
      
      const createdIds: string[] = [];
      
      // Create a timesheet for each selected employee
      for (const employeeId of selectedEmployeeIds) {
        const id = createTimesheet({
          employeeId,
          weekEnding,
          hours: parsedHours,
          status: 'pending',
          comments: comments || undefined
        });
        
        createdIds.push(id);
      }
      
      alert(`Created ${createdIds.length} timesheets successfully.`);
      resetForm();
      dispatch('created', { id: createdIds[0] });
    } else {
      // Handle single creation
      if (!selectedEmployeeId) {
        alert('Please select an employee.');
        return;
      }
      
      const id = createTimesheet({
        employeeId: selectedEmployeeId,
        weekEnding,
        hours: parsedHours,
        status: 'pending',
        comments: comments || undefined
      });
      
      resetForm();
      dispatch('created', { id });
    }
  }
  
  // Function to toggle employee selection in bulk mode
  function toggleEmployeeSelection(employeeId: string) {
    if (selectedEmployeeIds.includes(employeeId)) {
      selectedEmployeeIds = selectedEmployeeIds.filter(id => id !== employeeId);
    } else {
      selectedEmployeeIds = [...selectedEmployeeIds, employeeId];
    }
  }
  
  // Check if all employees are selected
  function areAllEmployeesSelected(): boolean {
    const availableEmployees = getAvailableEmployees();
    return availableEmployees.length > 0 && selectedEmployeeIds.length === availableEmployees.length;
  }
  
  // Select or deselect all employees
  function toggleSelectAll() {
    if (areAllEmployeesSelected()) {
      selectedEmployeeIds = [];
    } else {
      selectedEmployeeIds = getAvailableEmployees().map(emp => emp.id);
    }
  }
  
  // Get employees available for selection based on user role
  function getAvailableEmployees() {
    if ($currentUser.role === 'client' && $currentUser.clientId) {
      return $employeeList.filter(emp => emp.clientId === $currentUser.clientId);
    }
    return $employeeList;
  }
</script>

<div class="bg-white rounded shadow p-6">
  <div class="flex justify-between items-center mb-6">
    <h2 class="text-xl font-semibold">Create Timesheet</h2>
    <button 
      onclick={() => dispatch('close')}
      class="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
    >
      Cancel
    </button>
  </div>
  
  <div class="mb-4">
    <div class="flex gap-4 mb-4">
      <button 
        onclick={() => isBulkMode = false}
        class={`px-4 py-2 rounded ${!isBulkMode ? 'bg-blue-100 text-blue-800 font-medium' : 'bg-gray-100'}`}
      >
        Single Timesheet
      </button>
      <button 
        onclick={() => isBulkMode = true}
        class={`px-4 py-2 rounded ${isBulkMode ? 'bg-blue-100 text-blue-800 font-medium' : 'bg-gray-100'}`}
      >
        Bulk Creation
      </button>
    </div>
    
    {#if isBulkMode}
      <!-- Bulk creation mode -->
      <div class="grid gap-4">
        <div>
          <div class="flex justify-between items-center mb-2">
            <label class="block text-sm font-medium text-gray-700">
              Select Employees
            </label>
            <button 
              onclick={toggleSelectAll}
              class="text-sm text-blue-600 hover:text-blue-800"
            >
              {areAllEmployeesSelected() ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          
          <div class="border border-gray-300 rounded max-h-60 overflow-y-auto p-2">
            {#each getAvailableEmployees() as employee}
              <div class="flex items-center p-2 hover:bg-gray-50">
                <input 
                  type="checkbox" 
                  id={`emp-${employee.id}`} 
                  checked={selectedEmployeeIds.includes(employee.id)}
                  onclick={() => toggleEmployeeSelection(employee.id)}
                  class="mr-2 h-4 w-4"
                />
                <label for={`emp-${employee.id}`} class="text-sm">
                  {employee.name}
                </label>
              </div>
            {/each}
          </div>
          <div class="text-sm text-gray-600 mt-1">
            {selectedEmployeeIds.length} employees selected
          </div>
        </div>
      </div>
    {:else}
      <!-- Single timesheet mode -->
      <div>
        <label for="employee" class="block text-sm font-medium text-gray-700 mb-1">
          Employee
        </label>
        <select 
          id="employee" 
          bind:value={selectedEmployeeId}
          class="w-full p-2 border border-gray-300 rounded"
        >
          <option value="" disabled>Select an employee</option>
          {#each getAvailableEmployees() as employee}
            <option value={employee.id}>{employee.name}</option>
          {/each}
        </select>
      </div>
    {/if}
    
    <!-- Common fields for both modes -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
      <div>
        <label for="hours" class="block text-sm font-medium text-gray-700 mb-1">
          Hours Worked
        </label>
        <input 
          type="number" 
          id="hours" 
          bind:value={hours}
          min="0.5" 
          step="0.5"
          class="w-full p-2 border border-gray-300 rounded"
          placeholder="Enter hours worked"
        />
      </div>
      
      <div>
        <label for="week-ending" class="block text-sm font-medium text-gray-700 mb-1">
          Week Ending
        </label>
        <input 
          type="date" 
          id="week-ending" 
          bind:value={weekEnding}
          class="w-full p-2 border border-gray-300 rounded"
        />
      </div>
    </div>
    
    <div class="mt-4">
      <label for="comments" class="block text-sm font-medium text-gray-700 mb-1">
        Comments (Optional)
      </label>
      <textarea 
        id="comments" 
        bind:value={comments}
        class="w-full p-2 border border-gray-300 rounded h-24"
        placeholder="Add any notes or comments about this timesheet"
      ></textarea>
    </div>
    
    <div class="mt-6">
      <button 
        onclick={handleSubmit}
        class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
      >
        {isBulkMode ? 'Create Timesheets' : 'Create Timesheet'}
      </button>
    </div>
  </div>
</div> 