require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const helmet = require('helmet')
const usersRouter = require('./users/users-router')
const productionsRouter = require('./productions/productions-router')
const scenesRouter = require('./scenes/scenes-router')
const elementsRouter = require('./elements/elements-router')
const authRouter = require('./auth/auth-router')

const app = (options = {}) => {
    const { environment = 'development' } = options
    const app = express()

    const morganOption = (environment === 'production')
        ? 'tiny'
        : 'common';

    app.use(morgan(morganOption))
    app.use(helmet())
    app.use(cors())

    app.use('/api/users', usersRouter)
    app.use('/api/productions', productionsRouter)
    app.use('/api/scenes', scenesRouter)
    app.use('/api/elements', elementsRouter)
    app.use('/api/auth', authRouter)

    app.use(function errorHandler(error, req, res, next) {
        let response
        if (environment === 'production') {
            response = { error: { message: 'server error' } }
        } else {
            console.error(error)
            response = { message: error.message, error }
        }
        res.status(500).json(response)
    })
}

module.exports = app