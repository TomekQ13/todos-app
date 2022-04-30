function checkAuthenticated() {
    return (req, res, next) => {
        if (!req.session) {
            return console.error(`req.session is required before checking authentication`)
        }

        if (!req.session.user_id) {
            return res.redirect('/user/login')
        }
        next()
    }
}

function checkNotAuthenticated(redirectRoute) {
    return (req, res, next) => {
        if (!req.session) {
            return console.error(`req.session is required before checking authentication`)
        }
    }

    if (req.session.user_id) return res.redirect(redirectRoute)
    next()
}
module.exports = {
    checkAuthenticated,
    checkNotAuthenticated
}