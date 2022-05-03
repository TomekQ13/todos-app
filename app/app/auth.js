function checkAuthenticated() {
    return (req, res, next) => {
        if (!req.session) {
            console.error('req.session id required before checking authentication')
            return res.redirect('/user/login')
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
            console.error('req.session id required before checking authentication')
            return res.redirect('/user/login')
        }

        if (req.session.user_id) {
            return res.redirect(redirectRoute)
        }
        next()
    }
}

module.exports = {
    checkAuthenticated,
    checkNotAuthenticated
}