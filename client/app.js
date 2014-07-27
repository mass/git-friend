angular.module('git-friend', [])
  .controller('GitFriendController', function($scope, $http) {

    $scope.user = {};

    $scope.loadData = function(username) {
      $http.get('/user/' + username)
        .success(function(data) {
          angular.extend($scope.user, data);
        });

      $http.get('/stars/' + username)
        .success(function(data) {
          $scope.user.stars = data;
        });
    }
  });
