var express = require('express');
var path = require('path');
var https = require('https');
var _ = require('lodash');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var githubOAuth = require('github-oauth')({
  githubClient: process.env['GITHUB_CLIENT'],
  githubSecret: process.env['GITHUB_SECRET'],
  baseURL: 'http://localhost:3000',
  loginURI: '/login',
  callbackURI: '/auth',
  scope: 'none'
});

var app = express();

app.use(cookieParser('changeme'));
app.use(session({secret: 'changeme', resave: true, saveUninitialized: true}));

app.set('views', path.join(__dirname, '../client'));
app.engine('.html', require('ejs').renderFile);
app.use(express.static(path.join(__dirname, '../client')));

app.get('/', function(request, response) {
  response.render('index.html');
});

app.get('/login', function(request, response) {
  return githubOAuth.login(request, response);
});

app.get('/auth', function(request, response) {
  return githubOAuth.callback(request, response);
});

app.get('/isAuth', function(request, response) {
  if (!request.session || !request.session.token) {
    return response.send({'isAuth': false});
  }

  fetchData('/users/' + request.params.username, request.session.token, function(result) {
    if (result && result.status === 200) {
      response.send({'isAuth': true, 'remaining': result.headers['x-ratelimit-remaining']});
    } else {
      response.send({'isAuth': false, 'remaining': result.headers['x-ratelimit-remaining']});
    }
  });
});

app.get('/user/:username', function(request, response) {
  var token = request.session ? request.session.token : null;
  fetchData('/users/' + request.params.username, token, function(result) {
    if (result) {
      if (result.status === 200) {
        result.body = _.pick(result.body, "avatar_url", "login", "name");
        result.body.remaining = result.headers['x-ratelimit-remaining'];
        return response.send(result.body);
      } else if (result.status === 403 && result.headers['x-ratelimit-remaining'] === '0') {
        response.status(result.status);
        response.send({'status': result.status, 'error': 'rate-limit-exceeded'});
      } else if (result.status === 401 && result.body.message === 'Bad credentials') {
        request.session.token = null;
        response.status(result.status);
        response.send({'status': result.status, 'error': 'bad-credentials'});
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
  getStarredPage(stars, 1, request.params.username, 1, request.session ? request.session.token : null, response,
    function(result) {
      response.send(result);
    });
});

var getStarredPage = function(stars, pages, username, page, token, response, successCallback) {
  fetchData('/users/' + username + '/starred?page=' + page, token, function(result) {
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
          return successCallback({'stars': stars, 'remaining': result.headers['x-ratelimit-remaining']});
        } else {
          getStarredPage(stars, pages, username, page + 1, token, response, successCallback);
        }
      } else if (result.status === 403 && result.headers['x-ratelimit-remaining'] === '0') {
        response.status(result.status);
        response.send({'status': result.status, 'error': 'rate-limit-exceeded'});
      } else if (result.status === 401 && result.body.message === 'Bad credentials') {
        response.status(result.status);
        response.send({'status': result.status, 'error': 'bad-credentials'});
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

var fetchData = function(path, token, callback) {
  var options = {
    host: 'api.github.com',
    port: 443,
    path: path,
    method: 'GET',
    headers: {'user-agent': 'git-friend'}
  };

  if (token) {
    options.headers.Authorization = 'token ' + token;
  }

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

githubOAuth.on('error', function(err) {
  console.error('GitHub login error: ', err);
});

githubOAuth.on('token', function(token, response) {
  response.req.session.token = token.access_token;
  response.redirect('/');
});
