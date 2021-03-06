angular.module('git-friend', [])
  .controller('GitFriendController', function($scope, $http, $q) {

    $scope.user = {};
    $scope.friends = [];
    $scope.isAuth = false;
    $scope.remaining = null;

    $http.get('/isAuth')
      .success(function(data) {
        $scope.isAuth = data.isAuth;
        $scope.remaining = data.remaining;
      })
      .error(function() {
        $scope.isAuth = false;
      });

    $scope.loadData = function(username) {

      $scope.user = {};
      $scope.friends = [];
      $scope.error = null;

      $http.get('/user/' + username)
        .success(function(data) {
          angular.extend($scope.user, data);
          $scope.user.stars = [];
          $scope.remaining = data.remaining;
        })
        .error(function(data) {
          $scope.error = data.error;
        });

      $http.get('/stars/' + username)
        .success(function(data) {
          $scope.remaining = data.remaining;
          $scope.user.stars = _.sortBy(data.stars, 'stargazers_count');

          var starMap = _.indexBy($scope.user.stars, 'full_name');
          var friends = [];

          var repoQueries = [];
          _.forEach(starMap, function(repo) {
            if (repo.stargazers_count < 5000) {
              repoQueries.push(
                $http.get('/stargazers/' + repo.full_name)
                  .then(function(result) {
                    var starData = result.data;
                    $scope.remaining = starData.remaining;
                    starMap[repo.full_name].stargazers = starData.stargazers;

                    _.forEach(starData.stargazers, function(stargazer) {
                      if (!_.find(friends, {'login': stargazer.login})) {
                        friends.push({'login': stargazer.login, 'count': 1});
                      } else {
                        _.find(friends, {'login': stargazer.login}).count++;
                      }
                    });
                  }, function(result) {
                    $scope.error = result.data.error;
                  })
              );
            }
          });

          $q.all(repoQueries).then(function() {
            _.remove(friends, function(friend) {
              return friend.login === $scope.user.login;
            });
            $scope.friends = _.sortBy(friends, 'count').reverse().slice(0, 8);
          })
        })
        .error(function(data) {
          $scope.error = data.error;
        });
    }
  });
