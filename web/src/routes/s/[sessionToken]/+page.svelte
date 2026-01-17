<script lang="ts">
	import { watch } from 'runed'
	import { page } from '$app/state'
	import { getSession, updateTargetChat } from '$lib/sessions/functions.remote'

	const sessionToken = $derived(page.params.sessionToken!)
	const getSessionQuery = $derived(getSession({ sessionToken }))
	const session = $derived(await getSessionQuery)

	let targetChatId = $state<string>()

	$effect(() => {
		targetChatId = session.targetChatId ?? undefined
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

<svelte:boundary>
	{#snippet failed(e)}
		<div>Failed to load session.</div>
		<pre>{e}</pre>
	{/snippet}

	<div>
		<label>
			Select Chat:

			<select bind:value={targetChatId}>
				{#each session.chatOptions as item}
					<option value={item.id}>{item.name}</option>
				{/each}
			</select>
		</label>
	</div>
</svelte:boundary>
