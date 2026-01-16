<script lang="ts">
	import { page } from '$app/state'

	const sessionId = $derived(page.params.sessionId)
</script>
