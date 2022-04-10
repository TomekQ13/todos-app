const chai = require('chai')
const { expect } = require('chai')
const chaiHttp = require('chai-http')

const { app, client } = require('../app/app')

chai.use(chaiHttp)

const TESTING_TODO = {
    todo: 'testing ToDo text'
}

describe('Testing app', () => {
    before(async () => {
        await client.query(`
            delete from todos
            where "text" = $1            
        `, [TESTING_TODO.todo])
    })


    describe('Test GET endpoint', () => {
        it('HTML with a correct response status', (done) => {
            chai.request(app)
            .get('/')
            .end((_err, res) => {
                expect(res).to.have.status(200)
                done()
            })
        })
    })

    describe('Test POST endpoint', () => {
        it('Correct redirection on ToDo creation', (done) => {
            chai.request(app)
            .post('/')
            .type('form')
            .send(TESTING_TODO)
            .redirects(0)
            .end((_err, res) => {
                expect(res.redirect).to.equal(true)
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
                .post(`/${testingToDoId}`)
                .query({_method: 'PUT'})
                .redirects(0)
                .end((_err, res) => {
                    expect(res.redirect).to.equal(true)
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
                .post(`/${testingToDoId}`)
                .query({_method: 'DELETE'})
                .redirects(0)
                .end((_err, res) => {
                    expect(res.redirect).to.equal(true)
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