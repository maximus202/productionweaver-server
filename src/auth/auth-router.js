const express = require('express')
const AuthService = require('./auth-service')

const authRouter = express.Router()
const jsonParser = express.json()

authRouter
    .route('/login')
    .post(jsonParser, (req, res, next) => {
        const { email, password } = req.body
        const loginUser = { email, password }
        const knexInstance = req.app.get('db')

        //Verifes username and password are supplied
        for (const [key, value] of Object.entries(loginUser))
            if (value == null)
                return res.status(400).json({
                    error: 'missing username or password in request body'
                })

        //Gets user with username
        AuthService.getUserWithUserName(knexInstance, loginUser.email)
            .then(dbUser => {
                if (!dbUser)
                    return res.status(400).json({
                        error: 'Incorrect email or password',
                    })
                //Validate password provded matches password stored in db
                return AuthService.comparePasswords(loginUser.password, dbUser.password)
                    .then(compareMatch => {

                        console.log(loginUser.password)
                        console.log(dbUser.password)
                        console.log(compareMatch)
                        if (!compareMatch)
                            return res.status(400).json({
                                error: 'Incorrect email or password',
                            })
                        //Send the JWT in the response to the user
                        const sub = dbUser.email
                        const payload = { user_id: dbUser.id }
                        res.send({
                            authToken: AuthService.createJwt(sub, payload),
                        })
                    })
            })
            .catch(next)
    })

module.exports = authRouter