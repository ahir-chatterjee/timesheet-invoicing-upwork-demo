<script lang="ts">
  import TimesheetCreation from '$lib/components/TimesheetCreation.svelte';
  import { goto } from '$app/navigation';
  
  function handleClose() {
    goto('/');
  }
  
  interface CreatedEvent {
    detail: { id: string };
  }
  
  function handleCreated(event: CreatedEvent) {
    const { id } = event.detail;
    goto(`/timesheet/${id}`);
  }
</script>

<svelte:head>
  <title>Create Timesheet</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <TimesheetCreation on:close={handleClose} on:created={handleCreated} />
</div> 