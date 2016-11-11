var async = require('async');
var rp = require('request-promise'); // 페비 서버에 ajax 콜을 할 때 사용한다.
var express = require('express');
var mecab = require('mecab-ya'); // 한글 형태소 분석기
var bodyParser = require('body-parser');
var app = express();
app.use(express.static('public'));
app.use(bodyParser.urlencoded({
    extended: false
}))


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
            console.log(repos);
            var json = repos.content[0];
            var search_result = {};

            if (repos.totalElements > 0) {
                console.log("성공");
                return callback(json)

            } else {
                console.log("실패");
                return callback(json)
            }
        })
        .catch(function(err) {
            // API call failed...
        });
}

app.get('/memo', function(req, res) {
    var output = `
  <h1>memo</h1>
  <form action="/memo" method="post">
    <p>
      <input type="textarea" name="memo" placeholder="memo">
    </p>
    <p>
      <input type="submit">
    </p>
  </form>
  `;
    res.send(output);
});



app.post('/memo', function(req, res) {

    var text = req.body.memo;
    //  아버지가 방에 들어가신다. >> [ '아버지', '방' ]
    mecab.nouns(text, function(err, result) {

        var keywords = result;

        //  아버지가 방에 들어가신다. >> [ '아버지', '방' ]
        var randomIndex = Math.floor(Math.random() * keywords.length);
        var keyword = keywords[randomIndex];

        search(keyword, function(json){
          res.send('<img src=\"' + json.picture + '\">')
        });

    });



});


app.listen(3000, function() {
    console.log('Conneted 3000 port!');
});
