import { EventSource as EventSource_ } from 'eventsource'
global.EventSource = EventSource_

import { SessionState } from '$lib/sessions/sessionState.js'
import { produce } from 'sveltekit-sse'
import * as v from 'valibot'
import { createSessionMessageEmitter } from './index.js'
import { WhatsAppSTTBot } from '@whatsapp-stt/bot'
import { sessionStore, type Session } from '$lib/sessions/index.js'
import { error } from '@sveltejs/kit'
import { botStore } from '$lib/bot/index.js'
import { db } from '$lib/db/index.js'

export const POST = async ({ request }) => {
	const { sessionToken } = v.parse(v.object({ sessionToken: v.string() }), await request.json())

	const sessionState = await SessionState.create(sessionToken)

	return produce(async ({ emit, lock }) => {
		const messenger = createSessionMessageEmitter(emit)

		if (!sessionState.bot) {
			sessionState.bot = new WhatsAppSTTBot({
				clientId: sessionToken,
				onParingCode({ qrCode }) {
					if (!qrCode) return

					messenger.emit('qrCode', {
						value: qrCode,
					})
				},
				// transcriptionApiBaseUrl: 'http://speeches:8000/v1',
				transcriptionApiBaseUrl: 'http://localhost:8000/v1',
				async getConfig() {
					const session = await sessionStore.getOrThrow(sessionToken)

					if (!session.targetChatId) throw new Error('Target chat ID not set in session')

					return {
						active: session.active,
						targetChatId: session.targetChatId,
						allowAudioMessages: session.allowAudioMessages ?? false,
						model: 'Systran/faster-whisper-medium', // TODO: Make configurable
					}
				},
				onDisconnected() {
					db.collection<Session>('sessions').update(sessionToken, {
						status: 'disconnected',
					})
				},
			})

			botStore.setBot(sessionToken, sessionState.bot)

			await sessionState.bot.initializeAndAuthenticate()
		}

		if (sessionState.bot.status !== 'connected') {
			throw error(400, 'Bot not connected')
		}

		messenger.emit('successfullyAuthenticated', {})

		messenger.emit('updatedSession', sessionState.session)
		const unsubscribe = await db
			.collection<Session>('sessions')
			.subscribe(sessionToken, ({ record }) => {
				messenger.emit('updatedSession', record)
			})

		return () => {
			console.log('Stopping session stream')

			unsubscribe()
		}
	})
}
