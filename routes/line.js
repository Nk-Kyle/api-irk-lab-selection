var express = require('express')
const https = require('https')
const db = require('../firebase/firestore')
var router = express.Router()
require('dotenv').config()

const TOKEN = process.env.LINE_ACCESS_TOKEN
const headers = {
    'Content-Type': 'application/json',
    Authorization: 'Bearer ' + TOKEN,
}

router.post('/', function (req, res) {
    if (req.body.events[0].type === 'message') {
        const event = req.body.events[0]
        if (event.message.type == 'text') {
            // split text by space
            var text = event.message.text.split(' ')
            if (event.source.type === 'user' && text[0] === 'register') {
                email = text[1]
                db.registerLine(email, event.source.userId).then((result) => {
                    let response = ''
                    if (result) {
                        response = 'Register success'
                    } else {
                        response = 'Register failed'
                    }
                    const webhookOptions = {
                        hostname: 'api.line.me',
                        path: '/v2/bot/message/reply',
                        method: 'POST',
                        headers: headers,
                        body: JSON.stringify({
                            replyToken: req.body.events[0].replyToken,
                            messages: [
                                {
                                    type: 'text',
                                    text: response,
                                },
                            ],
                        }),
                    }
                    const request = https.request(webhookOptions, (res) => {
                        res.on('data', (d) => {
                            process.stdout.write(d)
                        })
                    })
                    request.on('error', (err) => {
                        console.error(err)
                    })
                    request.write(webhookOptions.body)
                    request.end()
                })
            } else {
                const webhookOptions = {
                    hostname: 'api.line.me',
                    path: '/v2/bot/message/reply',
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify({
                        replyToken: req.body.events[0].replyToken,
                        messages: [
                            {
                                type: 'text',
                                text: 'Hello, world!',
                            },
                        ],
                    }),
                }
            }

            const request = https.request(webhookOptions, (res) => {
                res.on('data', (d) => {
                    process.stdout.write(d)
                })
            })
            request.on('error', (err) => {
                console.error(err)
            })
            request.write(webhookOptions.body)
            request.end()
        }
    }
    res.status(200).send({
        status: 'OK',
    })
})

module.exports = router
