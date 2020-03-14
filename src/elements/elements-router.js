const express = require('express')
const xss = require('xss')
const ElementsService = require('../elements/elements-service')

const jsonParser = express.json()
const elementsRouter = express.Router()

const serializeElements = element => ({
    id: element.id,
    category: xss(element.category),
    description: xss(element.description),
    date_created: element.date_created,
    production_id: xss(element.production_id),
    scene_id: xss(element.scene_id)
})

elementsRouter
    .route('/')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')

        ElementsService.getAllElements(knexInstance)
            .then(elements => {
                if (elements.length == 0) {
                    res
                        .status(404)
                        .json({
                            error: {
                                message: 'no elements found'
                            }
                        })
                }
                res
                    .status(200)
                    .json(elements.map(serializeElements))
            })
            .catch(next)
    })

elementsRouter
    .route('/:element_id')
    .all((req, res, next) => {
        const knexInstance = req.app.get('db')
        const element_id = req.params.element_id
        ElementsService.getById(knexInstance, element_id)
            .then(element => {
                console.log(element)
                if (element.length == 0) {
                    return res
                        .status(404)
                        .json({
                            error: {
                                message: 'element not found'
                            }
                        })
                }
                res.element = element
                next()
            })
            .catch(next)
    })
    .get((req, res, next) => {
        res.json(res.element.map(serializeElements))
    })

module.exports = elementsRouter