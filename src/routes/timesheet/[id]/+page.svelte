<script lang="ts">
  import TimesheetDetail from '$lib/components/TimesheetDetail.svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  
  const id = $page.params.id;
  
  function handleClose() {
    goto('/');
  }
</script>

<svelte:head>
  <title>Timesheet Details</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <TimesheetDetail timesheetId={id} on:close={handleClose} />
</div> 