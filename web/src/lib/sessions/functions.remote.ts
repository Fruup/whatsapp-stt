import { command, query } from '$app/server'
import * as v from 'valibot'
import { sessionStore } from '.'
import { rateLimit } from '../server/rateLimit'
import { botStore } from '../bot'
import { error } from '@sveltejs/kit'
import { db } from '$lib/db'

export const checkSession = query(
	v.object({
		sessionToken: v.string(),
	}),
	async ({ sessionToken }) => {
		await sessionStore.getOrThrow(sessionToken)
	},
)

export const getSession = query(
	v.object({
		sessionToken: v.string(),
	}),
	async ({ sessionToken }) => {
		// await rateLimit({
		// 	key: 'getChatOptions',
		// 	windowInSeconds: 60,
		// 	bucketSize: 5,
		// })

		const session = await sessionStore.getOrThrow(sessionToken)

		const bot = await botStore.getOrStartBot(sessionToken)

		if (!bot) throw error(400, 'Bot not found for this session')
		if (bot.status !== 'connected') throw error(400, 'Bot not connected')

		const chatOptions = (await bot.getChats()).map((chat) => ({
			id: chat.id._serialized,
			name: chat.name,
		}))

		return {
			chatOptions,
			...session,
		}
	},
)

export const updateSession = command(
	v.object({
		sessionToken: v.string(),
		data: v.object({
			active: v.optional(v.boolean()),
			targetChatId: v.optional(v.nullable(v.string())),
			allowAudioMessages: v.optional(v.boolean()),
		}),
	}),
	async ({ sessionToken, data }) => {
		await rateLimit('updateSession', [
			{
				windowInSeconds: 1,
				bucketSize: 1,
			},
			{
				windowInSeconds: 60,
				bucketSize: 30,
			},
		])

		await sessionStore.getOrThrow(sessionToken)

		await db.collection('sessions').update(sessionToken, data)
	},
)

export const createTranscriptionChat = command(
	v.object({
		sessionToken: v.string(),
	}),
	async ({ sessionToken }) => {
		// await rateLimit({
		// 	key: 'createTranscriptionChat',
		// 	windowInSeconds: 1,
		// 	bucketSize: 1,
		// })

		const bot = botStore.getBot(sessionToken)
		if (!bot) throw error(400, 'Bot not found for this session')
		if (bot.status !== 'connected') throw error(400, 'Bot not connected')

		const chatId = await bot.createTranscriptionChat()
		await updateSession({ sessionToken, data: { targetChatId: chatId } })
	},
)
