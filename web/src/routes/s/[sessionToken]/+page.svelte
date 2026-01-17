<script lang="ts">
	import { watch } from 'runed'
	import { page } from '$app/state'
	import {
		createTranscriptionChat,
		getSession,
		updateTargetChat,
	} from '$lib/sessions/functions.remote'
	import { createSessionMessageReceiver } from '../../api/v1/session'
	import QRCode from 'qrcode'
	import type { Session } from '$lib/sessions'

	const sessionToken = $derived(page.params.sessionToken!)
	// const getSessionQuery = $derived(getSession({ sessionToken }))

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

	let targetChatId = $state<string>()

	$effect(() => {
		// targetChatId = session.targetChatId ?? undefined
	})

	watch(
		() => targetChatId,
		(targetChatId) => {
			console.log({ targetChatId })

			if (!targetChatId) return

			updateTargetChat({ sessionToken, targetChatId })
		},
		{ lazy: true },
	)
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
		targetChatId: {session.targetChatId}
	{/if}

	<!-- <div>
		<label>
			Select Chat:

			<select bind:value={targetChatId}>
				{#each session.chatOptions as item}
					<option value={item.id}>{item.name}</option>
				{/each}
			</select>
		</label>

		<button
			onclick={async (e) => {
				const el = e.target as HTMLButtonElement

				el.disabled = true

				try {
					await createTranscriptionChat({ sessionToken })
					await getSessionQuery.refresh()
				} catch (e) {
					console.error(e)
				} finally {
					el.disabled = false
				}
			}}
		>
			Create new transcription chat
		</button>
	</div> -->
</svelte:boundary>
