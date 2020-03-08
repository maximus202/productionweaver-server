const path = require('path')
const express = require('express')
const xss = require('xss')
const ProductionsService = require('./productions-service')

const productionsRouter = express.Router()
const jsonParser = express.json()

productionsRouter
    .route('/')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        ProductionsService.getAllProductions(knexInstance)
            .then(productions => {
                res.json(productions)
            })
            .catch(next)
    })

module.exports = productionsRouter