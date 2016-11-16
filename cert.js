'use strict';

require('letsencrypt-express').create({

    server: 'staging'

    ,
    email: 'dusskapark@gmail.com'

    ,
    agreeTos: true

    ,
    approveDomains: ['bot.metadata.co.kr']

    ,
    app: require('express')().use('/', function(req, res) {
        res.end('Hello, World!');
    })

}).listen(80, 443);
