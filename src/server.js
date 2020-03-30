const knex = require('knex')
const app = require('./app')

const { PORT, DATABASE_URL, NODE_ENV: environment } = require('./config')

const db = knex({
    client: 'pg',
    connection: DATABASE_URL,
})

const options = { environment }
const app = App(options)

app.set('db', db)

app.listen(PORT, () => {
    console.log(`Server listening at http://localhost:${PORT}`)
})