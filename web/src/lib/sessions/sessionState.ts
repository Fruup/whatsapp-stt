import { botStore } from '$lib/bot'
import type { WhatsAppSTTBot } from '@whatsapp-stt/bot'
import { sessionStore, type Session } from '.'

export class SessionState {
	static async create(sessionToken: string) {
		const session = await sessionStore.getOrThrow(sessionToken)
		const bot = botStore.getBot(sessionToken)

		return new SessionState(session, sessionToken, bot)
	}

	private constructor(
		public readonly session: Session,
		public readonly sessionToken: string,
		public bot: WhatsAppSTTBot | null,
	) {}
}
