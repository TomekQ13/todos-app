const client = require("./db")
const { v4: uuidv4 } = require('uuid')
require('dotenv').config()

async function createSession(sessionId, validTo) {
    let resp
    try {
        resp = await client.query(`
            insert into sessions (id, valid_to)
            values ($1, $2)
        `, [sessionId, validTo])
    } catch (e) {
        console.error(e)
    }
    return resp
}

async function getSession(sessionId) {
    let session
    try {
        session = await client.query(`
            select id, valid_to, user_id
            from sessions
            where
                id = $1
                and valid_to >= now()
        `, [sessionId])
    } catch (e) {
        console.error(e)
        return undefined
    }
    if (session.rowCount === 1) return session.rows[0]
    return undefined
}

async function issueSessionId() {
    const sessionId = uuidv4()
    let currentTime = new Date()
    const cookieAge = process.env.COOKIE_AGE_IN_SECONDS || 600
    currentTime.setSeconds(currentTime.getSeconds() + cookieAge)

    try {
        await createSession(sessionId, currentTime)
    } catch (e) {
        console.error(e)
    }
    this.cookie('sessionId', sessionId, {
        maxAge: 1000* cookieAge,
        httpOnly: true,
        signed: true
    })
    return {
        id: sessionId,
        valid_to: currentTime
    }
}

function session() {
    return async (req, res, next) => {
        req.session = {}
        const session = await getSession(req.signedCookies['sessionId'])

        if (session === undefined || req.signedCookies['sessionId'] === undefined) {
            try {
                const newSession = await issueSessionId.call(res)
                req.session = newSession
            } catch (e) {
                console.error(e)
            }
            return next()            
        }
        req.session = session
        next()
    }
}

async function authenticateSession(userId) {
    if (!this.session) {
        return console.error('Session is required for session authentication')
    }

    try {
        await client.query(`
            update sessions
            set user_id = $1
            where id = $2
        `, [userId, this.session.id])
    } catch (e) {
        console.error(e)
    }
    this.session.user_id = userId
}

module.exports = {
    createSession,
    getSession,
    issueSessionId,
    session,
    authenticateSession
}