function requireAuth(req, res, next) {
    const authToken = req.get('Authorization') || ''

    let basicToken
    if (!authToken.toLowerCase().startsWith('basic')) {
        return res.status(401).json({ error: { message: 'missing basic token' } })
    } else {
        basicToken = authToken.slice('basic '.length, authToken.length)
    }

    const [tokenEmail, tokenPassword] = Buffer
        .from(basicToken, 'base64')
        .toString()
        .split(':')

    if (!tokenEmail || !tokenPassword) {
        return res.status(401).json({ error: { message: 'unauthorized request' } })
    }

    next()
}

module.exports = {
    requireAuth,
}