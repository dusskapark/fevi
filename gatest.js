const
    gapi = require("googleapis"),
    profileid = '106249323',
    key = require('./node_modules/GA-export-f6aef9825ded.json'),
    scopes = 'https://www.googleapis.com/auth/analytics.readonly',
    jwt = new gapi.auth.JWT(key.client_email, null, key.private_key, scopes);

jwt.authorize(function(err, response) {
    gapi.analytics('v3').data.ga.get({
        'auth': jwt,
        'ids': 'ga:' + profileid,
        'start-date': '7daysAgo',
        'end-date': 'today',
        'metrics': 'ga:pageviews',
        'dimensions': 'ga:pagePath'
    }, function(err, result) {
        console.log(err, result);
    });
});
