const express = require('express')
const client = require('../db')
const router = express.Router()
const bcrypt = require('bcrypt')
const { v4: uuidv4 } = require('uuid')
const { authenticateSession } = require('../session')

router.get('/register', (req, res) => {
    return res.render('register', { formErrors: {} })
})

router.post('/register', async (req, res) => {
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


router.get('/login', (req, res) => {
    return res.render('login', { formErrors: {} })
})

router.post('/login', async (req, res) => {
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

    const generalError = `
    User with this username does not exist or the password is incorrect
    `

    if (resp.rowCount === 0) {
        formErrors.generalError = generalError
        return res.render('login', {formErrors: formErrors})
    }

    const existingUser = resp.rows[0]
    const compare = await bcrypt.compare(req.body.password, existingUser.password)
    if (!compare) {
        formErrors.generalError = generalError
        return res.render('login', {formErrors: formErrors})
    }
    
    await authenticateSession.call(req, existingUser.id)
    return res.redirect('/todos')
})

module.exports = router