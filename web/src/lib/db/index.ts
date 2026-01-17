import PocketBase from 'pocketbase'

export const db = new PocketBase('http://localhost:8080')
// export const db = new PocketBase('http://db:8080')

db.autoCancellation(false)

await db.collection('_superusers').authWithPassword('info@leonscherer.com', '1234567890')
