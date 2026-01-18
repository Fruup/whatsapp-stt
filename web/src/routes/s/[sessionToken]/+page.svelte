<script lang="ts">
	import { page } from '$app/state'
	import { createTranscriptionChat, updateSession } from '$lib/sessions/functions.remote'
	import { createSessionMessageReceiver } from '$routes/api/v1/session'
	import QRCode from 'qrcode'
	import type { Session } from '$lib/sessions'

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

	const updateSession2 = async () => {
		if (!session) return

		await updateSession({
			sessionToken,
			data: session,
		})
	}
</script>

<div class="font-bold my-8">
	Session token: {sessionToken}
</div>

{#if status === 'pending'}
	<div class="my-8">
		<img class="size-64" src={qrCodeUrl} alt="QR Code" />
	</div>
{:else if status === 'authenticated'}
	<div class="my-8">
		<span class="text-green-600 font-bold">Session authenticated!</span>
	</div>
{/if}

<svelte:boundary>
	{#snippet failed(e)}
		<div>Failed to load session.</div>
		<pre>{e}</pre>
	{/snippet}

	{#if session}
		<div>
			{#if session.targetChatId?.length}
				<span>Target chat set ✅</span>
			{/if}

			<button
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
		</div>

		<div>
			<label>
				Active?

				<input type="checkbox" bind:checked={session.active} onchange={updateSession2} />
			</label>
		</div>
	{/if}
</svelte:boundary>
