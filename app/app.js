const express = require('express')
const app = express()
const { v4: uuidv4 } = require('uuid')
const methodOverride = require('method-override')

app.set('view engine', 'ejs')
app.use(express.urlencoded({ extended: false }))
app.use(methodOverride('_method'))

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
    const todosToDo = resp.rows.filter(todo => todo.done === false)
    const todosDone = resp.rows.filter(todo => todo.done === true)
    
    return res.render('index', { todosToDo: todosToDo, todosDone: todosDone })
})

app.post('/', async (req, res) => {
    let respone
    try {
        respone = await client.query(`
            insert into todos (id, text)
            values ($1, $2)
            `, [uuidv4(), req.body.todo])
    } catch (e) {
        console.error(e)
    }
    return res.redirect('/')
})

app.put('/:todoid', async (req, res) => {
    let resp
    try {
        resp = await client.query(`
            update todos
            set done = true
            where id = $1
        `, [req.params.todoid])
    } catch (e) {
        console.error(e)
    }
    return res.redirect ('/')
})

app.delete('/:todoid', async (req, res) => {
    let resp
    try {
        resp = await client.query(`
            delete from todos
            where id = $1
        `, [req.params.todoid])
    } catch (e) {
        console.error(e)
    }
    return res.redirect ('/')
})


app.listen(3000, () => {
    console.log('Application started and listening on port 3000')
})
