const { expect } = require('chai')
const client = require('../app/db')
const { createSession, getSession } = require('../app/session')
const chai = require('chai')
const chaiHttp = require('chai-http')
const app = require('../app/app')

chai.use(chaiHttp)

let TESTING_VALID_TO_SECONDS = 1.2
let TESTING_VALID_TO = new Date()
TESTING_VALID_TO.setSeconds(
    TESTING_VALID_TO.getSeconds() + TESTING_VALID_TO_SECONDS
)

const  TESTING_SESSION = {
    sessionId: 'testSessionId',
    validTo:TESTING_VALID_TO
}

TESTING_USER = {
    username: 'testingUser',
    password: 'testingPassword',
    repeat_password: 'testingPassword'
}

describe('Testing session', () => {
    function sleep(ms) {
        return new Promise((res) => {
            setTimeout(res, ms)
        })
    }

    describe('Create a session', () => {
        before(async () => {
            await client.query(`
                delete from sessions
                where id = $1
            `, [TESTING_SESSION.sessionId])
        })
        it('Correct return information', async () => {
            const resp = await createSession(
                TESTING_SESSION.sessionId,
                TESTING_SESSION.validTo
            )
            expect(resp.rowCount).to.equal(1)
        })
    })

    describe('Get the session', () => {
        it('Fetched session is equal to testing session', async () => {
            const resp = await getSession(TESTING_SESSION.sessionId)
            expect(resp.id).to.equal(TESTING_SESSION.sessionId)
            expect(resp.valid_to).to.deep.equal(TESTING_SESSION.validTo)
        })
    })

    describe('Get session that is not valid anymore', () => {
        before(async () => {
            await sleep(1700)
        })

        it('Return undefined', async () => {
            const resp = await getSession(TESTING_SESSION.sessionId)
            expect(resp).to.equal(undefined)
        })
    })

    describe('Get not existing session', () => {
        it('Return undefined', async () => {
            const resp = await getSession(TESTING_SESSION.sessionId)
            expect(resp).to.equal(undefined)
        })
    })

    let firstSessionId
    let startIndex
    let endIndex

    describe('Testing session middleware', () => {
        it('Session is assigned', (done) => {
            chai.request(app)
            .get('/todos')
            .end((_err,res) => {
                const cookie = res.headers['set-cookie'][0]
                expect(
                    cookie.includes('sessionId')
                ).to.equal(true)
                startIndex = cookie.search('=') - 1
                endIndex = cookie.search(';')
                firstSessionId = cookie.slice(startIndex, endIndex)
                done()
            })
        })
    })

    describe('Testing for a different sessionId', () => {
        before(async () => {
            await sleep(1500)
        })

        it('A different session id is assigned', (done) => {
            chai.request(app)
            .get('/todos')
            .end((_err,res) => {
                expect(
                    res.headers['set-cookie'][0].slice(startIndex, endIndex)
                ).to.not.equal(firstSessionId)
                done()
            })
        })
    })

    describe('Testing session authentication', () => {
        let LAST_SESSION_ID
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
                    const cookie = res.header['set-cookie'][0]
                    LAST_SESSION_ID = cookie.slice(14,50)
                    resolve()
                })
            })
        })

        it('Check if the session for the user was authenticated' , async () => {
            const resp = await client.query(`
                select users.username
                from sessions
                inner join users
                on sessions.user_id = users.id
                where sessions.id = $1
            `, [LAST_SESSION_ID])
            const session = resp.rows[0]
            expect(session.username).to.equal(TESTING_USER.username)
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