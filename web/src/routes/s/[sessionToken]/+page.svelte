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
	<div class="bg-white/90 backdrop-blur-md rounded-xl shadow-lg p-6 border border-primary-100">
		<div class="flex items-center gap-4">
			<div class="p-3 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl shadow-md shadow-primary-200/30">
				<svg class="w-5 h-5 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
				</svg>
			</div>
			<div>
				<h3 class="text-xs font-semibold text-primary-600 uppercase tracking-wide">Session Token</h3>
				<p class="text-sm font-mono text-slate-700 mt-1 bg-slate-100 px-3 py-1.5 rounded-lg">{sessionToken}</p>
			</div>
		</div>
	</div>

	<!-- Authentication Status Card -->
	{#if status === 'pending'}
		<div class="bg-white/90 backdrop-blur-md rounded-xl shadow-lg p-8 border border-primary-100">
			<div class="text-center">
				<h2 class="text-xl font-bold text-slate-800 mb-2">Connect WhatsApp</h2>
				<p class="text-sm text-slate-500 mb-6">Link your WhatsApp account to start transcribing</p>
				{#if qrCodeUrl}
					<div class="flex flex-col items-center gap-5">
						<div class="p-5 bg-white rounded-2xl shadow-xl border-2 border-primary-200">
							<img class="w-64 h-64" src={qrCodeUrl} alt="QR Code" />
						</div>
						<div class="bg-slate-50 rounded-lg p-4 max-w-sm">
							<p class="text-sm text-slate-600">
								<span class="font-semibold text-primary-600">Step 1:</span> Open WhatsApp on your phone<br/>
								<span class="font-semibold text-primary-600">Step 2:</span> Go to Settings → Linked Devices<br/>
								<span class="font-semibold text-primary-600">Step 3:</span> Scan this QR code
							</p>
						</div>
					</div>
				{:else}
					<div class="flex flex-col items-center gap-4 py-12">
						<div class="p-4 bg-primary-50 rounded-full">
							<LoaderCircleIcon class="animate-spin w-10 h-10 text-primary-500" />
						</div>
						<p class="text-slate-600 font-medium">Connecting to WhatsApp...</p>
						<p class="text-xs text-slate-400">Please wait while we establish a connection</p>
					</div>
				{/if}
			</div>
		</div>
	{:else if status === 'authenticated'}
		<div class="bg-gradient-to-r from-primary-50 to-primary-100/50 backdrop-blur-md rounded-xl shadow-lg p-6 border border-primary-200">
			<div class="flex items-center gap-4">
				<div class="p-3 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg shadow-primary-300/50">
					<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
				</div>
				<div>
					<h3 class="text-lg font-bold text-slate-800">Successfully Connected!</h3>
					<p class="text-sm text-primary-700">Your WhatsApp is ready for transcription</p>
				</div>
			</div>
		</div>
	{/if}

	<svelte:boundary>
		{#snippet failed(e)}
			<div class="bg-gradient-to-r from-accent-50 to-red-50 backdrop-blur-md rounded-xl shadow-lg p-6 border border-accent-200">
				<div class="flex items-start gap-4">
					<div class="p-3 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl shadow-lg shadow-accent-300/50 flex-shrink-0">
						<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</div>
					<div class="flex-1">
						<h3 class="text-lg font-bold text-slate-900 mb-2">Failed to load session</h3>
						<pre class="text-xs text-slate-700 bg-white/80 p-4 rounded-lg overflow-auto border border-slate-200">{e}</pre>
					</div>
				</div>
			</div>
		{/snippet}

		{#if session}
			<!-- Session Controls Card -->
			<div class="bg-white/90 backdrop-blur-md rounded-xl shadow-lg p-6 border border-primary-100">
				<div class="flex items-center gap-3 mb-5">
					<div class="p-2 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg">
						<svg class="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
						</svg>
					</div>
					<h3 class="text-lg font-bold text-slate-800">Session Controls</h3>
				</div>

				<div class="space-y-4">
					<!-- Target Chat Status -->
					{#if session.targetChatId?.length}
						<div class="flex items-center gap-3 p-4 bg-gradient-to-r from-primary-50 to-primary-100/50 rounded-xl border border-primary-200">
							<div class="p-2 bg-primary-500 rounded-lg shadow-md shadow-primary-200/50">
								<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
								</svg>
							</div>
							<span class="text-sm font-semibold text-primary-800">Target chat configured</span>
						</div>
					{/if}

					<!-- Create Transcription Chat Button -->
					<button
						class="w-full bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 active:from-accent-700 active:to-accent-800 text-white font-semibold py-3.5 px-5 rounded-xl transition-all duration-200 shadow-lg shadow-accent-200/50 hover:shadow-xl hover:shadow-accent-300/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg"
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
					<label class="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 hover:border-slate-300 transition-all duration-200">
						<div class="flex items-center gap-3">
							<div class="p-2.5 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl shadow-md shadow-primary-100/50">
								<svg class="w-5 h-5 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
								</svg>
							</div>
							<div>
								<span class="font-semibold text-slate-800">Session Active</span>
								<p class="text-xs text-slate-500 mt-0.5">Enable or disable transcription</p>
							</div>
						</div>
						<input
							type="checkbox"
							bind:checked={session.active}
							onchange={updateSession}
							class="w-5 h-5 text-primary-500 border-slate-300 rounded-md focus:ring-2 focus:ring-primary-400 focus:ring-offset-2"
						/>
					</label>
				</div>
			</div>
		{/if}
	</svelte:boundary>
</div>
