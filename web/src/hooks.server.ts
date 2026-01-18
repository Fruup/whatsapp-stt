import { botStore } from '$lib/bot'
import { rateLimit } from '$lib/server/rateLimit'
import type { Handle } from '@sveltejs/kit'

export const handle: Handle = async ({ event, resolve }) => {
	await rateLimit('global', {
		windowInSeconds: 1,
		bucketSize: 5,
	})

	return resolve(event)
}

// await botStore.initialize()
