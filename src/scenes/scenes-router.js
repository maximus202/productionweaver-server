const path = require('path')
const express = require('express')
const xss = require('xss')
const ScenesService = require('../scenes/scenes-service')
const ProductionsService = require('../productions/productions-service')
const { requireAuth } = require('../middleware/jwt-auth')

const scenesRouter = express.Router()
const jsonParser = express.json()

serializeScene = scene => ({
    id: scene.id,
    setting: xss(scene.setting),
    location: xss(scene.location),
    time_of_day: xss(scene.time_of_day),
    short_summary: xss(scene.short_summary),
    date_created: scene.date_created,
    production_id: xss(scene.production_id)
})

scenesRouter
    .route('/')
    .all(requireAuth)
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        const user_id = req.user_id
        ScenesService.getAllScenes(knexInstance, user_id)
            .then(scenes => {
                if (scenes.length == 0) {
                    res.status(400).json({ error: { message: 'No scenes found.' } })
                }
                res.status(200).json(scenes.map(serializeScene))
            })
            .catch(next)
    })

scenesRouter
    .route('/production/:production_id')
    .all(requireAuth)
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        const user_id = req.user_id
        const production_id = req.params.production_id
        ScenesService.getAllProductionScenes(knexInstance, user_id, production_id)
            .then(scenes => {
                if (scenes.length == 0) {
                    res.status(400).json({ error: { message: 'No scenes found.' } })
                }
                res.status(200).json(scenes.map(serializeScene))
            })
            .catch(next)
    })

scenesRouter
    .route('/scene/:scene_id')
    .all(requireAuth)
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        const user_id = req.user_id
        const scene_id = req.params.scene_id
        ScenesService.getById(knexInstance, user_id, scene_id)
            .then(scene => {
                if (scene.length == 0) {
                    res.status(400).json({ error: { message: 'Scene not found.' } })
                }
                res.status(200).json(scene.map(serializeScene))
            })
            .catch(next)
    })

scenesRouter
    .route('/add-scene/:production_id')
    .all(requireAuth)
    .post(jsonParser, (req, res, next) => {
        const { setting, location, time_of_day, short_summary } = req.body
        const production_id = req.params.production_id
        const owner = req.user_id
        const newScene = { setting, location, time_of_day, short_summary, production_id, owner }
        const knexInstance = req.app.get('db')
        //check all inputs are in request body
        for (const [key, value] of Object.entries(newScene)) {
            if (value == null) {
                return res
                    .status(400)
                    .json({
                        error: {
                            message: `missing ${key} in the request body`
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
                        .json({ error: { message: 'production_id or owner is not valid' } })
                }
            })
            .catch(next)

        ScenesService.insertScene(knexInstance, newScene)
            .then(newRow => {
                res
                    .status(201)
                    .json(serializeScene(newRow))
            })
            .catch(next)
    })

module.exports = scenesRouter