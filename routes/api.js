var express = require('express')
var router = express.Router()

router.get('/', function(req, res) {
}).use('/auth', require('./auth/auth.js'))

module.exports = router