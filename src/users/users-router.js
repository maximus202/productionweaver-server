const path = require('path')
const express = require('express')
const xss = require('xss')
const UsersService = require('../users/users-service')

const usersRouter = express.Router()
const jsonParser = express.json()

const serializeUser = user => ({
    id: user.id,
    first_name: xss(user.first_name),
    last_name: xss(user.last_name),
    email: xss(user.email),
    password: xss(user.password),
    date_created: user.date_created
})

usersRouter
    .route('/')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        UsersService.getAllUsers(knexInstance)
            .then(users => {
                res.json(users.map(serializeUser))
            })
            .catch(next)
    })
    .post(jsonParser, (req, res, next) => {
        const { first_name, last_name, email, password } = req.body
        const newUser = { first_name, last_name, email, password }
        console.log(newUser)

        for (const [key, value] of Object.entries(newUser)) {
            if (value == null) {
                return res.status(400).json({
                    error: {
                        message: `${key} missing in request body`
                    }
                })
            }
        }

        const knexInstance = req.app.get('db')
        UsersService.insertNewUser(knexInstance, newUser)
            .then(user => {
                res
                    .status(201)
                    .location(path.posix.join(req.originalUrl, `/${user.id}`))
                    .json(serializeUser(user))
            })
            .catch(next)
    })

usersRouter
    .route('/:user_id')
    .all((req, res, next) => {
        const knexInstance = req.app.get('db')
        UsersService.getById(knexInstance, req.params.user_id)
            .then(user => {
                if (!user) {
                    return res.status(404).json({
                        error: {
                            message: `User not found.`
                        }
                    })
                }
                res.user = user
                next()
            })
            .catch(next)
    })
    .get((req, res, next) => {
        res.json(serializeUser(res.user))
    })

module.exports = usersRouter