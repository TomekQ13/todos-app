const express = require('express')
const client = require('../db')
const router = express.Router()
const { v4: uuidv4 } = require('uuid')
const bcrypt = require('bcrypt')

router.get('/register', (req, res) => {
    return res.render('register', { formErrors: {} })
})

router.post('/register', async (req, res) => {
    let formErrors = {}
    if (req.body.username.trim().length < process.env.minUsernameLength) {
        formErrors.username = [`
        Password must be at least ${process.env.minUsernameLength} characters long.
        `]
    }

    if (req.body.password.length < process.env.minPasswordLength) {
        formErrors.password = [`
        Password must be at least ${process.env.minPasswordLength} characters long.
        `]
    }

    if (req.body.repeat_password !== req.body.password) {
        formErrors.repeatPassword = [`
        Passwords do not match.
        `]
    }

    let respUser
    try {
        respUser = await client.query(`
        select id
        from users
        where username = $1
    `, [req.body.username.trim()])
    } catch (e) {
        console.error(e)
        return res.redirect('/register')
    }

    if (respUser.rowCount > 0) {
        if (formErrors.username) {
            formErrors.username.push(`
                User with this username already exists
            `)
        } else {
            formErrors.username = [`
            User with this username already exists
            `]
        }
    }

    if (
        formErrors.password        
        || formErrors.username
        || formErrors.repeatPassword
    ) {
        return res.render('register', { formErrors: formErrors })
    }

    // form is validated here
    let resp
    const userId = uuidv4()
    const hashedPassword = await bcrypt.hash(req.body.password, 10)
    try {
        resp = await client.query(`
            insert into users (id, username, password)
            values ($1, $2, $3)
        `, [userId, req.body.username.trim(), hashedPassword])
    } catch (e) {
        console.error(e)
        return res.redirect('/register')
    }
    return res.redirect('/user/login')

})


router.get('/login', (req, res) => {
    return res.render('login')
})

router.post('/login', (req, res) => {
    return
})

module.exports = router