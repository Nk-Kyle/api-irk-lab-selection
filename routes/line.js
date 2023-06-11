var express = require('express')
const https = require('https')
var router = express.Router()
const db = require('../firebase/firestore')
require('dotenv').config()

const TOKEN = process.env.LINE_ACCESS_TOKEN

router.post('/', function (req, res) {
    // If the user sends a message to your bot, send a reply message
    if (req.body.events[0].type === 'message') {
        var datares = 'Default'
        const event = req.body.events[0]
        if (event.message.type == 'text') {
            // split text by space
            var text = req.body.events[0].message.text.split(' ')
            if (text[0].toLowerCase() == 'register') {
                db.registerLine(text[1], event.source.userId).then((res) => {
                    if (res) {
                        datares = 'You have been registered!'
                    } else {
                        datares = 'Some error occured!'
                    }
                    // You must stringify reply token and message data to send to the API server
                    const dataString = JSON.stringify({
                        // Define reply token
                        replyToken: req.body.events[0].replyToken,
                        // Define reply messages
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
            } else if (text[0].toLowerCase() == 'check') {
                db.getAssistantTask(text[1]).then((task) => {
                    if (task) {
                        datares = task
                    } else {
                        datares = 'Not Found'
                    }

                    const dataString = JSON.stringify({
                        // Define reply toke
                        replyToken: req.body.events[0].replyToken,
                        // Define reply messages
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
            }
        }
    }
})

module.exports = router
