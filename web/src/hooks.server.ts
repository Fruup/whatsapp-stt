import { rateLimit } from '$lib/server/rateLimit'
import type { Handle } from '@sveltejs/kit'

export const handle: Handle = async ({ event, resolve }) => {
	await rateLimit({
		windowInSeconds: 1,
		bucketSize: 3,
	})

	return resolve(event)
}
