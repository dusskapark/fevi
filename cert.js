'use strict';

require('letsencrypt-express').create({

    server: 'staging'

    ,
    email: 'dusskapark@gmail.com'

    ,
    agreeTos: true

    ,
    approveDomains: ['ec2-52-78-228-8.ap-northeast-2.compute.amazonaws.com']

    ,
    app: require('express')().use('/', function(req, res) {
        res.end('Hello, World!');
    })

}).listen(80, 443);
