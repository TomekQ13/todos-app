const { expect } = require('chai')
const client = require('../app/db')
const { createSession, getSession } = require('../app/session')
const chai = require('chai')
const chaiHttp = require('chai-http')
const app = require('../app/app')
const { checkAuthenticated, checkNotAuthenticated } = require('../app/auth')

chai.use(chaiHttp)

TESTING_USER = {
    username: 'testingUser',
    password: 'testingPassword',
    repeat_password: 'testingPassword'
}

app.get('/checkauthenticed', checkAuthenticated(), (req, res) => {
    return res.json({msg: 'Testing get route that does require authentication'})
})


app.get('/checknotauthenticed', checkNotAuthenticated('/todos'), (req, res) => {
    return res.json({msg: 'Testing get route that does not allow authentication'})
})

describe('Testing authentication functions', () => {
    describe('Testing checkAuthenticated',() => {
        it('Correct redirection on enforced authentication', (done) => {
            chai.request(app)
            .get('/checkauthenticed')
            .redirects(0)
            .end((_err, res) => {
                expect(res.redirect).to.equal(true)
                expect(res.header.location).to.equal('/user/login')
                done()
            })
        })
    })

    describe('Testing checkNotAuthenticated', () => {
        let COOKIE
        before(async () => {
            await client.query(`
                delete from users
                where username = $1
            `, [TESTING_USER.username])
        
            await new Promise((resolve) => {
                chai.request(app)
                .post('/user/register')
                .type('form')
                .send(TESTING_USER)
                .end(() => {
                    resolve()
                })
            })

            return new Promise((resolve) => {
                chai.request(app)
                .post('/user/login')
                .type('form')
                .send({
                    username: TESTING_USER.username,
                    password: TESTING_USER.password
                })
                .redirects(0)
                .end((_err, res) => {
                    COOKIE = res.header['set-cookie'][0]
                    resolve()
                })
            })
        })

        it('Correct redirection on an authenticated request', (done) => {
            chai.request(app)
            .get('/checknotauthenticed')
            .set('Cookie', COOKIE)
            .redirects(0)
            .end((_err, res) => {
                expect(res.redirect).to.equal(true)
                expect(res.header.location).to.equal('/todos')
                done()
            })
        })

        after(async () => {
            await client.query(`
                delete from sessions
                where user_id in (
                    select id
                    from users
                    where username = $1
                )
            `, [TESTING_USER.username])

            return await client.query(`
                    delete from users
                    where username = $1
            `, [TESTING_USER.username])
        })
    })
})