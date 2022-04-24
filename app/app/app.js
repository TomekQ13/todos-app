require('dotenv').config()

const express = require('express')
const app = express()
const path = require('path')
const methodOverride = require('method-override')
const { session } = require('./session')
const cookieParser = require('cookie-parser')
const expressLayouts = require('express-ejs-layouts')

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, '/views'))
app.use(express.static(path.join(__dirname, '/public')))
app.set('layout', 'layout')
app.use(expressLayouts)

app.use(express.urlencoded({ extended: false }))
app.use(methodOverride('_method'))
app.use(cookieParser(process.env.SECRET))
app.use(session())

const todosRouter = require('./routes/todos')
app.use('/todos', todosRouter)
const userRouter = require('./routes/users')
app.use('/user', userRouter)

app.get('/', (req, res) => {
    res.redirect('/todos')
})

app.listen(80, () => {
    console.log('Application started and listening on port 80')
})

module.exports = app