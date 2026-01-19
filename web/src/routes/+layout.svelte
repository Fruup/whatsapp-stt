<script lang="ts">
	import 'virtual:uno.css'
	import favicon from '$lib/assets/favicon.svg'

	let { children } = $props()
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>WhatsApp STT</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 font-sans">
	<div class="container mx-auto px-4 py-8 max-w-4xl">
		<header class="mb-12">
			<h1 class="text-4xl font-bold text-slate-800 mb-2">
				WhatsApp STT
			</h1>
			<p class="text-slate-600">Speech-to-Text Transcription Service</p>
		</header>

		<main>
			{@render children()}
		</main>

		<footer class="mt-16 text-center text-sm text-slate-500">
			<p>Secure WhatsApp transcription service</p>
		</footer>
	</div>
</div>
