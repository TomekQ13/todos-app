const chai = require('chai')
const { expect } = require('chai')
const chaiHttp = require('chai-http')

const app = require('../../app/app')
const client = require('../../app/db')

chai.use(chaiHttp)

const TESTING_TODO = {
    todo: 'testing ToDo text'
}

TESTTING_USER = {
    username: 'testingUser',
    password: 'testingPassword',
    repeat_password: 'testingPassword'
}

describe('Testing app', () => {
    let COOKIE
    before(async () => {        
        await client.query(`
            delete from todos
            where "text" = $1            
        `, [TESTING_TODO.todo])

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


    describe('Test GET endpoint', () => {
        it('HTML with a correct response status', (done) => {
            chai.request(app)
            .get('/todos')
            .set('Cookie', COOKIE)
            .end((_err, res) => {
                expect(res).to.have.status(200)
                expect(res.redirect).to.equal(false)
                done()
            })
        })
    })

    describe('Test POST endpoint', () => {
        it('Correct redirection on ToDo creation', (done) => {
            chai.request(app)
            .post('/todos')
            .type('form')
            .send(TESTING_TODO)
            .redirects(0)
            .set('Cookie', COOKIE)
            .end((_err, res) => {
                expect(res.redirect).to.equal(true)
                expect(res.header.location).to.equal('/todos')
                done()
            })
        })
    })

    describe('Testing ToDO modifications', () => {
        let testingToDoId
        before(async () => {
            const resp = await client.query(`
                select id
                from todos
                where "text" = $1            
            `, [TESTING_TODO.todo])
            testingToDoId = resp.rows[0].id
        })

    
        describe('Test PUT endpoint', () => {
            it('Correct redirection on ToDo update', (done) => {
                chai.request(app)
                .post(`/todos/${testingToDoId}`)
                .query({_method: 'PUT'})
                .redirects(0)
                .set('Cookie', COOKIE)
                .end((_err, res) => {
                    expect(res.redirect).to.equal(true)
                    expect(res.header.location).to.equal('/todos')
                    done()
                })
            })

            it('ToDo was set to done', async () => {
                const resp = await client.query(`
                    select done
                    from todos
                    where "text" = $1
                `, [TESTING_TODO.todo])
                const status = resp.rows[0].done
                expect(status).to.equal(true)
            })
        })

        describe('Test Delete endpoint', () => {
            it('Correct redirection on ToDo update', (done) => {
                chai.request(app)
                .post(`/todos/${testingToDoId}`)
                .query({_method: 'DELETE'})
                .redirects(0)
                .set('Cookie', COOKIE)
                .end((_err, res) => {
                    expect(res.redirect).to.equal(true)
                    expect(res.header.location).to.equal('/todos')
                    done()
                })
            })

            it('ToDo was deleted', async () => {
                const resp = await client.query(`
                    select id
                    from todos
                    where "text" = $1
                `, [TESTING_TODO.todo])
                const status = resp.rows.length
                expect(status).to.equal(0)
            })
        })
    })
})