const express = require('express')
const client = require('../db')
const router = express.Router()
const bcrypt = require('bcrypt')
const { v4: uuidv4 } = require('uuid')
const { authenticateSession } = require('../session')
const { checkAuthenticated, checkNotAuthenticated } = require('../auth')

router.get('/register', checkNotAuthenticated('/todos'), (req, res) => {
    return res.render('register', { formErrors: {} })
})

router.post('/register', checkNotAuthenticated('/todos'), async (req, res) => {
    let formErrors = {}
    if (req.body.password.length < process.env.minPasswordLength) {
        formErrors.password = `Password must be at least ${process.env.minPasswordLength} characters long.`
    }
    if (req.body.username.trim().length < process.env.minUsernameLength) {
        formErrors.username = `Username must be at least ${process.env.minUsernameLength} characters long.`
    }
    if (req.body.repeat_password != req.body.password) {
        formErrors.repeatPassword = `Passwords must be equal.`
    }

    const respUser = await client.query(`
        select id
        from users
        where username = $1
    `, [req.body.username.trim()])
    if (respUser.rowCount > 0) {
        formErrors.username = `User with this username already exists.`
    }

    if (Object.keys(formErrors).length > 0) {
        return res.render('register', { formErrors: formErrors })
    }

    // form is validated here
    let resp
    const hashedPassword = await bcrypt.hash(req.body.password, 10)
    const userId = uuidv4()
    try {
        resp = client.query(`
            insert into users (id, username, password)
            values ($1, $2, $3)
        `, [userId, req.body.username.trim(), hashedPassword])
    } catch (e) {
        console.error(e)
        return res.redirect('/user/register')
    }

    return res.redirect('/user/login')
})


router.get('/login', checkNotAuthenticated('/todos'), (req, res) => {
    return res.render('login', { formErrors: {} })
})

router.post('/login', checkNotAuthenticated('/todos'), async (req, res) => {
    let formErrors = {}
    let resp
    try {
        resp = await client.query(`
            select id, password
            from users
            where username = $1
        `, [req.body.username.trim()])
    } catch (e) {
        console.error(e)
        return res.redirect('/user/login')
    }

    const generalErrorMsg = `
    User with this username does not exist or the password is incorrect
    `

    if (resp.rowCount === 0) {
        formErrors.generalError = generalErrorMsg
        return res.render('login', { formErrors: formErrors })
    }

    const existingUser = resp.rows[0]
    const compare = await bcrypt.compare(req.body.password, existingUser.password)
    if (!compare) {
        formErrors.generalError = generalErrorMsg
        return res.render('login', { formErrors: formErrors })
    }

    const updateResp = await authenticateSession.call(req, existingUser.id)
    if (updateResp.rowCount === 0) {
        console.error('Session not found for session authentication')
        return res.redirect('/user/login')        
    }
    return res.redirect('/todos')
})

router.delete('/logout', checkAuthenticated(), async (req, res) => {
    try {
        await client.query(`
            update sessions
            set valid_to = now() - interval '5 second'
            where id = $1 and user_id = $2
        `, [req.session.id, req.session.user_id])
    } catch (e) {
        console.error(e)
        res.redirect('/todos')
    }
    res.redirect('/user/login')
})

module.exports = router