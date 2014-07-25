angular.module('git-friend', [])
  .controller('GitFriendController', function($scope, $http) {

  $scope.user = {};

  $http.get('https://api.github.com/users/mass')
    .success(function(data) {
      console.log(data);
      angular.extend($scope.user, _.pick(data, ['avatar_url', 'name', 'login']));
    });

  $http.get('https://api.github.com/users/mass/starred')
    .success(function(data) {
      console.log(data);

      $scope.user.stars = _.map(data, function(repo) {
        repo = _.pick(repo, ['full_name', 'html_url']);
        return repo;
      });
    });
});
