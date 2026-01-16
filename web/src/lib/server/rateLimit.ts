import { getRequestEvent } from '$app/server'
import { error } from '@sveltejs/kit'

export const rateLimit = async (config: {
	request?: Request
	key?: string
	windowInSeconds: number
	bucketSize: number
}) => {
	const event = getRequestEvent()
	const ip = event.getClientAddress()
	const now = Date.now()

	const key = `${ip}:${config.key || 'global'}`

	if (!rateLimitStore.has(key)) {
		rateLimitStore.set(key, { tokens: config.bucketSize, lastRefill: now })
	}
	const rateLimitData = rateLimitStore.get(key)!

	// Refill tokens
	const elapsed = now - rateLimitData.lastRefill
	const tokensToAdd = Math.floor(elapsed / (config.windowInSeconds * 1000)) * config.bucketSize
	if (tokensToAdd > 0) {
		rateLimitData.tokens = Math.min(rateLimitData.tokens + tokensToAdd, config.bucketSize)
		rateLimitData.lastRefill = now
	}

	if (rateLimitData.tokens > 0) {
		rateLimitData.tokens -= 1
		return true
	} else {
		throw error(429, 'Too many requests')
	}
}

const rateLimitStore = new Map<string, { tokens: number; lastRefill: number }>()
