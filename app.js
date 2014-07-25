angular.module('git-friend', [])
  .controller('GitFriendController', function($scope, $http) {

    $scope.user = {};

    $scope.loadData = function(username) {
      $http.get('https://api.github.com/users/' + username)
        .success(function(data) {
          console.log(data);
          angular.extend($scope.user, _.pick(data, ['avatar_url', 'name', 'login']));
        });

      $http.get('https://api.github.com/users/' + username + '/starred')
        .success(function(data) {
          console.log(data);

          $scope.user.stars = _.map(data, function(repo) {
            repo = _.pick(repo, ['full_name', 'html_url', 'stargazers_url']);

            console.log(repo.stargazers_url);

            $http.get(repo.stargazers_url)
              .success(function(data) {
                console.log(data);
                console.log('hi');
              });

            return repo;
          });
        });
    }
  });
