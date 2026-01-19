import { checkSession } from '$lib/sessions/functions.remote'

export const load = async ({ params }) => {
	// We have to check the session here as the SSE endpoint seemingly does not expose HTTP errors.
	await checkSession({ sessionToken: params.sessionToken })
}
