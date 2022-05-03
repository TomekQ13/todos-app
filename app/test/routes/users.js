const chai = require('chai')
const { expect } = require('chai')
const chaiHttp = require('chai-http')
const bcrypt = require('bcrypt')

const app = require('../../app/app')
const client = require('../../app/db')

chai.use(chaiHttp)

TESTTING_USER = {
    username: 'testingUser',
    password: 'testingPassword',
    repeat_password: 'testingPassword'
}

describe('Testing user routes', () => {
    describe('Get register route', () => {
        it('Correct return code', (done) => {
            chai.request(app)
            .get('/user/register')
            .end((_err, res) => {
                expect(res).to.have.status(200)
                done()
            })
        })
    })

    describe('POST register', () => {
        function makeRegisterCall(sendData, endFunction) {
            chai.request(app)
            .post('/user/register')
            .type('form')
            .send(sendData)
            .redirects(0)
            .end((_err, res) => {
                endFunction(_err, res)
            })
        }
        before(async () => {
            await client.query(`
                delete from users
                where username = $1
            `, [TESTTING_USER.username])
        })

        it('Correct redirection on user creation', (done) => {
            makeRegisterCall(TESTTING_USER, (_err, res) => {
                expect(res.redirect).to.equal(true)
                expect(res.header.location).to.equal('/user/login')
                done()
            })
        })

        it('Created user is equal to the testing user', async () => {
            const resp = await client.query(`
                select password
                from users
                where username = $1
            `, [TESTTING_USER.username])
            hashedPassword = resp.rows[0].password
            expect(await bcrypt.compare(TESTTING_USER.password, hashedPassword)).to.equal(true)
        })

        it('Correct error message on too short password', (done) => {
            makeRegisterCall({
                username: TESTTING_USER.username,
                password: 'a',
                repeat_password: 'a'
            }, (_err, res) => {
                expect(res.redirect).to.equal(false)
                expect(res.text.includes('Password must be at least')).to.equal(true)
                done()
            })
        })

        it('Correct error message on different password', (done) => {
            makeRegisterCall({
                username: TESTTING_USER.username,
                password: 'correctLengthDifferentPassword',
                repeat_password: 'correctLengthPassword'
            }, (_err, res) => {
                expect(res.redirect).to.equal(false)
                expect(res.text.includes('Passwords must be equal')).to.equal(true)
                done()
            })
        })

        it('Correct error message on too short username', (done) => {
            makeRegisterCall({
                username: 'a',
                password: TESTTING_USER.password,
                repeat_password: TESTTING_USER.repeat_password
            }, (_err, res) => {
                expect(res.redirect).to.equal(false)
                expect(res.text.includes('Username must be at least')).to.equal(true)
                done()
            })
        })

        it('Correct error message for a user that already exists', (done) => {
            makeRegisterCall(TESTTING_USER, (_err, res) => {
                expect(res.redirect).to.equal(false)
                expect(res.text.includes('User with this username already exists')).to.equal(true)
                done()
            })
        })
    })

    describe('GET login', () => {
        it('Correct status code', (done) => {
            chai.request(app)
            .get('/user/login')
            .end((_err, res) => {
                expect(res).to.have.status(200)
                done()
            })
        })
    })

    describe('POST login', () => {
        function makeLoginCall(sendData, endFunction) {
            chai.request(app)
            .post('/user/login')
            .type('form')
            .send(sendData)
            .redirects(0)
            .end((_err, res) => {
                endFunction(_err, res)
            })
        }

        it('Correct login', (done) => {
            makeLoginCall({
                username: TESTTING_USER.username,
                password: TESTTING_USER.password
            }, (_err, res) => {
                expect(res.redirect).to.equal(true)
                expect(res.header.location).to.equal('/todos')
                done()
            })
        })

        it('Incorrect password', (done) => {
            makeLoginCall({
                username: TESTTING_USER.username,
                password: 'incorrectPassword'
            }, (_err, res) => {
                expect(res.redirect).to.equal(false)
                expect(res.text.includes('User with this username does not exist or the password is incorrect'))
                .to.equal(true)
                done()
            })
        })

        it('User does not exist', (done) => {
            makeLoginCall({
                username: 'a',
                password: 'incorrectPassword'
            }, (_err, res) => {
                expect(res.redirect).to.equal(false)
                expect(res.text.includes('User with this username does not exist or the password is incorrect'))
                .to.equal(true)
                done()
            })
        })
    })
})