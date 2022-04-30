const express = require('express')
const router = express.Router()
const client = require('../db')
const { v4: uuidv4 } = require('uuid')
const { checkAuthenticated } = require('../auth')

router.get('/', checkAuthenticated(), async (req, res) => {
    let resp
    try {
        resp = await client.query(`
            select
                id, "text", done
            from todos
            where user_id = $1
            `, [req.session.user_id])
    } catch (e) {
        console.error(e)
    }
    const todosToDo = resp.rows.filter(todo => todo.done === false)
    const todosDone = resp.rows.filter(todo => todo.done === true)
    
    return res.render('index', { todosToDo: todosToDo, todosDone: todosDone })
})

router.post('/', checkAuthenticated(), async (req, res) => {
    let respone
    try {
        respone = await client.query(`
            insert into todos (id, user_id, text)
            values ($1, $2, $3)
            `, [uuidv4(), req.session.user_id, req.body.todo])
    } catch (e) {
        console.error(e)
    }
    return res.redirect('/todos')
})

router.put('/:todoid', checkAuthenticated(), async (req, res) => {
    let resp
    try {
        resp = await client.query(`
            update todos
            set done = true
            where id = $1 and user_id = $2
        `, [req.params.todoid, req.session.user_id])
    } catch (e) {
        console.error(e)
    }
    return res.redirect ('/todos')
})

router.delete('/:todoid', checkAuthenticated(),  async (req, res) => {
    let resp
    try {
        resp = await client.query(`
            delete from todos
            where id = $1 and user_id = $2
        `, [req.params.todoid, req.session.user_id])
    } catch (e) {
        console.error(e)
    }
    return res.redirect ('/todos')
})

module.exports = router