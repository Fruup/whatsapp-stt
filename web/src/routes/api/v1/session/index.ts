import { source, type Emitter } from 'sveltekit-sse'
import type { RouteId } from './$types'
import type { Session } from '$lib/sessions'

export interface SessionMessageMap {
	qrCode: {
		value: string
	}
	successfullyAuthenticated: {}
	updatedSession: Session
}

export const createSessionMessageEmitter = (_emit: Emitter) => {
	return {
		emit<TType extends keyof SessionMessageMap>(type: TType, payload: SessionMessageMap[TType]) {
			console.log('Emitting session message', { type, payload })

			const { error } = _emit(type, JSON.stringify(payload))

			if (error) {
				console.error('Error emitting session message', { type, payload, error })
			}
		},
	}
}

export const createSessionMessageReceiver = (
	sessionToken: string,
	dispatch: {
		[TType in keyof SessionMessageMap]?: (payload: SessionMessageMap[TType]) => void
	},
) => {
	const _source = source('/api/v1/session' satisfies RouteId, {
		options: {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				sessionToken,
			}),
		},
	})

	const cleanupFns = Object.keys(dispatch).map((type) =>
		_source
			.select(type)
			.json(() => _errorSymbol)
			.subscribe((payload) => {
				if (payload === _errorSymbol) return

				console.log('Received session message', { type, payload })

				// @ts-expect-error
				dispatch[type]?.(payload)
			}),
	)

	return () => {
		cleanupFns.forEach((fn) => fn())
		_source.close()
	}
}

const _errorSymbol = Symbol('error')
