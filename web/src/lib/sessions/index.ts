import { ClientResponseError, type RecordModel } from 'pocketbase'
import { error } from '@sveltejs/kit'
import { db } from '../db'
import { getRequestEvent } from '$app/server'

export const sessionStore = {
	getOrThrow: async (token: string): Promise<Session> => {
		const { locals } = getRequestEvent()

		if (locals.session && locals.session.id === token) return locals.session

		const session = await db
			.collection<Session>('sessions')
			.getOne(token)
			.catch((e) => {
				if (e instanceof ClientResponseError) {
					if (e.status === 404) return null

					console.error(e)
					throw e
				}
			})

		if (!session) throw error(401, 'Invalid session token')

		// Store session for further use
		locals.session = session

		return session
	},
}

export interface Session extends RecordModel {
	active: boolean
	status: 'connected' | 'disconnected' | null
	model: string | null
	targetChatId: string | null
}
