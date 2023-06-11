var express = require('express')
const https = require('https')
var router = express.Router()
const db = require('../firebase/firestore')
require('dotenv').config()

const TOKEN = process.env.LINE_ACCESS_TOKEN

router
    .post('/', function (req, res) {
        if (req.body.events[0].type === 'message') {
            var datares = 'Default'
            const event = req.body.events[0]
            if (event.message.type == 'text') {
                var text = req.body.events[0].message.text.split(' ')
                if (text[0].toLowerCase() == 'register') {
                    db.registerLine(text[1], event.source.userId).then(
                        (res) => {
                            if (res) {
                                datares = 'You have been registered!'
                            } else {
                                datares = 'Some error occured!'
                            }
                            const dataString = JSON.stringify({
                                replyToken: req.body.events[0].replyToken,
                                messages: [
                                    {
                                        type: 'text',
                                        text: datares,
                                    },
                                ],
                            })

                            const headers = {
                                'Content-Type': 'application/json',
                                Authorization: 'Bearer ' + TOKEN,
                            }

                            const webhookOptions = {
                                hostname: 'api.line.me',
                                path: '/v2/bot/message/reply',
                                method: 'POST',
                                headers: headers,
                                body: dataString,
                            }

                            const request = https.request(
                                webhookOptions,
                                (res) => {
                                    res.on('data', (d) => {
                                        process.stdout.write(d)
                                    })
                                },
                            )

                            request.on('error', (err) => {
                                console.error(err)
                            })

                            request.write(dataString)
                            request.end()
                        },
                    )
                }
            }
        }
    })
    .post('/push', function (req, res) {
        const dataString = JSON.stringify({
            to: req.body.to,
            messages: [
                {
                    type: 'text',
                    text: req.body.message,
                },
            ],
        })

        const headers = {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + TOKEN,
        }

        const webhookOptions = {
            hostname: 'api.line.me',
            path: '/v2/bot/message/push',
            method: 'POST',
            headers: headers,
            body: dataString,
        }

        const request = https.request(webhookOptions, (res) => {
            res.on('data', (d) => {
                process.stdout.write(d)
            })
        })

        request.on('error', (err) => {
            console.error(err)
        })

        request.write(dataString)
        request.end()
    })

module.exports = router
