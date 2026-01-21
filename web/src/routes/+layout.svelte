<script lang="ts">
	import 'virtual:uno.css'
	import favicon from '$lib/assets/favicon.svg'

	let { children } = $props()
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>WhatsApp STT</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-slate-50 via-primary-50/40 to-slate-100 font-sans flex flex-col">
	<!-- Header -->
	<header class="bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 shadow-lg">
		<div class="container mx-auto px-4 py-5 max-w-4xl">
			<div class="flex items-center gap-4">
				<!-- Logo/Icon -->
				<div class="flex items-center justify-center w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl shadow-inner">
					<svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
					</svg>
				</div>
				<div>
					<h1 class="text-2xl font-bold text-white tracking-tight">
						WhatsApp STT
					</h1>
					<p class="text-primary-100 text-sm font-medium">Speech-to-Text Transcription</p>
				</div>
			</div>
		</div>
	</header>

	<!-- Main Content -->
	<main class="flex-1 container mx-auto px-4 py-8 max-w-4xl">
		{@render children()}
	</main>

	<!-- Footer -->
	<footer class="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 text-slate-300">
		<div class="container mx-auto px-4 py-6 max-w-4xl">
			<div class="flex flex-col sm:flex-row items-center justify-between gap-4">
				<div class="flex items-center gap-3">
					<div class="flex items-center justify-center w-8 h-8 bg-primary-500/20 rounded-lg">
						<svg class="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
						</svg>
					</div>
					<span class="text-sm font-medium">Secure transcription service</span>
				</div>
				<div class="flex items-center gap-2 text-sm text-slate-400">
					<span>Powered by</span>
					<span class="font-semibold text-primary-400">WhatsApp STT</span>
				</div>
			</div>
		</div>
	</footer>
</div>
