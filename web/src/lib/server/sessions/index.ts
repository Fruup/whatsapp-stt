import { error } from '@sveltejs/kit'

export const checkSession = (token: string) => {
	if (sessionStore.has(token)) return true

	throw error(401, 'Invalid session token')
}

const sessionStore = new Map<
	string,
	{
		settings: {}
	}
>()
