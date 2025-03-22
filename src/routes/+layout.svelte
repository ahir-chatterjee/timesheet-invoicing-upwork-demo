<script lang="ts">
	import '../app.css';
	import { currentUser } from '$lib/stores/timesheetStore';
	import { page } from '$app/stores';
	let { children } = $props();
</script>

<div class="min-h-screen bg-gray-100">
	<header class="bg-white shadow">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
			<div class="flex justify-between items-center">
				<div class="flex items-center space-x-2">
					<h1 class="text-2xl font-bold text-gray-900">Timesheet Invoicing System</h1>
					<nav class="ml-6">
						<ul class="flex space-x-4">
							<li>
								<a 
									href="/" 
									class={`px-3 py-2 rounded-md text-sm font-medium ${$page.url.pathname === '/' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:text-gray-900'}`}
								>
									Timesheets
								</a>
							</li>
							<li>
								<a 
									href="/invoices" 
									class={`px-3 py-2 rounded-md text-sm font-medium ${$page.url.pathname === '/invoices' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:text-gray-900'}`}
								>
									Invoices
								</a>
							</li>
						</ul>
					</nav>
				</div>
				{#if $currentUser.role === 'admin'}
					<span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
						Admin Mode
					</span>
				{:else if $currentUser.role === 'client'}
					<span class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
						Client Portal
					</span>
				{/if}
			</div>
		</div>
	</header>

	<main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
		{@render children()}
	</main>

	<footer class="bg-white shadow-inner mt-8">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
			<p class="text-center text-gray-500 text-sm">
				&copy; {new Date().getFullYear()} Timesheet Invoicing System - Demo Version
			</p>
		</div>
	</footer>
</div>
