const { Client } = require('pg')

const client = new Client({
    user: process.env.POSTGRES_RW_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_RW_PASSWORD,
    port: process.env.POSTGRES_PORT
})

client.connect()
const res = client.query('select now()').then(
    res => console.log('Connected to the db ' + res.rows[0].now)
);

module.exports = client