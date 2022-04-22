const { expect } = require('chai')
const client = require('../app/db')
const { createSession, getSession } = require('../app/session')
const chai = require('chai')
const chaiHttp = require('chai-http')
const app = require('../app/app')

chai.use(chaiHttp)

let TESTING_VALID_TO_SECONDS = 1
let TESTING_VALID_TO = new Date()
TESTING_VALID_TO.setSeconds(
    TESTING_VALID_TO.getSeconds() + TESTING_VALID_TO_SECONDS
)

const  TESTING_SESSION = {
    sessionId: 'testSessionId',
    validTo:TESTING_VALID_TO
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
            await sleep(1500)
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


})