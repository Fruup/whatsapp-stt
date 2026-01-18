// See https://svelte.dev/docs/kit/types#app.d.ts

import type { Session } from '$lib/sessions'

// for information about these interfaces
declare global {
	namespace App {
		interface Locals {
			session?: Session
		}

		// interface Error {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {}
