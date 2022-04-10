const express = require('express')
const router = express.Router()
const client = require('../db')
const { v4: uuidv4 } = require('uuid')

router.get('/', async (req, res) => {
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

router.post('/', async (req, res) => {
    let respone
    try {
        respone = await client.query(`
            insert into todos (id, text)
            values ($1, $2)
            `, [uuidv4(), req.body.todo])
    } catch (e) {
        console.error(e)
    }
    return res.redirect('/todos')
})

router.put('/:todoid', async (req, res) => {
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
    return res.redirect ('/todos')
})

router.delete('/:todoid', async (req, res) => {
    let resp
    try {
        resp = await client.query(`
            delete from todos
            where id = $1
        `, [req.params.todoid])
    } catch (e) {
        console.error(e)
    }
    return res.redirect ('/todos')
})

module.exports = router