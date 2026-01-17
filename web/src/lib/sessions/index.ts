import { ClientResponseError, type RecordModel } from 'pocketbase'
import { error } from '@sveltejs/kit'
import { db } from '../db'

export const sessionStore = {
	getOrThrow: async (token: string) => {
		const session = await db
			.collection<
				{
					status: 'connected' | 'disconnected' | null
					model: string | null
					targetChatId: string | null
				} & RecordModel
			>('sessions')
			.getOne(token)
			.catch((e) => {
				if (e instanceof ClientResponseError) {
					if (e.status === 404) return null

					console.error(e)
					throw e
				}
			})

		if (!session) throw error(401, 'Invalid session token')
		return session
	},
}
