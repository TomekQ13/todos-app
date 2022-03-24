const express = require('express')
const app = express()
app.set('view engine', 'ejs')

const { Client } = require('pg')
const client = new Client({
    user: process.env.POSTGRES_RW_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DATABASE,
    password: process.env.POSTGRES_RW_PASSWORD,
    port: process.env.POSTGRES_PORT
})

client.connect()
const res = client.query('select now()').then(
    res => console.log('Connected to the db ' + res.rows[0].now)
);

app.get('/', async (req, res) => {
    let resp
    try {
        resp = await client.query('select id, "text", done from todos')
    } catch (e) {
        console.error(e)
    }
    
    return res.render('index', { todos: resp.rows })
})

app.listen(3000, () => {
    console.log('Application started and listening on port 3000')
})
