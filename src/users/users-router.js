const path = require('path')
const express = require('express')
const xss = require('xss')
const UsersService = require('../users/users-service')

const usersRouter = express.Router()
const jsonParser = express.json()

usersRouter
    .route('/')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        UsersService.getAllUsers(knexInstance)
            .then(users => {
                res.json(users)
            })
            .catch(next)
    })

module.exports = usersRouter