<script lang="ts">
  import { currentUser, clientOptions } from '$lib/stores/timesheetStore';
  
  let selectedRole = $state('admin');
  let selectedClientId = $state('');
  
  // When role changes, update the store
  $effect(() => {
    if (selectedRole === 'admin') {
      currentUser.set({ role: 'admin' });
    } else if (selectedRole === 'client' && selectedClientId) {
      currentUser.set({ role: 'client', clientId: selectedClientId });
    }
  });
</script>

<div class="bg-white p-4 rounded shadow mb-6">
  <h2 class="text-lg font-semibold mb-4">Demo Mode</h2>
  <div class="flex flex-col sm:flex-row gap-4">
    <div class="flex-1">
      <label for="role-select" class="block text-sm font-medium text-gray-700 mb-1">
        Select Role
      </label>
      <select
        id="role-select"
        bind:value={selectedRole}
        class="w-full p-2 border border-gray-300 rounded"
      >
        <option value="admin">Administrator</option>
        <option value="client">Client</option>
      </select>
    </div>
    
    {#if selectedRole === 'client'}
      <div class="flex-1">
        <label for="client-select" class="block text-sm font-medium text-gray-700 mb-1">
          Select Client
        </label>
        <select
          id="client-select"
          bind:value={selectedClientId}
          class="w-full p-2 border border-gray-300 rounded"
        >
          <option value="" disabled>Select a client</option>
          {#each $clientOptions as client}
            <option value={client.id}>{client.name}</option>
          {/each}
        </select>
      </div>
    {/if}
  </div>
</div> 