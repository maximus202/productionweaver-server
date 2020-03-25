const express = require('express')
const xss = require('xss')
const ElementsService = require('../elements/elements-service')
const ProductionsService = require('../productions/productions-service')
const ScenesService = require('../scenes/scenes-service')
const { requireAuth } = require('../middleware/jwt-auth')

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
    .all(requireAuth)
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        const user_id = req.user_id
        ElementsService.getAllElements(knexInstance, user_id)
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
    .all(requireAuth)
    .all((req, res, next) => {
        const knexInstance = req.app.get('db')
        const element_id = req.params.element_id
        const user_id = req.user_id
        ElementsService.getById(knexInstance, element_id, user_id)
            .then(element => {
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
    .patch(jsonParser, (req, res, next) => {
        const { category, description } = req.body
        const element_id = req.params.element_id
        const updateElement = { category, description }
        const user_id = req.user_id
        const knexInstance = req.app.get('db')

        //check all inputs are in request body
        for (const [key, value] of Object.entries(updateElement)) {
            if (value == null) {
                return res
                    .status(400)
                    .json({
                        error: {
                            message: 'missing input in the request body'
                        }

                    })
                    .catch(next)
            }
        }

        ElementsService.updateElement(knexInstance, updateElement, element_id, user_id)
            .then(updateElement => {
                return res
                    .status(201)
                    .json(serializeElements(updateElement))
            })
            .catch(next)
    })

elementsRouter
    .route('/:production_id/:scene_id')
    .all(requireAuth)
    .post(jsonParser, (req, res, next) => {
        const { category, description } = req.body
        const production_id = req.params.production_id
        const scene_id = req.params.scene_id
        const owner = req.user_id
        const newElement = { category, description, production_id, scene_id, owner }
        const knexInstance = req.app.get('db')

        //check all inputs are in request body
        for (const [key, value] of Object.entries(newElement)) {
            if (value == null) {
                return res
                    .status(400)
                    .json({
                        error: {
                            message: 'missing input in the request body'
                        }

                    })
                    .catch(next)
            }
        }

        //check production_id is valid
        ProductionsService.getById(knexInstance, owner, production_id)
            .then(row => {
                if (row == null) {
                    return res
                        .status(400)
                        .json({ error: { message: 'production_id or user_id is not valid' } })
                }
            })
            .catch(next)

        //check scene_id is valid
        ScenesService.getById(knexInstance, scene_id)
            .then(row => {
                if (row == null) {
                    return res
                        .status(400)
                        .json({ error: { message: 'service_id is not valid' } })
                }
            })
            .catch(next)

        ElementsService.insertElement(knexInstance, newElement)
            .then(newElement => {
                res
                    .status(201)
                    .json(serializeElements(newElement))
            })
            .catch(next)
    })

module.exports = elementsRouter