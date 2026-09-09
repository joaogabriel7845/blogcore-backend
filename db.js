import 'dotenv/config'

import { Client } from 'pg'

const client = new Client({
    connectionString: process.env.DATABASE_URL
})

await client.connect()

export default client;