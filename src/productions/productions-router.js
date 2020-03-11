const path = require('path')
const express = require('express')
const xss = require('xss')
const ProductionsService = require('./productions-service')

const productionsRouter = express.Router()
const jsonParser = express.json()

const serializeProduction = production => ({
    id: production.id,
    production_title: xss(production.production_title),
    date_created: production.date_created,
    owner: production.owner
})

productionsRouter
    .route('/')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        ProductionsService.getAllProductions(knexInstance)
            .then(productions => {
                if (productions.length == 0) {
                    res.status(404).json({ error: { message: 'No productions found.' } })
                }
                res.json(productions.map(serializeProduction))
            })
            .catch(next)
    })

module.exports = productionsRouter