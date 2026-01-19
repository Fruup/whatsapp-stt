<script lang="ts">
	import { page } from '$app/state'
	import {
		createTranscriptionChat,
		updateSession as updateSession_,
	} from '$lib/sessions/functions.remote'
	import { createSessionMessageReceiver } from '$routes/api/v1/session'
	import QRCode from 'qrcode'
	import type { Session } from '$lib/sessions'
	import { LoaderCircleIcon } from '@lucide/svelte'

	const sessionToken = $derived(page.params.sessionToken!)

	let session = $state<Session>()
	let qrCodeUrl = $state<string | null>(null)
	let status = $state<'pending' | 'authenticated'>('pending')

	$effect(() =>
		createSessionMessageReceiver(sessionToken, {
			async qrCode({ value }) {
				console.log('QR Code:', value)

				qrCodeUrl = await QRCode.toDataURL(value)
			},
			successfullyAuthenticated() {
				status = 'authenticated'
			},
			updatedSession(updatedSession) {
				session = updatedSession
			},
		}),
	)

	const updateSession = async () => {
		if (!session) return

		await updateSession_({
			sessionToken,
			data: session,
		})
	}
</script>

<div class="space-y-6">
	<!-- Session Token Card -->
	<div class="bg-white/80 backdrop-blur-sm rounded-xl shadow-md p-6 border border-slate-200/50">
		<div class="flex items-center gap-3">
			<div class="p-2 bg-primary-100 rounded-lg">
				<svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
				</svg>
			</div>
			<div>
				<h3 class="text-sm font-medium text-slate-500">Session Token</h3>
				<p class="text-sm font-mono text-slate-800 mt-0.5">{sessionToken}</p>
			</div>
		</div>
	</div>

	<!-- Authentication Status Card -->
	{#if status === 'pending'}
		<div class="bg-white/80 backdrop-blur-sm rounded-xl shadow-md p-8 border border-slate-200/50">
			<div class="text-center">
				<h2 class="text-xl font-semibold text-slate-800 mb-6">Connect WhatsApp</h2>
				{#if qrCodeUrl}
					<div class="flex flex-col items-center gap-4">
						<div class="p-4 bg-white rounded-xl shadow-lg border border-primary-200/50">
							<img class="w-64 h-64" src={qrCodeUrl} alt="QR Code" />
						</div>
						<p class="text-sm text-slate-600 max-w-md">
							Open WhatsApp on your phone, go to Settings → Linked Devices, and scan this QR code
						</p>
					</div>
				{:else}
					<div class="flex flex-col items-center gap-3 py-8">
						<LoaderCircleIcon class="animate-spin w-8 h-8 text-primary-500" />
						<p class="text-slate-600">Connecting to WhatsApp...</p>
					</div>
				{/if}
			</div>
		</div>
	{:else if status === 'authenticated'}
		<div class="bg-primary-50/80 backdrop-blur-sm rounded-xl shadow-md p-6 border border-primary-200/50">
			<div class="flex items-center gap-3">
				<div class="p-2 bg-primary-500 rounded-full">
					<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
				</div>
				<div>
					<h3 class="text-lg font-semibold text-slate-800">Session Authenticated!</h3>
					<p class="text-sm text-slate-600">Your WhatsApp is successfully connected</p>
				</div>
			</div>
		</div>
	{/if}

	<svelte:boundary>
		{#snippet failed(e)}
			<div class="bg-red-50/80 backdrop-blur-sm rounded-xl shadow-md p-6 border border-red-200/50">
				<div class="flex items-start gap-3">
					<div class="p-2 bg-red-500 rounded-full flex-shrink-0">
						<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</div>
					<div class="flex-1">
						<h3 class="text-lg font-semibold text-slate-900 mb-2">Failed to load session</h3>
						<pre class="text-xs text-slate-700 bg-white/50 p-3 rounded-lg overflow-auto">{e}</pre>
					</div>
				</div>
			</div>
		{/snippet}

		{#if session}
			<!-- Session Controls Card -->
			<div class="bg-white/80 backdrop-blur-sm rounded-xl shadow-md p-6 border border-slate-200/50">
				<h3 class="text-lg font-semibold text-slate-800 mb-4">Session Controls</h3>

				<div class="space-y-4">
					<!-- Target Chat Status -->
					{#if session.targetChatId?.length}
						<div class="flex items-center gap-2 p-3 bg-primary-50 rounded-lg border border-primary-200/50">
							<svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
							</svg>
							<span class="text-sm font-medium text-slate-800">Target chat configured</span>
						</div>
					{/if}

					<!-- Create Transcription Chat Button -->
					<button
						class="w-full bg-accent-600 hover:bg-accent-700 active:bg-accent-800 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-accent-600"
						onclick={async (e) => {
							const el = e.target as HTMLButtonElement

							el.disabled = true

							try {
								await createTranscriptionChat({ sessionToken })
							} catch (e) {
								console.error(e)
							} finally {
								el.disabled = false
							}
						}}
					>
						Create new transcription chat
					</button>

					<!-- Active Toggle -->
					<label class="flex items-center justify-between p-4 bg-slate-50/50 rounded-lg border border-slate-200/50 cursor-pointer hover:bg-slate-100/50 transition-colors">
						<div class="flex items-center gap-3">
							<div class="p-2 bg-slate-200/50 rounded-lg">
								<svg class="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
								</svg>
							</div>
							<div>
								<span class="font-medium text-slate-800">Session Active</span>
								<p class="text-xs text-slate-600">Enable or disable transcription</p>
							</div>
						</div>
						<input
							type="checkbox"
							bind:checked={session.active}
							onchange={updateSession}
							class="w-5 h-5 text-primary-500 border-slate-300 rounded focus:ring-2 focus:ring-primary-400"
						/>
					</label>
				</div>
			</div>
		{/if}
	</svelte:boundary>
</div>
