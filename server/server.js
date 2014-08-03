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
      if (result.status === 200) {
        result.body = _.pick(result.body, "avatar_url", "login", "name");
        return response.send(result.body);
      } else if (result.status === 403 && result.headers['x-ratelimit-remaining'] === '0') {
        response.status(result.status);
        response.send({'status': result.status, 'error': 'rate-limit-exceeded'});
      } else {
        response.status(result.status);
        response.send({'status': result.status, 'error': 'internal-server-error'})
      }
    } else {
      response.status(500);
      response.send({'status': 500, 'error': 'internal-server-error'})
    }
  });
});

app.get('/stars/:username', function(request, response) {
  var stars = [];
  getStarredPage(stars, 1, request.params.username, 1, response, function(stars) {
    response.send(stars);
  });
});

var getStarredPage = function(stars, pages, username, page, response, successCallback) {
  fetchData('/users/' + username + '/starred?page=' + page, function(result) {
    if (result) {
      if (result.status == 200) {
        if (result.headers.link) {
          var links = result.headers.link.replace(/ /g, '');
          pages = links.substr(links.indexOf('rel="last"') - 3, 1);
        }

        stars = stars.concat(_.map(result.body, function(repo) {
          return _.pick(repo, 'full_name', 'html_url', 'stargazers_url', 'stargazers_count');
        }));

        if (page >= pages) {
          return successCallback(stars);
        } else {
          getStarredPage(stars, pages, username, page + 1, response, successCallback);
        }
      } else if (result.status === 403 && result.headers['x-ratelimit-remaining'] === '0') {
        response.status(result.status);
        response.send({'status': result.status, 'error': 'rate-limit-exceeded'});
      } else {
        response.status(result.status);
        response.send({'status': result.status, 'error': 'internal-server-error'})
      }
    } else {
      response.status(500);
      response.send({'status': 500, 'error': 'internal-server-error'})
    }
  });
};

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
