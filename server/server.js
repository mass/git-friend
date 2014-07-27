var express = require('express');
var path = require('path');
var https = require('https');
var _ = require('lodash');

var app = express();

app.set('views', path.join(__dirname, '../client'));
app.engine('.html', require('ejs').renderFile);
app.use(express.static(path.join(__dirname, '../client')));

app.get('/', function(request, response) {
  response.render('index.html');
});

app.get('/user/:username', function(request, response) {
  fetchData('/users/' + request.params.username, function(result) {
    if (result) {
      if (result.status == 200) {
        result.body = _.pick(result.body, "avatar_url", "login", "name");
        return response.send(result.body);
      }
      response.status(result.status).end();
    } else {
      response.status(500).end();
    }
  });
});

app.get('/stars/:username', function(request, response) {
  fetchData('/users/' + request.params.username + '/starred', function(result) {
    if (result) {
      if (result.status == 200) {
        result.body = _.map(result.body, function(repo) {
          return _.pick(repo, 'full_name', 'html_url', 'stargazers_url', 'stargazers_count');
        });
        return response.send(result.body);
      }
      response.status(result.status).end();
    } else {
      response.status(500).end();
    }
  });
});

var fetchData = function(path, callback) {
  var options = {
    host: 'api.github.com',
    port: 443,
    path: path,
    method: 'GET',
    headers: {'user-agent': 'git-friend'}
  };

  var req = https.get(options, function(res) {
    var bodyChunks = [];
    res.on('data', function(chunk) {
      bodyChunks.push(chunk);
    }).on('end', function() {
      var body = Buffer.concat(bodyChunks);
      callback({status: res.statusCode, headers: res.headers, body: JSON.parse(body.toString())});
    })
  });

  req.on('error', function(e) {
    console.log('ERROR: ' + e.message);
    callback(null);
  });
};

var server = app.listen(3000, function() {
  console.log('Listening on port: %d', server.address().port);
});
