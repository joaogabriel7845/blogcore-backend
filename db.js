import 'dotenv/config'

import { Pool } from 'pg'

const client = new Pool({
    connectionString: process.env.DATABASE_URL
})

await client.connect()

export default client;