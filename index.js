var _ = require('lodash');
var bodyParser = require('body-parser');
var express = require('express');
var app = express();
var config = require('./config.js');
var rp = require('request-promise'); // 페비 서버에 ajax 콜을 할 때 사용한다.
var TwitterKoreanProcessor = require('node-twitter-korean-text');


// process.env.MECAB_LIB_PATH=__dirname + "/node_modules/mecab-ya/mecab/lib";

var LineBot = require('line-bot-sdk');
var bot = LineBot.client({
    channelID: config.CHANNEL_ID,
    channelSecret: config.CHANNEL_SERECT,
    channelMID: config.CHANNEL_MID
});


app.set('port', process.env.PORT || 3003);
app.use(bodyParser.urlencoded({
    extended: false,
    limit: 2 * 1024 * 1024
}));
app.use(bodyParser.json({
    limit: 2 * 1024 * 1024
}));


// FEVI 서버에서 데이터를 수집한다.
function search(keyword, callback) {
    console.log(keyword);

    var options = {
        uri: 'http://munsangdong.cafe24.com/api/card',
        qs: {
            size: '1',
            keyword: keyword
        },
        headers: {
            'User-Agent': 'Request-Promise'
        },
        json: true // Automatically parses the JSON string in the response
    };

    rp(options)
        .then(function(repos) {
            var json = repos.content[0];
            var search_result = {};

            callback(json)

        })
        .catch(function(err) {
            // API call failed...
            console.log(err);
        });
}

app.post('/callback', function(req, res) {

    var receives = bot.createReceivesFromJSON(req.body);
    _.each(receives, function(receive) {

        if (receive.isMessage()) {

            if (receive.isText()) {

                if (receive.getText() === 'me') {
                    bot.getUserProfile(receive.getFromMid())
                        .then(function onResult(res) {
                            if (res.status === 200) {
                                var contacts = res.body.contacts;
                                if (contacts.length > 0) {
                                    bot.sendText(receive.getFromMid(), 'Hi!, you\'re ' + contacts[0].displayName);
                                }
                            }
                        }, function onError(err) {
                            console.error(err);
                        });
                } else {
                    var text = receive.getText();
                    TwitterKoreanProcessor.tokenize(text)
                        // .then((tokens) => TwitterKoreanProcessor.tokensToJsonArray(tokens))
                        .then((tokens) => TwitterKoreanProcessor.extractPhrasesSync(tokens, true, false))
                        .then((results) => {
                            var randomIndex = Math.floor(Math.random() * results.length);
                            var result = results[randomIndex];
                            var keyword = result.text;

                            search(keyword, function(json) {

                                var from = "출처 페이지: #" + json.name;

                                bot.sendVideo(receive.getFromMid(), json.source, json.picture);
                                bot.sendText(receive.getFromMid(), json.description);
                                bot.sendText(receive.getFromMid(), from);
                            });
                        }, function onError(err) {
                            console.error(err);
                        });

                    //  아버지가 방에 들어가신다. >> [ '아버지', '방' ]
                    // mecab.nouns(text, function(err, result) {
                    //
                    //     console.log(err, result);
                    //     if (result.length > 0) {
                    //         var randomIndex = Math.floor(Math.random() * result.length);
                    //         var keyword = result[randomIndex];
                    //         search(keyword, function(json) {
                    //
                    //             var from = "출처 페이지: #" + json.name;
                    //
                    //             bot.sendVideo(receive.getFromMid(), json.source, json.picture);
                    //             bot.sendText(receive.getFromMid(), json.description);
                    //             bot.sendText(receive.getFromMid(), from);
                    //         });
                    //     }
                    //     else {
                    //         var keyword = result[0];
                    //         search(keyword, function(json) {
                    //
                    //             var from = "출처 페이지: #" + json.name;
                    //
                    //             bot.sendVideo(receive.getFromMid(), json.source, json.picture);
                    //             bot.sendText(receive.getFromMid(), json.description);
                    //             bot.sendText(receive.getFromMid(), from);
                    //         });
                    //     }
                    // });
                }

            } else if (receive.isImage()) {

                bot.sendText(receive.getFromMid(), 'Thanks for the image!');

            } else if (receive.isVideo()) {

                bot.sendText(receive.getFromMid(), 'Thanks for the video!');

            } else if (receive.isAudio()) {

                bot.sendText(receive.getFromMid(), 'Thanks for the audio!');

            } else if (receive.isLocation()) {

                bot.sendLocation(
                    receive.getFromMid(),
                    receive.getText() + receive.getAddress(),
                    receive.getLatitude(),
                    receive.getLongitude()
                );

            } else if (receive.isSticker()) {

                // This only works if the BOT account have the same sticker too
                bot.sendSticker(
                    receive.getFromMid(),
                    receive.getStkId(),
                    receive.getStkPkgId(),
                    receive.getStkVer()
                );

            } else if (receive.isContact()) {

                bot.sendText(receive.getFromMid(), 'Thanks for the contact');

            } else {
                console.error('found unknown message type');
            }
        } else if (receive.isOperation()) {

            console.log('found operation');

        } else {

            console.error('invalid receive type');

        }

    });

    res.send('ok');
});

app.listen(app.get('port'), function() {
    console.log('Listening on port ' + app.get('port'));
});
