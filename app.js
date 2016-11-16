var express = require('express');
var request = require('request');
var bodyParser = require('body-parser');
var CryptoJS = require("crypto-js");
var config = require('./key.js');
var mecab = require('mecab-ya');
// var simpleJSONFilter = require("simple-json-filter");
// var sjf = new simpleJSONFilter();
// var filter = {
//     koreanPos: 'Noun'
// };
var rp = require('request-promise'); // 페비 서버에 ajax 콜을 할 때 사용한다.
// var TwitterKoreanProcessor = require('node-twitter-korean-text');


var app = express();
app.set('port', process.env.PORT || 3003);
app.use(bodyParser.json());


function verifyRequest(req, res, next) {
console.log('verifyreq');
    var channelSignature = req.get('X-Line-Signature');
    var sha256 = CryptoJS.HmacSHA256(JSON.stringify(req.body), config.channelSecret);
    var base64encoded = CryptoJS.enc.Base64.stringify(sha256);
    if (base64encoded === channelSignature) {
        next();
    } else {
        res.status(470).end();
    }
}

// FEVI 서버에서 데이터를 수집한다.
function sendMsg(replyToken, keyword, callback) {
    console.log(keyword);

    var options = {
        uri: 'http://munsangdong.cafe24.com/api/card',
        qs: {
            // size: '5',
            keyword: keyword
        },
        headers: {
            'User-Agent': 'Request-Promise'
        },
        json: true // Automatically parses the JSON string in the response
    };

    rp(options)
        .then(function(repos) {
            if (repos.totalElements != 0) {
                var randomNm = Math.floor(Math.random() * repos.numberOfElements);
                console.log(replyToken);
                console.log(repos.content[randomNm]);
                var message = [{
                    "type": "text",
                    "text": "#" + repos.content[randomNm].name
                }, {
                    "type": "video",
                    "originalContentUrl": repos.content[randomNm].source,
                    "previewImageUrl": repos.content[randomNm].picture
                }, {
                    "type": "text",
                    "text": repos.content[randomNm].description
                }, ];
                var data = {
                    replyToken: replyToken,
                    messages: message
                };

                request({
                    method: 'POST',
                    url: config.channelUrl + '/message/reply',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + config.channelToken
                    },
                    json: data
                }, function(error, response, body) {
                    if (error) {
                        console.log(error);
                    }
                });
            } else {

                request({
                    method: 'POST',
                    url: config.channelUrl + '/message/reply',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + config.channelToken
                    },
                    json: {
                        replyToken: replyToken,
                        messages: [{
                            "type": "text",
                            "text": "검색결과가 없습니다."
                        }]
                    }

                }, function(error, response, body) {
                    if (error) {
                        console.log(error);
                    }
                });

            }

        })
        .catch(function(err) {
            // API call failed...
            console.log(err);
        });

}

app.get('/ping', function(req, res) {
    res.writeHead(200, {
        'Content-Type': 'text/plain',
        'Content-Length': 2
    });
    res.write('OK');
    res.end();
});

app.get('/hello', function(req, res){
  res.send('it works!');
});

app.post('/webhook', verifyRequest, function(req, res) {
console.log('imhere');
    var result = req.body.events;
    if (!result || !result.length) {
        res.status(470).end();
        return;
    }
    res.status(200).end();

    // One request may have serveral contents in an array.
    var content = result[0];
    // source
    var source = content.source;
    // Content type would be possibly text/image/video/audio/gps/sticker/contact.
    var type = content.type;
    // assume it's text type here.
    var timestamp = content.timestamp;

    var replyToken = content.replyToken;

    var message = content.message;

    var text = content.message.text;

    console.log(text);

    //  아버지가 방에 들어가신다. >> [ '아버지', '방' ]
    mecab.nouns(text[0], function(err, result) {

        console.log(err, result);

        if (result.length > 0) {
            var randomIndex = Math.floor(Math.random() * result.length);
            var keyword = result[randomIndex];

            sendMsg(replyToken, keyword,
                function(err) {
                    if (err) {
                        // sending message failed
                        return;
                    }
                    // message sent
                });
        } else {
            var keyword = result[0];

            sendMsg(replyToken, keyword,
                function(err) {
                    if (err) {
                        // sending message failed
                        return;
                    }
                    // message sent
                });
        }
    });
});


// TwitterKoreanProcessor.tokenize(message.text)
//     .then((tokens) => TwitterKoreanProcessor.stem(tokens))
//     .then((stemmed) => TwitterKoreanProcessor.tokensToJsonArray(stemmed))
// .then((stemmed) => TwitterKoreanProcessor.extractPhrasesSync(stemmed, true, false))
// .then((results) => {
//     var result = sjf.wantArray().exec(filter, results);
//     var randomIndex = Math.floor(Math.random() * result.length);
//     var keyword = result[randomIndex].text;
//
//     sendMsg(replyToken, keyword,
//         function(err) {
//             if (err) {
//                 // sending message failed
//                 return;
//             }
//             // message sent
//         });
//
// }, function onError(err) {
//     console.error(err);
// });

// });



app.listen(app.get('port'), function() {
    console.log('Listening on port ' + app.get('port'));
});
