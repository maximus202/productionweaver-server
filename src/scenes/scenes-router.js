const path = require('path')
const express = require('express')
const xss = require('xss')
const ScenesService = require('../scenes/scenes-service')
const ProductionsService = require('../productions/productions-service')

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
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        ScenesService.getAllScenes(knexInstance)
            .then(scenes => {
                if (scenes.length == 0) {
                    res.status(400).json({ error: { message: 'No scenes found.' } })
                }
                res.status(200).json(scenes.map(serializeScene))
            })
            .catch(next)
    })

scenesRouter
    .route('/:production_id')
    .post(jsonParser, (req, res, next) => {
        const { setting, location, time_of_day, short_summary } = req.body
        const production_id = req.params.production_id
        const newScene = { setting, location, time_of_day, short_summary, production_id }
        const knexInstance = req.app.get('db')

        //check all inputs are in request body
        for (const [key, value] of Object.entries(newScene)) {
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
        ProductionsService.getById(knexInstance, production_id)
            .then(row => {
                if (row == null) {
                    return res
                        .status(400)
                        .json({ error: { message: 'production_id is not valid' } })
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