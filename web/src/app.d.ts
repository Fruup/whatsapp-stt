// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Locals {
			session?: import('pocketbase').RecordModel & {
				status: 'connected' | 'disconnected' | null
				model: string | null
				targetChatId: string | null
			}
		}

		// interface Error {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {}
