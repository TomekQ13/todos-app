const express = require('express')
const app = express()
const path = require('path')
const methodOverride = require('method-override')

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, '/views'))
app.use(express.static(path.join(__dirname, '/public')))

app.use(express.urlencoded({ extended: false }))
app.use(methodOverride('_method'))

const todosRouter = require('./routes/todos')
app.use('/todos', todosRouter)


app.listen(3000, () => {
    console.log('Application started and listening on port 3000')
})

module.exports = app