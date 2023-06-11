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
                db.registerLine(event.source.userId, text[1])
                datares = 'Registering' + text[1] + ' to ' + event.source.userId
            }
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

        // Request header. See Messaging API reference for specification
        const headers = {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + TOKEN,
        }

        // Options to pass into the request, as defined in the http.request method in the Node.js documentation
        const webhookOptions = {
            hostname: 'api.line.me',
            path: '/v2/bot/message/reply',
            method: 'POST',
            headers: headers,
            body: dataString,
        }

        // When an HTTP POST request of message type is sent to the /webhook endpoint,
        // we send an HTTP POST request to https://api.line.me/v2/bot/message/reply
        // that is defined in the webhookOptions variable.

        // Define our request
        const request = https.request(webhookOptions, (res) => {
            res.on('data', (d) => {
                process.stdout.write(d)
            })
        })

        // Handle error
        // request.on() is a function that is called back if an error occurs
        // while sending a request to the API server.
        request.on('error', (err) => {
            console.error(err)
        })

        // Finally send the request and the data we defined
        request.write(dataString)
        request.end()
    }
})

module.exports = router
