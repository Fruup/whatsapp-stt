import { db } from '$lib/db'
import { sessionStore } from '$lib/sessions'
import { WhatsAppSTTBot } from '@whatsapp-stt/bot'
import QRCode from 'qrcode'

const bots = new Map<string, WhatsAppSTTBot>()

export const botStore = {
	async initialize() {
		const sessions = await db.collection('sessions').getFullList()

		await Promise.all(
			sessions.map(async (session) => {
				const sessionToken = session.id

				if (bots.has(sessionToken)) return

				// TODO: Now that I think of it, maybe starting a bot for each session consumes too much memory :/
				await this.startBot(sessionToken)
			}),
		)
	},
	getBot(sessionToken: string): WhatsAppSTTBot | null {
		return bots.get(sessionToken) || null
	},
	async startBot(sessionToken: string) {
		if (bots.has(sessionToken)) {
			throw new Error('Bot already started for this session')
		}

		const bot = new WhatsAppSTTBot({
			clientId: sessionToken,
			async onQrCode(qr) {
				console.log('QR Code for session', sessionToken, qr)

				console.log(await QRCode.toString(qr, { type: 'terminal', small: true }))
			},
			async getConfig() {
				const session = await sessionStore.getOrThrow(sessionToken)

				if (!session.targetChatId) throw new Error('Target chat ID not set in session')

				return {
					targetChatId: session.targetChatId,
					allowAudioMessages: true, // TODO: Make configurable
					model: 'Systran/faster-whisper-medium', // TODO: Make configurable
				}
			},
		})

		bots.set(sessionToken, bot)

		await bot.initializeAndAuthenticate()

		return bot
	},
	async getOrStartBot(sessionToken: string) {
		const bot = bots.get(sessionToken)
		if (bot) return bot

		return await this.startBot(sessionToken)
	},
}
