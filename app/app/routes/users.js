const express = require('express')
const router = express.Router()

router.get('/register', (req, res) => {
    return res.render('register', { formErrors: {} })
})

router.post('/register', async (req, res) => {
    return
})


router.get('/login', (req, res) => {
    return res.render('regsister')
})

router.post('/login', (req, res) => {
    return
})

module.exports = router